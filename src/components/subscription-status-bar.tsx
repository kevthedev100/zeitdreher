"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SubscriptionStatusBar() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Check user role first
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
        }

        if (false) {
          setSubscription({
            status: "active",
            metadata: { quantity: "1" },
          });
          return;
        }

        // Get user's subscription
        const { data, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (subscriptionError && subscriptionError.code !== "PGRST116") {
          console.error("Error fetching subscription:", subscriptionError);
          setError("Failed to load subscription status");
        } else if (data) {
          setSubscription(data);
        }
      } catch (err) {
        console.error("Error loading subscription:", err);
        setError("Failed to load subscription status");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();

    // Set up a listener for subscription changes
    const channel = supabase
      .channel("subscription_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
        },
        () => {
          fetchSubscription();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const getTrialDaysLeft = () => {
    if (!subscription?.trial_end) return 14; // Default 14 days for new users
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.max(
      0,
      Math.ceil((subscription.trial_end - now) / (60 * 60 * 24)),
    );
    return daysLeft;
  };

  const getSubscriptionStatus = () => {
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

  if (loading) {
    return (
      <div className="w-full bg-gray-100 p-2 text-center text-sm text-gray-500 flex items-center justify-center">
        <Loader2 className="h-3 w-3 animate-spin mr-2" />
        Lade Abonnementstatus...
      </div>
    );
  }

  if (error) {
    return null; // Don't show anything if there's an error
  }

  const status = getSubscriptionStatus();
  const trialDaysLeft = getTrialDaysLeft();
  // Get quantity from metadata or from subscription items
  const licenseQuantity = subscription?.metadata?.quantity
    ? parseInt(subscription.metadata.quantity, 10)
    : subscription?.items?.data?.[0]?.quantity || 1; // Default to 1 license

  if (false as boolean) {
    return (
      <div className="w-full bg-purple-50 p-2 text-center text-sm text-purple-700 flex items-center justify-center">
        <CheckCircle className="h-3 w-3 mr-2" />
        Team-Mitglied: Vollzugang durch Administrator
      </div>
    );
  } else if (status === "trial" || status === "trialing") {
    const progressPercentage = ((14 - trialDaysLeft) / 14) * 100;

    return (
      <div className="w-full bg-blue-50 p-3">
        <div className="flex items-center justify-center mb-2">
          <Clock className="h-3 w-3 mr-2 text-blue-700" />
          <span className="text-sm text-blue-700">
            Testphase: {trialDaysLeft} {trialDaysLeft === 1 ? "Tag" : "Tage"}{" "}
            übrig
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    );
  } else if (status === "active") {
    return (
      <div className="w-full bg-green-50 p-2 text-center text-sm text-green-700 flex items-center justify-center">
        <CheckCircle className="h-3 w-3 mr-2" />
        Aktives Abonnement: {licenseQuantity}{" "}
        {licenseQuantity === 1 ? "Lizenz" : "Lizenzen"}
      </div>
    );
  } else if (status === "canceling") {
    return (
      <div className="w-full bg-yellow-50 p-2 text-center text-sm text-yellow-700 flex items-center justify-center">
        <Clock className="h-3 w-3 mr-2" />
        Abonnement endet am Ende der aktuellen Periode
      </div>
    );
  } else {
    return (
      <div className="w-full bg-gray-100 p-2 text-center text-sm text-gray-700 flex items-center justify-center">
        <AlertCircle className="h-3 w-3 mr-2" />
        Kein aktives Abonnement -{" "}
        <a href="/dashboard/plan" className="underline ml-1">
          Jetzt starten
        </a>
      </div>
    );
  }
}
