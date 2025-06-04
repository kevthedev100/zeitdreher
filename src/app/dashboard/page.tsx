import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import DashboardTabs from "@/components/dashboard-tabs";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Zeitdreher Dashboard
            </h1>
            <p className="text-gray-600">
              Zeit erfassen, Produktivität analysieren und Arbeitsstunden
              verwalten
            </p>
          </header>

          {/* Tabbed Interface */}
          <DashboardTabs userRole={userRole as "manager" | "employee"} />
        </div>
      </main>
    </SubscriptionCheck>
  );
}
