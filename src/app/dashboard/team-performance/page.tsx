"use client";

import { Suspense } from "react";
import TeamPerformanceTab from "@/components/tabs/team-performance-tab";
import { createClient } from "../../../../supabase/client";
import { useEffect, useState } from "react";

export default function TeamPerformancePage() {
  const [userRole, setUserRole] = useState<"admin" | "manager" | "employee">(
    "employee",
  );
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        // Get user data and organization role
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (userData) {
          // Get user's role in their primary organization
          const { data: orgMember } = await supabase
            .from("organization_members")
            .select("role")
            .eq("user_id", userData.id)
            .eq("is_active", true)
            .order("created_at", { ascending: true })
            .limit(1)
            .single();

          if (orgMember) {
            setUserRole(orgMember.role as "admin" | "manager" | "member");
          } else {
            // Fallback to user table role if no organization membership
            const { data: userRole } = await supabase
              .from("users")
              .select("role")
              .eq("user_id", user.id)
              .single();

            if (userRole) {
              setUserRole(
                userRole.role === "employee"
                  ? "member"
                  : (userRole.role as "admin" | "manager" | "member"),
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={<div className="p-6">Loading team performance data...</div>}
    >
      <TeamPerformanceTab userRole={userRole} />
    </Suspense>
  );
}
