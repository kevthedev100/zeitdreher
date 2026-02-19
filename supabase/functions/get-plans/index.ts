import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return static pricing plans instead of fetching from Stripe
    const staticPlans = [
      {
        id: "einzellizenz",
        name: "Einzellizenz",
        amount: 4900, // 49€ in cents
        interval: "month",
        description: "Perfekt für Einzelpersonen und Freelancer",
        features: [
          "Zeiterfassung mit Spracheingabe",
          "Kategorien und Aktivitäten verwalten",
          "Detaillierte Berichte und Analysen",
          "Export-Funktionen",
          "Mobile App verfügbar",
        ],
        popular: false,
      },
      {
        id: "team",
        name: "Highperformer Team",
        amount: 29900, // 299€ in cents
        interval: "month",
        description: "Ideal für kleine bis mittlere Teams",
        features: [
          "Alle Einzellizenz-Features",
          "Team-Management",
          "Erweiterte Berichte",
          "Projektbasierte Zeiterfassung",
          "Team-Performance-Analysen",
          "Prioritäts-Support",
        ],
        popular: true,
      },
      {
        id: "big-team",
        name: "Highperformer Organization",
        amount: 59900, // 599€ in cents
        interval: "month",
        description: "Für große Organisationen und Unternehmen",
        features: [
          "Alle Team-Features",
          "Unbegrenzte Benutzer",
          "Erweiterte Administrationstools",
          "Custom Branding",
          "API-Zugang",
          "Dedicated Account Manager",
        ],
        popular: false,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        amount: 0, // Custom pricing
        interval: "custom",
        description: "Maßgeschneiderte Lösungen für Großunternehmen",
        features: [
          "Alle Organization-Features",
          "On-Premise Installation",
          "Individuelle Anpassungen",
          "24/7 Premium Support",
          "Schulungen und Onboarding",
          "SLA-Garantien",
        ],
        popular: false,
        custom: true,
      },
    ];

    return new Response(JSON.stringify(staticPlans), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error getting plans:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
