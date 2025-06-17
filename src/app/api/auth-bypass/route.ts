import { NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

/**
 * This is a temporary bypass route to help diagnose Clerk authentication issues
 * It should be removed once authentication is working properly
 */
export async function GET() {
  try {
    // Create a Supabase client without authentication
    const supabase = await createClient();

    // Get environment variables (server-side)
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    // Create a safe response that doesn't expose actual keys
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
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
      supabaseConnection: {
        connected: !!supabase,
      },
    };

    // Try to make a simple query to test Supabase connection
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .limit(1);
      debugInfo.supabaseConnection.querySuccess = !error;
      debugInfo.supabaseConnection.queryResult = error
        ? error.message
        : `Found ${data?.length || 0} users`;
    } catch (queryError) {
      debugInfo.supabaseConnection.querySuccess = false;
      debugInfo.supabaseConnection.queryError = queryError.message;
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
