"use client";

import { Suspense } from "react";
import TimeAnalyticsDashboard from "@/components/time-analytics-dashboard";

interface OverviewTabProps {
  userRole: "admin" | "geschaeftsfuehrer" | "member";
  isOnboarded?: boolean;
}

function OverviewLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Laden...</p>
      </div>
    </div>
  );
}

export default function OverviewTab({
  userRole,
  isOnboarded = false,
}: OverviewTabProps) {
  return (
    <Suspense fallback={<OverviewLoadingFallback />}>
      <TimeAnalyticsDashboard userRole={userRole} isOnboarded={isOnboarded} />
    </Suspense>
  );
}
