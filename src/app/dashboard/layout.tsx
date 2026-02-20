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
          if (error.code === "PGRST116") {
            // Process any pending admin invitation for this user
            const { data: pendingInv } = await supabase
              .from("admin_invitations")
              .select("*")
              .eq("email", user.email!)
              .eq("accepted", false)
              .gt("expires_at", new Date().toISOString())
              .limit(1)
              .single();

            if (pendingInv) {
              // Create user record and process invitation
              const { data: newUser } = await supabase
                .from("users")
                .upsert(
                  {
                    id: user.id,
                    user_id: user.id,
                    email: user.email || "",
                    full_name: user.user_metadata?.full_name || "",
                    onboarded: true,
                    role: "member",
                    token_identifier: crypto.randomUUID(),
                  },
                  { onConflict: "id" },
                )
                .select("id")
                .single();

              if (newUser) {
                await supabase.from("organization_members").upsert(
                  {
                    organization_id: pendingInv.organization_id,
                    user_id: newUser.id,
                    role: "member",
                    invited_by: pendingInv.invited_by,
                    joined_at: new Date().toISOString(),
                    is_active: true,
                  },
                  { onConflict: "organization_id,user_id" },
                );

                await supabase
                  .from("admin_invitations")
                  .update({ accepted: true, accepted_at: new Date().toISOString() })
                  .eq("id", pendingInv.id);

                setUserData({ user_id: user.id, onboarded: true, role: "member" });
              }
            } else {
              setShowOnboarding(true);
              setUserData({ user_id: user.id, onboarded: false });
            }
          } else {
            console.error("Error fetching user data:", error);
          }
        } else if (data) {
          setUserData(data);
          setShowOnboarding(data.onboarded === false);

          // Process any unprocessed admin invitation
          if (data.role !== "geschaeftsfuehrer" && data.role !== "admin") {
            const { data: pendingInv } = await supabase
              .from("admin_invitations")
              .select("*")
              .eq("email", user.email!)
              .eq("accepted", false)
              .gt("expires_at", new Date().toISOString())
              .limit(1)
              .single();

            if (pendingInv) {
              await supabase.from("organization_members").upsert(
                {
                  organization_id: pendingInv.organization_id,
                  user_id: data.id || user.id,
                  role: "member",
                  invited_by: pendingInv.invited_by,
                  joined_at: new Date().toISOString(),
                  is_active: true,
                },
                { onConflict: "organization_id,user_id" },
              );

              await supabase
                .from("admin_invitations")
                .update({ accepted: true, accepted_at: new Date().toISOString() })
                .eq("id", pendingInv.id);

              await supabase
                .from("users")
                .update({ role: "member", onboarded: true })
                .eq("user_id", user.id);

              setUserData((prev) => prev ? { ...prev, onboarded: true, role: "member" } : null);
              setShowOnboarding(false);
            }
          }

          // Check if user has organization membership and get their effective role
          try {
            const { data: hierarchyData } = await supabase
              .from("organization_hierarchy")
              .select("user_role, organization_name")
              .eq("user_id", user.id)
              .single();

            if (hierarchyData) {
              if (hierarchyData.user_role !== data.role) {
                setUserData((prev) =>
                  prev ? { ...prev, role: hierarchyData.user_role } : null,
                );
              }
            }
          } catch (orgError) {
            // User not in any organization yet
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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setUserData((prev) =>
      prev ? { ...prev, onboarded: true } : { user_id: user?.id || "", onboarded: true },
    );
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
