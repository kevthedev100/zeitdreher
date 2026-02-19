"use client";

import { useEffect } from "react";
import { createClient } from "../../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import OverviewTab from "@/components/tabs/overview-tab";

export default function DashboardOverviewPage() {
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
      } catch (error) {
        console.error("Error in user initialization:", error);
        redirect("/sign-in");
      }
    };

    getUser();
  }, [supabase]);

  return (
    <SubscriptionCheck>
      <OverviewTab userRole="employee" isOnboarded={true} />
    </SubscriptionCheck>
  );
}
