"use client";

import { SubscriptionCheck } from "@/components/subscription-check";
import OverviewTab from "@/components/tabs/overview-tab";
import DashboardWrapper from "../dashboard-wrapper";

export default function DashboardOverviewPage() {
  return (
    <DashboardWrapper>
      <SubscriptionCheck>
        <OverviewTab userRole="employee" isOnboarded={true} />
      </SubscriptionCheck>
    </DashboardWrapper>
  );
}
