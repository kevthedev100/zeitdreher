"use client";

import { Suspense } from "react";
import CategoryManagement from "@/components/category-management";

export default function CategoriesTab() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <CategoryManagement />
    </Suspense>
  );
}
