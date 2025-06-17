"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "../../../../supabase/client";
import { SubscriptionCheck } from "@/components/subscription-check";
import EntriesTab from "@/components/tabs/entries-tab";
import DashboardWrapper from "../dashboard-wrapper";

export default function DashboardEntriesPage() {
  const { user } = useUser();
  const supabase = createClient();
  const [userRole, setUserRole] = useState<"manager" | "employee">("employee");
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        // Get user data from the users table
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setUserRole(data.role as "manager" | "employee");
          setIsOnboarded(data.onboarded === true);
        }
      } catch (error) {
        console.error("Error in user initialization:", error);
      }
    };

    loadUserData();
  }, [user, supabase]);

  return (
    <DashboardWrapper>
      <SubscriptionCheck>
        <EntriesTab userRole={userRole} isOnboarded={isOnboarded} />
      </SubscriptionCheck>
    </DashboardWrapper>
  );
}
