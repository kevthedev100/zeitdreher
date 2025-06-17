"use client";

import { SubscriptionCheck } from "@/components/subscription-check";
import CategoriesTab from "@/components/tabs/categories-tab";
import DashboardWrapper from "../dashboard-wrapper";

export default function DashboardCategoriesPage() {
  return (
    <DashboardWrapper>
      <SubscriptionCheck>
        <CategoriesTab />
      </SubscriptionCheck>
    </DashboardWrapper>
  );
}
