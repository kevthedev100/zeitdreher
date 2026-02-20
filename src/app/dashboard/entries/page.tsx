"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import EntriesTab from "@/components/tabs/entries-tab";

export default function DashboardEntriesPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<"admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer">(
    "member",
  );
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

        setUserId(user.id);

        // Get user data from the users table
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setUserRole(data.role as "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer");
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
      <EntriesTab
        userRole={userRole}
        isOnboarded={isOnboarded}
        userId={userId}
      />
    </SubscriptionCheck>
  );
}
