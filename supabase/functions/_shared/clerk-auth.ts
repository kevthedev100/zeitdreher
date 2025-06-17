// Shared Clerk authentication utilities for edge functions

export const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY") || "";
export const clerkPublishableKey =
  Deno.env.get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") || "";

export const verifyClerkJWT = async (token: string) => {
  try {
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not set in environment variables");
    }

    // Import Clerk SDK
    const { verifyToken } = await import(
      "https://esm.sh/@clerk/backend@1.15.6"
    );

    // Verify the token
    const payload = await verifyToken(token, {
      secretKey: clerkSecretKey,
    });

    return {
      success: true,
      payload,
      userId: payload.sub,
    };
  } catch (error) {
    console.error("Clerk JWT verification failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getClerkUser = async (authHeader: string | null) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { success: false, error: "No valid authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  return await verifyClerkJWT(token);
};
