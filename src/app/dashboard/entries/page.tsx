"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import EntriesTab from "@/components/tabs/entries-tab";

export default function DashboardEntriesPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<"manager" | "employee">("employee");
  const [isOnboarded, setIsOnboarded] = useState(false);

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
        redirect("/sign-in");
      }
    };

    getUser();
  }, [supabase]);

  return (
    <SubscriptionCheck>
      <EntriesTab userRole={userRole} isOnboarded={isOnboarded} />
    </SubscriptionCheck>
  );
}
