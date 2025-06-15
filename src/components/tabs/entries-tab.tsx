"use client";

import { Suspense } from "react";
import TimeEntriesTable from "@/components/time-entries-table";

interface EntriesTabProps {
  userRole: "manager" | "employee";
  isOnboarded?: boolean;
}

export default function EntriesTab({
  userRole,
  isOnboarded = false,
}: EntriesTabProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <TimeEntriesTable userRole={userRole} isOnboarded={isOnboarded} />
    </Suspense>
  );
}
