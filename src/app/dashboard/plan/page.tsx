"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import PlanTab from "@/components/tabs/plan-tab";

export default function DashboardPlanPage() {
  const supabase = createClient();
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
      } catch (error) {
        console.error("Error in user initialization:", error);
        redirect("/sign-in");
      }
    };

    getUser();
  }, [supabase]);

  return (
    <SubscriptionCheck>
      <PlanTab userId={userId} />
    </SubscriptionCheck>
  );
}
