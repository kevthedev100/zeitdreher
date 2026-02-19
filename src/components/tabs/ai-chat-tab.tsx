"use client";

import { Suspense } from "react";
import AIChat from "@/components/ai-chat";

interface AIChatTabProps {
  userRole: "manager" | "employee";
}

export default function AIChatTab({ userRole }: AIChatTabProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <AIChat userRole={userRole} />
    </Suspense>
  );
}
