"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import DashboardTabs from "@/components/dashboard-tabs";
import AddEntryButton from "@/components/add-entry-button";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/sign-in");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mock user role - in a real app, this would come from the database
  const userRole = "employee"; // or "manager"

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Zeitdreher Dashboard
                </h1>
                <p className="text-gray-600">
                  Zeit erfassen, Produktivität analysieren und Arbeitsstunden
                  verwalten
                </p>
              </div>
              <AddEntryButton
                onAddEntry={() => {
                  // This will be handled by the DashboardTabs component
                  const event = new CustomEvent("openNewEntry");
                  window.dispatchEvent(event);
                }}
              />
            </div>
          </header>

          {/* Tabbed Interface */}
          <DashboardTabs userRole={userRole as "manager" | "employee"} />
        </div>
      </main>
    </SubscriptionCheck>
  );
}
