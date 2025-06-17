"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardTabs from "@/components/dashboard-tabs-refactored";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState<"manager" | "employee" | "admin">(
    "employee",
  );
  const [isOnboarded, setIsOnboarded] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isLoaded && isSignedIn) {
      // In a real app, you'd fetch the user role from your database
      // For now, we'll use a default role
      setUserRole("employee");
      setIsOnboarded(true);
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not signed in (redirect will happen)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardTabs userRole={userRole} isOnboarded={isOnboarded}>
        {children}
      </DashboardTabs>
    </div>
  );
}
