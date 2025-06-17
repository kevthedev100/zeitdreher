"use client";

import { useState } from "react";
import AIChatTab from "@/components/tabs/ai-chat-tab";
import DashboardWrapper from "../dashboard-wrapper";

export default function DashboardAIChatPage() {
  const [userRole] = useState<"manager" | "employee">("employee");

  return (
    <DashboardWrapper>
      <AIChatTab userRole={userRole} />
    </DashboardWrapper>
  );
}
