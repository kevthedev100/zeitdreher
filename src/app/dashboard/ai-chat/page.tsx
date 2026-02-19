"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import AIChatTab from "@/components/tabs/ai-chat-tab";

export default function DashboardAIChatPage() {
  const supabase = createClient();
  const [userRole, setUserRole] = useState<"admin" | "geschaeftsfuehrer" | "member">("member");

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
          setUserRole(data.role as "admin" | "geschaeftsfuehrer" | "member");
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
      <AIChatTab userRole={userRole} />
    </SubscriptionCheck>
  );
}
