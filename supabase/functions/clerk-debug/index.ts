import { corsHeaders } from "../../shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");
    const clerkPublishableKey = Deno.env.get(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    );
    const clerkWebhookSecret = Deno.env.get("CLERK_WEBHOOK_SECRET");

    // Debug information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        clerkSecretKeyExists: !!clerkSecretKey,
        clerkSecretKeyPrefix: clerkSecretKey?.substring(0, 7) + "...",
        clerkPublishableKeyExists: !!clerkPublishableKey,
        clerkPublishableKeyPrefix: clerkPublishableKey?.substring(0, 7) + "...",
        clerkWebhookSecretExists: !!clerkWebhookSecret,
      },
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url,
    };

    // Test token verification if token is provided
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");

      try {
        // Import Clerk SDK
        const { verifyToken } = await import(
          "https://esm.sh/@clerk/backend@1.15.6"
        );

        if (!clerkSecretKey) {
          throw new Error("CLERK_SECRET_KEY not found in environment");
        }

        // Verify the token
        const payload = await verifyToken(token, {
          secretKey: clerkSecretKey,
        });

        debugInfo.tokenVerification = {
          success: true,
          payload: {
            sub: payload.sub,
            iat: payload.iat,
            exp: payload.exp,
            iss: payload.iss,
          },
        };
      } catch (tokenError) {
        debugInfo.tokenVerification = {
          success: false,
          error: tokenError.message,
          stack: tokenError.stack,
        };
      }
    }

    return new Response(JSON.stringify(debugInfo, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
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
