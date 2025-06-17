"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (mounted && isLoaded && isSignedIn) {
      console.log("User already signed in, redirecting to dashboard");
      router.push("/dashboard/overview");
    }
  }, [mounted, isLoaded, isSignedIn, router]);

  // Show loading while checking user status or if already signed in
  if (!mounted || !isLoaded || isSignedIn) {
    return (
      <>
        <nav className="w-full border-b border-gray-200 bg-white py-2">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <Link
              href="/"
              className="text-xl font-bold text-black flex items-center gap-2"
            >
              <Clock className="w-6 h-6" />
              Zeitdreher
            </Link>
          </div>
        </nav>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="w-full border-b border-gray-200 bg-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-bold text-black flex items-center gap-2"
          >
            <Clock className="w-6 h-6" />
            Zeitdreher
          </Link>
          <div className="flex gap-4 items-center">
            <Link
              href="/sign-up"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
            >
              Registrieren
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full shadow-none p-0 border-0",
                header: "text-center",
                headerTitle: "text-3xl font-semibold tracking-tight",
                headerSubtitle: "text-sm text-muted-foreground",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                formFieldInput:
                  "rounded-md border border-input bg-background px-3 py-2",
                footerAction:
                  "text-primary font-medium hover:underline transition-all",
                socialButtonsBlockButton:
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
                formFieldLabel: "text-sm font-medium text-foreground",
                identityPreviewText: "text-sm text-muted-foreground",
                identityPreviewEditButton: "text-primary hover:underline",
              },
            }}
            fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard/overview"
            redirectUrl="/dashboard/overview"
            forceRedirectUrl="/dashboard/overview"
          />
        </div>
      </div>
    </>
  );
}
