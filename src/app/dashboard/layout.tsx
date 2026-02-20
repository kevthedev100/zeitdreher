"use client";

import { createClient } from "../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import DashboardTabs from "@/components/dashboard-tabs-refactored";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import OnboardingWizardDialog from "@/components/onboarding-wizard-dialog";

interface UserData {
  user_id: string;
  onboarded?: boolean;
  role?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            try {
              // Create user record with proper headers
              await supabase
                .from("users")
                .upsert(
                  {
                    user_id: user.id,
                    full_name: user.user_metadata?.full_name || "",
                    email: user.email || "",
                    onboarded: false,
                    role: "member",
                  },
                  {
                    onConflict: "user_id",
                  },
                )
                .throwOnError();

              console.log("Created new user record for:", user.id);
            } catch (insertError) {
              console.error("Error creating user record:", insertError);
            }
          } else {
            console.error("Error fetching user data:", error);
          }
        } else if (data) {
          // User exists in database
          setUserData(data);
          // Only show onboarding if onboarded is explicitly false
          setShowOnboarding(data.onboarded === false);
          console.log("User onboarded status:", data.onboarded);

          // Check if user has organization membership and get their effective role
          try {
            const { data: hierarchyData } = await supabase
              .from("organization_hierarchy")
              .select("user_role, organization_name")
              .eq("user_id", user.id)
              .single();

            if (hierarchyData) {
              console.log(
                `User role in organization: ${hierarchyData.user_role} at ${hierarchyData.organization_name}`,
              );
              // Update user data with organization role if different
              if (hierarchyData.user_role !== data.role) {
                setUserData((prev) =>
                  prev ? { ...prev, role: hierarchyData.user_role } : null,
                );
              }
            }
          } catch (orgError) {
            console.log("User not in any organization yet, using default role");
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error in user initialization:", error);
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  const handleOnboardingComplete = async () => {
    // Immediately update UI state to prevent wizard from showing again
    setShowOnboarding(false);
    setUserData((prev) =>
      prev
        ? { ...prev, onboarded: true }
        : { user_id: user?.id || "", onboarded: true, role: "member" },
    );

    // Update user's onboarded status in the database
    if (user) {
      try {
        console.log("Updating onboarded status for user:", user.id);

        const { error } = await supabase
          .from("users")
          .update({ onboarded: true })
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating onboarded status:", error);
          return;
        }

        console.log("User onboarded status updated successfully in database");
      } catch (err) {
        console.error("Exception in handleOnboardingComplete:", err);

        // Fallback: try to upsert the record if update failed
        try {
          await supabase
            .from("users")
            .upsert(
              {
                user_id: user.id,
                full_name: user.user_metadata?.full_name || "",
                email: user.email || "",
                onboarded: true,
                role: "employee",
              },
              {
                onConflict: "user_id",
              },
            )
            .throwOnError();

          console.log("Fallback: User record upserted with onboarded=true");
        } catch (upsertError) {
          console.error("Fallback upsert also failed:", upsertError);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Wird geladen...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userRole = userData?.role || "member";

  return (
    <SubscriptionCheck>
      {showOnboarding && user && userData?.onboarded !== true && (
        <OnboardingWizardDialog
          userId={user.id}
          onComplete={handleOnboardingComplete}
        />
      )}
      <DashboardTabs
        userRole={userRole as "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer"}
        isOnboarded={userData?.onboarded === true}
      >
        {children}
      </DashboardTabs>
    </SubscriptionCheck>
  );
}
