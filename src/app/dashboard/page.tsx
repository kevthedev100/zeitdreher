"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import DashboardTabs from "@/components/dashboard-tabs";
import AddEntryButton from "@/components/add-entry-button";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import OnboardingWizardDialog from "@/components/onboarding-wizard-dialog";

interface UserData {
  user_id: string;
  onboarded?: boolean;
  role?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          redirect("/sign-in");
          return;
        }

        setUser(user);

        // Get user data from the users table
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // PGRST116 means no rows returned - this is a new user
          if (error.code === "PGRST116") {
            console.log("New user detected, showing onboarding wizard");
            setShowOnboarding(true);
            // Create user record if it doesn't exist
            await supabase.from("users").upsert({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || "",
              email: user.email,
              onboarded: false,
              role: "employee",
            });
          } else {
            console.error("Error fetching user data:", error);
          }
        } else if (data) {
          // User exists in database
          setUserData(data);
          // Only show onboarding if onboarded is explicitly false
          setShowOnboarding(data.onboarded === false);
          console.log("User onboarded status:", data.onboarded);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in user initialization:", error);
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh user data
    if (user) {
      supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserData(data);
        });
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get user role from database or default to employee
  const userRole = userData?.role || "employee";

  return (
    <SubscriptionCheck>
      {showOnboarding && user && (
        <OnboardingWizardDialog
          userId={user.id}
          onComplete={handleOnboardingComplete}
        />
      )}
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Zeitdreher Dashboard
                </h1>
                <p className="text-gray-600">
                  Zeit erfassen, Produktivität analysieren und Arbeitsstunden
                  verwalten
                </p>
              </div>
              <AddEntryButton
                onAddEntry={() => {
                  // This will be handled by the DashboardTabs component
                  const event = new CustomEvent("openNewEntry");
                  window.dispatchEvent(event);
                }}
              />
            </div>
          </header>

          {/* Tabbed Interface */}
          <DashboardTabs
            userRole={userRole as "manager" | "employee"}
            isOnboarded={userData?.onboarded === true}
          />
        </div>
      </main>
    </SubscriptionCheck>
  );
}
