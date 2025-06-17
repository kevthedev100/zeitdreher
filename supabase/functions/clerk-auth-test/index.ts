import { corsHeaders } from "../shared/cors.ts";
import { getClerkUser } from "../_shared/clerk-auth.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables for debugging
    const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");
    const clerkPublishableKey = Deno.env.get(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    );
    const clerkWebhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET");

    // Get auth header
    const authHeader = req.headers.get("authorization");

    // Try to verify the token if present
    let authResult = null;
    if (authHeader) {
      authResult = await getClerkUser(authHeader);
    }

    // Debug information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        clerkSecretKeyExists: !!clerkSecretKey,
        clerkSecretKeyPrefix: clerkSecretKey
          ? `${clerkSecretKey.substring(0, 7)}...`
          : "NOT_SET",
        clerkPublishableKeyExists: !!clerkPublishableKey,
        clerkPublishableKeyPrefix: clerkPublishableKey
          ? `${clerkPublishableKey.substring(0, 7)}...`
          : "NOT_SET",
        clerkWebhookSecretExists: !!clerkWebhookSecret,
      },
      request: {
        method: req.method,
        url: req.url,
        hasAuthHeader: !!authHeader,
      },
      authResult,
    };

    return new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in clerk-auth-test:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
