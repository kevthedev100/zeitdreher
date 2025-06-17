"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { client } = useClerk();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Get verification token from URL
        const token = searchParams.get("token");

        if (!token) {
          console.error("Verification token is missing");
          setStatus("error");
          setErrorMessage("Verification token is missing");
          return;
        }

        console.log("Attempting to verify email with token");

        // Verify the email using Clerk's client
        await client.verifyEmail({ token });
        console.log("Email verification successful");
        setStatus("success");
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus("error");
        setErrorMessage(
          error.message || "Failed to verify email. Please try again.",
        );
      }
    };

    verifyToken();
  }, [searchParams, client]);

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
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Verifying Email</h2>
              <p className="text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground mb-6">
                Your email has been successfully verified.
              </p>
              <Button
                onClick={() => router.push("/dashboard/overview")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Verification Failed
              </h2>
              <p className="text-muted-foreground mb-2">{errorMessage}</p>
              <p className="text-sm text-muted-foreground mb-6">
                The verification link may have expired or is invalid.
              </p>
              <div className="space-y-3 w-full">
                <Button
                  onClick={() => router.push("/sign-in")}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
