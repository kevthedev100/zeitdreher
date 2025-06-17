import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    // Get environment variables (server-side)
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    // Get auth information
    let authInfo;
    try {
      const { userId, sessionId, getToken } = await auth();
      authInfo = {
        userId,
        sessionId,
        hasToken: !!getToken,
      };
    } catch (authError) {
      authInfo = {
        error: authError.message,
        stack: authError.stack,
      };
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        clerkSecretKeyExists: !!clerkSecretKey,
        clerkSecretKeyPrefix: clerkSecretKey?.substring(0, 7) + "...",
        clerkPublishableKeyExists: !!clerkPublishableKey,
        clerkPublishableKeyPrefix: clerkPublishableKey?.substring(0, 7) + "...",
        clerkWebhookSecretExists: !!clerkWebhookSecret,
      },
      auth: authInfo,
      headers: {
        userAgent: request.headers.get("user-agent"),
        authorization: request.headers.get("authorization")
          ? "Present"
          : "Missing",
        cookie: request.headers.get("cookie") ? "Present" : "Missing",
      },
      url: request.url,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Try to verify the token manually
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      return NextResponse.json(
        { error: "CLERK_SECRET_KEY not found in environment" },
        { status: 500 },
      );
    }

    try {
      // Import Clerk backend SDK
      const { verifyToken } = await import("@clerk/backend");

      const payload = await verifyToken(token, {
        secretKey: clerkSecretKey,
      });

      return NextResponse.json({
        success: true,
        payload: {
          sub: payload.sub,
          iat: payload.iat,
          exp: payload.exp,
          iss: payload.iss,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (verificationError) {
      return NextResponse.json(
        {
          success: false,
          error: verificationError.message,
          stack: verificationError.stack,
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }
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
