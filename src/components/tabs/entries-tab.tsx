"use client";

import { Suspense } from "react";
import TimeEntriesTable from "@/components/time-entries-table";

interface EntriesTabProps {
  userRole: "admin" | "member";
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
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            <p className="text-sm text-gray-500">Lade Zeiteinträge...</p>
          </div>
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
