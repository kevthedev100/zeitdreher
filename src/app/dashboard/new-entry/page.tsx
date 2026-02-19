"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import NewEntryTab from "@/components/tabs/new-entry-tab";

export default function DashboardNewEntryPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [userRole, setUserRole] = useState<"admin" | "geschaeftsfuehrer" | "member">("member");

  // Get URL parameters for pre-selection
  const selectedAreaId = searchParams.get("area") || "";
  const selectedFieldId = searchParams.get("field") || "";
  const selectedActivityId = searchParams.get("activity") || "";

  console.log("[NEW-ENTRY-PAGE] URL Parameters:", {
    selectedAreaId,
    selectedFieldId,
    selectedActivityId,
  });

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

  const handleTimeEntrySubmit = (data: any) => {
    console.log("Time entry submitted:", data);
    // Trigger custom event to refresh other components
    window.dispatchEvent(new CustomEvent("timeEntryAdded", { detail: data }));
  };

  return (
    <SubscriptionCheck>
      <NewEntryTab
        selectedAreaId={selectedAreaId}
        selectedFieldId={selectedFieldId}
        selectedActivityId={selectedActivityId}
        onTimeEntrySubmit={handleTimeEntrySubmit}
      />
    </SubscriptionCheck>
  );
}
