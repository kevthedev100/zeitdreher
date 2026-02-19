"use client";

import { Suspense } from "react";
import Profile from "@/components/profile";

export default function ProfileTab() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full p-6">
          <p className="text-gray-500">Laden...</p>
        </div>
      }
    >
      <Profile />
    </Suspense>
  );
}
