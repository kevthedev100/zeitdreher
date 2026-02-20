"use client";

import { Suspense } from "react";
import TeamTab from "@/components/tabs/team-tab";
import { createClient } from "../../../../supabase/client";
import { useEffect, useState } from "react";

export default function TeamPage() {
  const [userRole, setUserRole] = useState<"admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer">(
    "member",
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
            setUserRole(orgMember.role as "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer");
          } else {
            // Fallback to user table role if no organization membership
            const { data: userRole } = await supabase
              .from("users")
              .select("role")
              .eq("user_id", user.id)
              .single();

            if (userRole) {
              setUserRole(
                userRole.role as "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer",
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
        <div className="animate-pulse">Wird geladen...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-6">Teamverwaltung wird geladen...</div>}>
      <TeamTab userRole={userRole} />
    </Suspense>
  );
}
