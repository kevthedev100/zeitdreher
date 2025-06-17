import { NextResponse } from "next/server";

export async function GET() {
  // Create a safe response that doesn't expose actual keys
  const envInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      clerkSecretKeyExists: !!process.env.CLERK_SECRET_KEY,
      clerkSecretKeyPrefix: process.env.CLERK_SECRET_KEY
        ? `${process.env.CLERK_SECRET_KEY.substring(0, 7)}...`
        : "NOT_SET",
      clerkPublishableKeyExists:
        !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      clerkPublishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        ? `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 7)}...`
        : "NOT_SET",
    },
  };

  return NextResponse.json(envInfo);
}
