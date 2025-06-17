import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirect_to = requestUrl.searchParams.get("redirect_to");
  const token = requestUrl.searchParams.get("token");

  console.log("Auth callback received with params:", {
    redirect_to,
    token: token ? "[TOKEN PRESENT]" : "[NO TOKEN]",
    url: request.url,
  });

  // If this is an email verification callback with a token, redirect to our verification page
  if (token) {
    const verifyUrl = new URL(
      `/verify-email?token=${token}`,
      requestUrl.origin,
    );
    console.log("Redirecting to verify email page:", verifyUrl.toString());
    return NextResponse.redirect(verifyUrl);
  }

  // URL to redirect to after sign in process completes
  let redirectTo = redirect_to || "dashboard/overview"; // Removed leading slash to prevent double slash

  // If redirectTo still has a leading slash, remove it
  if (redirectTo.startsWith("/")) {
    redirectTo = redirectTo.substring(1);
  }

  const finalUrl = new URL(`/${redirectTo}`, requestUrl.origin);
  console.log("Redirecting to:", finalUrl.toString());
  return NextResponse.redirect(finalUrl);
}
