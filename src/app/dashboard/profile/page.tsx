"use client";

import { SubscriptionCheck } from "@/components/subscription-check";
import ProfileTab from "@/components/tabs/profile-tab";
import DashboardWrapper from "../dashboard-wrapper";

export default function DashboardProfilePage() {
  return (
    <DashboardWrapper>
      <SubscriptionCheck>
        <ProfileTab />
      </SubscriptionCheck>
    </DashboardWrapper>
  );
}
