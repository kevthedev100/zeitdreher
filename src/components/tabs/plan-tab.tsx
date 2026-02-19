"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanTabProps {
  userId: string | null;
}

interface Plan {
  id: string;
  name?: string;
  nickname?: string;
  product: string;
  unit_amount: number;
  amount?: number;
  currency: string;
  interval?: string;
  description?: string;
  popular?: boolean;
  custom?: boolean;
  recurring: {
    interval: string;
    interval_count: number;
  };
}

interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  trial_end: number | null;
  cancel_at_period_end: boolean;
  metadata?: {
    quantity?: string;
    [key: string]: any;
  };
  items: {
    data: Array<{
      quantity: number;
      price: {
        unit_amount: number;
        currency: string;
      };
    }>;
  };
}

export default function PlanTab({ userId }: PlanTabProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [licenseCount, setLicenseCount] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchPlansAndSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch available plans
        const { data: plansData, error: plansError } =
          await supabase.functions.invoke("supabase-functions-get-plans");

        if (plansError) {
          throw new Error(`Error fetching plans: ${plansError.message}`);
        }

        setPlans(plansData || []);

        // Fetch user's subscription if they're logged in
        if (userId) {
          const { data: subscriptionData, error: subscriptionError } =
            await supabase
              .from("subscriptions")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

          if (subscriptionError && subscriptionError.code !== "PGRST116") {
            console.error("Error fetching subscription:", subscriptionError);
          } else if (subscriptionData) {
            setSubscription(subscriptionData as unknown as Subscription);
          }
        }
      } catch (err: any) {
        console.error("Error loading plans or subscription:", err);
        setError(err.message || "Failed to load subscription information");
      } finally {
        setLoading(false);
      }
    };

    fetchPlansAndSubscription();
  }, [supabase, userId]);

  const handleCheckout = async (priceId: string) => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    try {
      setCheckoutLoading(true);
      setError(null);

      // Get user email for the checkout session
      const { data: userData } = await supabase
        .from("users")
        .select("email")
        .eq("user_id", userId)
        .single();

      if (!userData?.email) {
        throw new Error("User email not found");
      }

      console.log(
        `Creating checkout for plan ${priceId} with ${licenseCount} licenses`,
      );

      // Create checkout session
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            price_id: priceId,
            user_id: userId,
            quantity: licenseCount,
            return_url: `${window.location.origin}/dashboard/plan`,
          },
          headers: {
            "X-Customer-Email": userData.email,
          },
        },
      );

      if (error) {
        throw new Error(`Checkout error: ${error.message}`);
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      setError(err.message || "Failed to create checkout session");
      setCheckoutLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getTrialDaysLeft = () => {
    if (!subscription?.trial_end) return 14; // Default 14 days for new users
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.max(
      0,
      Math.ceil((subscription.trial_end - now) / (60 * 60 * 24)),
    );
    return daysLeft;
  };

  const getDaysUntilRenewal = () => {
    if (!subscription?.current_period_end) return 0;
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.max(
      0,
      Math.ceil((subscription.current_period_end - now) / (60 * 60 * 24)),
    );
    return daysLeft;
  };

  const getSubscriptionStatus = (): string => {
    if (!subscription) return "trial"; // Default to trial for new users

    if (subscription.status === "trialing") {
      return "trialing";
    } else if (subscription.status === "active") {
      return "active";
    } else if (
      subscription.status === "canceled" &&
      subscription.cancel_at_period_end
    ) {
      return "canceling";
    } else {
      return "trial"; // Default to trial instead of inactive
    }
  };

  const renderSubscriptionDetails = () => {
    const status = getSubscriptionStatus();
    const trialDaysLeft = getTrialDaysLeft();
    const daysUntilRenewal = getDaysUntilRenewal();
    // Get quantity from metadata or from subscription items
    const licenseQuantity = subscription?.metadata?.quantity
      ? parseInt(subscription.metadata.quantity, 10)
      : subscription?.items?.data?.[0]?.quantity || 1; // Default to 1 license
    const pricePerLicense =
      subscription?.items?.data?.[0]?.price?.unit_amount || 0;
    const currency = subscription?.items?.data?.[0]?.price?.currency || "eur";

    if (status === "trialing") {
      return (
        <Card className="mb-8 bg-white border border-gray-200 rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-gray-500" />
              Kostenlose Testphase
            </CardTitle>
            <CardDescription className="text-gray-500">
              Sie befinden sich in der 14-tägigen kostenlosen Testphase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Verbleibende Tage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trialDaysLeft} Tage
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gray-900 h-2.5 rounded-full"
                  style={{ width: `${((14 - trialDaysLeft) / 14) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Nach Ablauf der Testphase wird Ihnen automatisch{" "}
              {formatCurrency(pricePerLicense, currency)} pro Lizenz berechnet.
            </p>
          </CardFooter>
        </Card>
      );
    } else if (status === "active") {
      return (
        <Card className="mb-8 bg-white border border-gray-200 rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CheckCircle className="h-5 w-5 text-gray-500" />
              Aktives Abonnement
            </CardTitle>
            <CardDescription className="text-gray-500">
              {licenseQuantity} {licenseQuantity === 1 ? "Lizenz" : "Lizenzen"}{" "}
              für {formatCurrency(pricePerLicense, currency)} pro Lizenz/Monat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nächste Abrechnung in</p>
                <p className="text-2xl font-bold text-gray-900">
                  {daysUntilRenewal} Tagen
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gray-900 h-2.5 rounded-full"
                  style={{ width: `${((30 - daysUntilRenewal) / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Gesamtbetrag:{" "}
              {formatCurrency(pricePerLicense * licenseQuantity, currency)} pro
              Monat
            </p>
          </CardFooter>
        </Card>
      );
    } else if (status === "canceling") {
      return (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Abonnement wird beendet
            </CardTitle>
            <CardDescription>
              Ihr Abonnement endet am Ende der aktuellen Abrechnungsperiode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Verbleibende Tage</p>
                <p className="text-2xl font-bold">{daysUntilRenewal} Tage</p>
              </div>
              <div className="w-full bg-yellow-100 rounded-full h-2.5">
                <div
                  className="bg-yellow-600 h-2.5 rounded-full"
                  style={{ width: `${((30 - daysUntilRenewal) / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                alert("Diese Funktion ist noch nicht implementiert")
              }
            >
              Abonnement fortsetzen
            </Button>
          </CardFooter>
        </Card>
      );
    } else {
      return (
        <Card className="mb-8 bg-white border border-gray-200 rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-gray-500" />
              Kostenlose Testphase
            </CardTitle>
            <CardDescription className="text-gray-500">
              Sie befinden sich in der 14-tägigen kostenlosen Testphase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Verbleibende Tage</p>
                <p className="text-2xl font-bold text-gray-900">14 Tage</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gray-900 h-2.5 rounded-full"
                  style={{ width: `0%` }}
                ></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Nach Ablauf der Testphase können Sie einen Plan wählen oder die
              kostenlose Version weiter nutzen.
            </p>
          </CardFooter>
        </Card>
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Lade Abonnementinformationen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Abonnement & Lizenzen
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {renderSubscriptionDetails()}

      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Verfügbare Pläne
      </h2>

      <div className="flex flex-col gap-6 mb-8">
        {plans.length > 0 ? (
          plans.map((plan) => {
            const getBorderColor = () => {
              if (plan.popular) return "border-2 border-blue-500 shadow-xl";
              if (
                plan.id === "big-team" ||
                plan.name === "Highperformer Organization"
              )
                return "border-2 border-purple-500";
              return "border-2 border-gray-200";
            };

            const getButtonColor = () => {
              if (
                plan.id === "big-team" ||
                plan.name === "Highperformer Organization"
              )
                return "bg-purple-600 hover:bg-purple-700";
              if (plan.custom)
                return "bg-gray-100 hover:bg-gray-200 text-gray-700";
              return "bg-blue-600 hover:bg-blue-700";
            };

            const getPlanFeatures = (planId: string) => {
              switch (planId) {
                case "einzellizenz":
                  return [
                    "Zeiterfassung mit Spracheingabe",
                    "Kategorien und Aktivitäten verwalten",
                    "Detaillierte Berichte und Analysen",
                    "Export-Funktionen",
                    "Mobile App verfügbar",
                  ];
                case "highperformer-team":
                  return [
                    "Alle Einzellizenz-Features",
                    "Team-Management",
                    "Erweiterte Berichte",
                    "Projektbasierte Zeiterfassung",
                    "Team-Performance-Analysen",
                    "Prioritäts-Support",
                  ];
                case "highperformer-organization":
                  return [
                    "Alle Team-Features",
                    "Unbegrenzte Benutzer",
                    "Erweiterte Administrationstools",
                    "Custom Branding",
                    "API-Zugang",
                    "Dedicated Account Manager",
                  ];
                case "enterprise":
                  return [
                    "Alle Organization-Features",
                    "On-Premise Installation",
                    "Individuelle Anpassungen",
                    "24/7 Premium Support",
                    "Schulungen und Onboarding",
                    "SLA-Garantien",
                  ];
                default:
                  return [];
              }
            };

            const getPlanDescription = (planId: string) => {
              switch (planId) {
                case "einzellizenz":
                  return "Perfekt für Einzelpersonen und Freelancer";
                case "team":
                  return "Ideal für kleine bis mittlere Teams";
                case "big-team":
                  return "Für große Organisationen und Unternehmen";
                case "enterprise":
                  return "Maßgeschneiderte Lösungen für Großunternehmen";
                default:
                  return plan.description || "";
              }
            };

            const features = getPlanFeatures(plan.id);
            const description = getPlanDescription(plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${getBorderColor()} hover:shadow-lg transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-30" />
                )}
                <CardHeader className="relative">
                  {plan.popular && (
                    <div className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit mb-4">
                      Beliebt
                    </div>
                  )}
                  <CardTitle className="text-xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.custom
                        ? "Auf Anfrage"
                        : formatCurrency(plan.amount || 0, "eur")}
                    </span>
                    {!plan.custom && (
                      <span className="text-gray-600">
                        /{plan.interval === "month" ? "Monat" : plan.interval}
                      </span>
                    )}
                  </CardDescription>
                  <p className="text-gray-600 mt-2">{description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!plan.custom && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <label
                          htmlFor={`licenseCount-${plan.id}`}
                          className="text-sm font-medium"
                        >
                          Anzahl der Lizenzen:
                        </label>
                        <select
                          id={`licenseCount-${plan.id}`}
                          className="border rounded px-2 py-1"
                          defaultValue="1"
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setLicenseCount(value);
                          }}
                        >
                          {[1, 2, 3, 4, 5, 10, 15, 20].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-right text-lg font-semibold mb-2">
                        Gesamt:{" "}
                        {formatCurrency((plan.amount || 0) * licenseCount, "eur")} /
                        Monat
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="relative">
                  <Button
                    className={`w-full py-6 text-lg font-medium ${getButtonColor()}`}
                    onClick={() => {
                      if (plan.custom) {
                        window.location.href = "mailto:kontakt@timefocusai.de";
                      } else {
                        handleCheckout(plan.id);
                      }
                    }}
                    disabled={checkoutLoading && !plan.custom}
                  >
                    {plan.custom ? (
                      "Kontakt aufnehmen"
                    ) : checkoutLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird bearbeitet...
                      </>
                    ) : getSubscriptionStatus() === "inactive" ? (
                      "14 Tage kostenlos testen"
                    ) : (
                      `${licenseCount} Lizenz${licenseCount !== 1 ? "en" : ""} kaufen`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <Card className="bg-white border border-gray-200 rounded-lg shadow-none">
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                Keine Pläne verfügbar. Bitte versuchen Sie es später erneut.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
