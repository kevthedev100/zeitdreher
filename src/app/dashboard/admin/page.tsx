"use client";

import { useState } from "react";
import AdminTab from "@/components/tabs/admin-tab";
import DashboardWrapper from "../dashboard-wrapper";

export default function DashboardAdminPage() {
  const [userRole] = useState<"manager" | "employee" | "admin">("admin");

  return (
    <DashboardWrapper>
      <AdminTab userRole={userRole} />
    </DashboardWrapper>
  );
}
