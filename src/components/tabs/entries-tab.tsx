"use client";

import { Suspense } from "react";
import TimeEntriesTable from "@/components/time-entries-table";

interface EntriesTabProps {
  userRole: "manager" | "employee" | "admin";
  isOnboarded?: boolean;
  userId?: string | null;
  selectedMemberId?: string | null;
}

export default function EntriesTab({
  userRole,
  isOnboarded = false,
  userId = null,
  selectedMemberId = null,
}: EntriesTabProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <TimeEntriesTable
        userRole={userRole}
        isOnboarded={isOnboarded}
        userId={userId}
        selectedMemberId={selectedMemberId}
      />
    </Suspense>
  );
}
