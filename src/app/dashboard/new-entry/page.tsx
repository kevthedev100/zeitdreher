"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createClient } from "../../../../supabase/client";
import { SubscriptionCheck } from "@/components/subscription-check";
import NewEntryTab from "@/components/tabs/new-entry-tab";
import DashboardWrapper from "../dashboard-wrapper";

export default function DashboardNewEntryPage() {
  const { user } = useUser();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [userRole, setUserRole] = useState<"manager" | "employee">("employee");

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
        }
      } catch (error) {
        console.error("Error in user initialization:", error);
      }
    };

    loadUserData();
  }, [user, supabase]);

  const handleTimeEntrySubmit = (data: any) => {
    console.log("Time entry submitted:", data);
    // Trigger custom event to refresh other components
    window.dispatchEvent(new CustomEvent("timeEntryAdded", { detail: data }));
  };

  return (
    <DashboardWrapper>
      <SubscriptionCheck>
        <NewEntryTab
          selectedAreaId={selectedAreaId}
          selectedFieldId={selectedFieldId}
          selectedActivityId={selectedActivityId}
          onTimeEntrySubmit={handleTimeEntrySubmit}
        />
      </SubscriptionCheck>
    </DashboardWrapper>
  );
}
