"use client";

// Client-side Clerk debugging utilities
export const debugClerkConfiguration = () => {
  const config = {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    publishableKeyPrefix:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 7),
    environment: process.env.NODE_ENV,
    bypassAuth: process.env.NEXT_PUBLIC_BYPASS_CLERK_AUTH === "true",
    timestamp: new Date().toISOString(),
  };

  console.log("Clerk Configuration Debug:", config);
  return config;
};

export const debugClerkSession = async () => {
  try {
    // This will only work in client components with useUser hook
    const response = await fetch("/api/clerk-debug", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Clerk Session Debug:", data);
    return data;
  } catch (error) {
    console.error("Failed to debug Clerk session:", error);
    return { error: error.message };
  }
};

// Check if environment variables are properly loaded
export const checkEnvironmentVariables = () => {
  const vars = {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BYPASS_CLERK_AUTH: process.env.NEXT_PUBLIC_BYPASS_CLERK_AUTH,
  };

  console.log("Environment Variables Check:", {
    ...vars,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: vars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      ? vars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 10) + "..."
      : "NOT SET",
  });

  return vars;
};

// Test token verification via API
export const testTokenVerification = async (token: string) => {
  try {
    const response = await fetch("/api/clerk-debug", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    console.log("Token Verification Result:", data);
    return data;
  } catch (error) {
    console.error("Failed to verify token:", error);
    return { error: error.message };
  }
};

// Test edge function
export const testEdgeFunction = async () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/clerk-auth-test`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    console.log("Edge Function Test Result:", data);
    return data;
  } catch (error) {
    console.error("Failed to test edge function:", error);
    return { error: error.message };
  }
};

// Check auth bypass
export const checkAuthBypass = async () => {
  try {
    const response = await fetch("/api/auth-bypass");
    const data = await response.json();
    console.log("Auth Bypass Check:", data);
    return data;
  } catch (error) {
    console.error("Auth Bypass Check Failed:", error);
    return { error: error.message };
  }
};

// Comprehensive debug function
export const runFullClerkDebug = async () => {
  console.log("=== Running Full Clerk Debug ===");

  // Check environment variables
  const envCheck = checkEnvironmentVariables();

  // Check Clerk configuration
  const configCheck = debugClerkConfiguration();

  // Test session debug
  const sessionCheck = await debugClerkSession();

  // Test auth bypass
  const bypassCheck = await checkAuthBypass();

  // Test edge function
  let edgeFunctionCheck = null;
  try {
    edgeFunctionCheck = await testEdgeFunction();
  } catch (error) {
    edgeFunctionCheck = { error: error.message };
  }

  return {
    environment: envCheck,
    configuration: configCheck,
    session: sessionCheck,
    authBypass: bypassCheck,
    edgeFunction: edgeFunctionCheck,
    timestamp: new Date().toISOString(),
  };
};
