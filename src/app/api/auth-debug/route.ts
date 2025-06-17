import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get environment variables (server-side)
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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
      },
      request: {
        url: request.url,
        method: request.method,
        headers: {
          userAgent: request.headers.get("user-agent"),
          host: request.headers.get("host"),
          authorization: request.headers.get("authorization")
            ? "[PRESENT]"
            : "[NOT PRESENT]",
        },
      },
    };

    return NextResponse.json(debugInfo, { status: 200 });
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
