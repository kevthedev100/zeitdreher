"use client";

import { useState, useCallback } from "react";
import { Suspense } from "react";
import TimeEntryForm from "@/components/time-entry-form";
import RecentTimeEntry from "@/components/recent-time-entry";

interface NewEntryTabProps {
  selectedAreaId?: string;
  selectedFieldId?: string;
  selectedActivityId?: string;
  onTimeEntrySubmit: (data: any) => void;
}

export default function NewEntryTab({
  selectedAreaId = "",
  selectedFieldId = "",
  selectedActivityId = "",
  onTimeEntrySubmit,
}: NewEntryTabProps) {
  const [recentTimeEntry, setRecentTimeEntry] = useState<any>(null);

  const handleTimeEntrySubmit = useCallback(
    (data: any) => {
      console.log("Time entry submitted:", data);

      // Set the recent time entry to show for 30 seconds
      setRecentTimeEntry(data);

      // Call the parent handler
      onTimeEntrySubmit(data);
    },
    [onTimeEntrySubmit],
  );

  const handleRecentEntryUpdate = useCallback((updatedEntry: any) => {
    setRecentTimeEntry(updatedEntry);
    // Trigger event for other components
    window.dispatchEvent(
      new CustomEvent("timeEntryUpdated", { detail: updatedEntry }),
    );
  }, []);

  const handleRecentEntryExpire = useCallback(() => {
    setRecentTimeEntry(null);
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <div className="space-y-4 lg:space-y-6 pb-16 lg:pb-0">
        <TimeEntryForm
          onSubmit={handleTimeEntrySubmit}
          selectedArea={selectedAreaId}
          selectedField={selectedFieldId}
          selectedActivity={selectedActivityId}
        />

        {/* Recent Time Entry Display */}
        {recentTimeEntry && (
          <div className="mt-6">
            <RecentTimeEntry
              entry={recentTimeEntry}
              onUpdate={handleRecentEntryUpdate}
              onExpire={handleRecentEntryExpire}
            />
          </div>
        )}
      </div>
    </Suspense>
  );
}
