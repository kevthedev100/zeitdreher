"use client";

import { Suspense } from "react";
import AIChat from "@/components/ai-chat";

interface AIChatTabProps {
  userRole: "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer";
}

export default function AIChatTab({ userRole }: AIChatTabProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-gray-500">
          Loading...
        </div>
      }
    >
      <AIChat userRole={userRole} />
    </Suspense>
  );
}
