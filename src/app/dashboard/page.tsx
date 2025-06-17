"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    // Redirect to overview tab by default once user is loaded
    if (isLoaded) {
      if (!isSignedIn) {
        redirect("/sign-in");
      } else {
        redirect("/dashboard/overview");
      }
    }
  }, [isLoaded, isSignedIn]);

  // Loading state
  return (
    <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Redirecting to dashboard...</div>
    </div>
  );
}
