"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { supabase } from "../../supabase/supabase";

export default function PricingCard({
  item,
  user,
}: {
  item: any;
  user: User | null;
}) {
  // Handle checkout process
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = "/login?redirect=pricing";
      return;
    }

    // Handle enterprise plan differently
    if (item.custom) {
      window.location.href = "mailto:kontakt@timefocusai.de";
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            price_id: priceId,
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard`,
          },
          headers: {
            "X-Customer-Email": user.email || "",
          },
        },
      );

      if (error) {
        throw error;
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  const getBorderColor = () => {
    if (item.popular) return "border-2 border-blue-500 shadow-xl scale-105";
    if (item.id === "big-team" || item.name === "Highperformer Organization")
      return "border-2 border-purple-500";
    return "border border-gray-200";
  };

  const getButtonColor = () => {
    if (item.id === "big-team" || item.name === "Highperformer Organization")
      return "bg-purple-600 hover:bg-purple-700";
    if (item.custom) return "bg-gray-100 hover:bg-gray-200 text-gray-700";
    return "bg-blue-600 hover:bg-blue-700";
  };

  return (
    <Card className={`w-[350px] relative overflow-hidden ${getBorderColor()}`}>
      {item.popular && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-30" />
      )}
      <CardHeader className="relative">
        {item.popular && (
          <div className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit mb-4">
            Am beliebtesten
          </div>
        )}
        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
          {item.name}
        </CardTitle>
        <CardDescription className="flex items-baseline gap-2 mt-2">
          <span className="text-4xl font-bold text-gray-900">
            {item.custom ? "Auf Anfrage" : `${item?.amount / 100}€`}
          </span>
          {!item.custom && (
            <span className="text-gray-600">
              /{item?.interval === "month" ? "Monat" : item?.interval}
            </span>
          )}
        </CardDescription>
        <p className="text-gray-600 mt-2">{item.description}</p>
      </CardHeader>

      <div className="px-6 pb-4">
        <ul className="space-y-3">
          {item.features?.map((feature: string, index: number) => (
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
      </div>

      <CardFooter className="relative">
        <Button
          onClick={async () => {
            await handleCheckout(item.id);
          }}
          className={`w-full py-6 text-lg font-medium ${getButtonColor()}`}
        >
          {item.custom ? "Kontakt aufnehmen" : "Loslegen"}
        </Button>
      </CardFooter>
    </Card>
  );
}
