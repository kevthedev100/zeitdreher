"use client";

import { Suspense } from "react";
import TimeAnalyticsDashboard from "@/components/time-analytics-dashboard";

interface OverviewTabProps {
  userRole: "manager" | "employee";
  isOnboarded?: boolean;
}

export default function OverviewTab({
  userRole,
  isOnboarded = false,
}: OverviewTabProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <TimeAnalyticsDashboard userRole={userRole} isOnboarded={isOnboarded} />
    </Suspense>
  );
}
