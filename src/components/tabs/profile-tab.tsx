"use client";

import { Suspense } from "react";
import Profile from "@/components/profile";

export default function ProfileTab() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <Profile />
    </Suspense>
  );
}
