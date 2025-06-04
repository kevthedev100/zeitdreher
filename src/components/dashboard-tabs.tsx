"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeEntryForm from "@/components/time-entry-form";
import TimeAnalyticsDashboard from "@/components/time-analytics-dashboard";
import TimeEntriesTable from "@/components/time-entries-table";
import CategoryManagement from "@/components/category-management";
import {
  Clock,
  BarChart3,
  Table,
  Plus,
  Settings,
  FolderPlus,
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { createClient } from "../../supabase/client";

interface DashboardTabsProps {
  userRole: "manager" | "employee";
}

export default function DashboardTabs({ userRole }: DashboardTabsProps) {
  const [quickStats, setQuickStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser || userRole === "manager") {
      loadQuickData();
    }
  }, [currentUser, userRole]);

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadQuickData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("time_entries")
        .select(
          `
          *,
          activities(name),
          areas(name, color)
        `,
        )
        .order("date", { ascending: false });

      if (userRole === "employee" && currentUser) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data: entries, error } = await query;

      if (error) throw error;

      const now = new Date();
      const today = now.toISOString().split("T")[0];

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayHours =
        entries
          ?.filter((entry) => entry.date === today)
          .reduce((sum, entry) => sum + entry.duration, 0) || 0;

      const weekHours =
        entries
          ?.filter((entry) => new Date(entry.date) >= startOfWeek)
          .reduce((sum, entry) => sum + entry.duration, 0) || 0;

      const monthHours =
        entries
          ?.filter((entry) => new Date(entry.date) >= startOfMonth)
          .reduce((sum, entry) => sum + entry.duration, 0) || 0;

      setQuickStats({ todayHours, weekHours, monthHours });

      // Get recent activities (last 3)
      const recent =
        entries?.slice(0, 3).map((entry) => ({
          activity: entry.activities?.name || "Unbekannte Aktivität",
          duration: entry.duration,
          date: entry.date,
          area: entry.areas?.name || "Unbekannter Bereich",
          color: entry.areas?.color || "#6B7280",
        })) || [];

      setRecentActivities(recent);
    } catch (error) {
      console.error("Error loading quick data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeEntrySubmit = useCallback(async (data: any) => {
    console.log("Time entry submitted:", data);
    // Refresh quick data after submission
    await loadQuickData();
    // Also trigger a page refresh to ensure all components are updated
    window.location.reload();
  }, []);

  const getAreaColorClasses = (hexColor: string) => {
    const colorMap: { [key: string]: string } = {
      "#3B82F6": "bg-blue-50 text-blue-600",
      "#8B5CF6": "bg-purple-50 text-purple-600",
      "#10B981": "bg-green-50 text-green-600",
      "#F59E0B": "bg-orange-50 text-orange-600",
      "#EF4444": "bg-red-50 text-red-600",
    };
    return colorMap[hexColor] || "bg-gray-50 text-gray-600";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "vor weniger als 1 Stunde";
    if (diffInHours === 1) return "vor 1 Stunde";
    if (diffInHours < 24) return `vor ${diffInHours} Stunden`;
    if (diffInHours < 48) return "Gestern";
    return date.toLocaleDateString("de-DE");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Tabs
        defaultValue="analytics"
        className="flex w-full"
        orientation="vertical"
      >
        <TabsList className="flex flex-col h-fit w-64 p-2 bg-white shadow-sm border-r">
          <TabsTrigger
            value="analytics"
            className="w-full justify-start gap-2 mb-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytik
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="w-full justify-start gap-2 mb-4"
          >
            <Clock className="w-4 h-4" />
            Übersicht
          </TabsTrigger>

          <div className="w-full border-t pt-4 mb-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2 px-3">
              BEREICHE
            </h3>
          </div>

          <TabsTrigger
            value="development"
            className="w-full justify-start gap-2 mb-1"
          >
            <Settings className="w-4 h-4" />
            Entwicklung
          </TabsTrigger>
          <TabsTrigger
            value="design"
            className="w-full justify-start gap-2 mb-1"
          >
            <Settings className="w-4 h-4" />
            Design
          </TabsTrigger>
          <TabsTrigger
            value="marketing"
            className="w-full justify-start gap-2 mb-1"
          >
            <Settings className="w-4 h-4" />
            Marketing
          </TabsTrigger>
          <TabsTrigger
            value="management"
            className="w-full justify-start gap-2 mb-4"
          >
            <Settings className="w-4 h-4" />
            Management
          </TabsTrigger>

          <TabsTrigger
            value="categories"
            className="w-full justify-start gap-2 mb-4"
          >
            <FolderPlus className="w-4 h-4" />
            Kategorien verwalten
          </TabsTrigger>

          <TabsTrigger
            value="new-entry"
            className="w-full justify-start gap-2 mb-2"
          >
            <Plus className="w-4 h-4" />
            Neuer Eintrag
          </TabsTrigger>
          <TabsTrigger value="entries" className="w-full justify-start gap-2">
            <Table className="w-4 h-4" />
            Alle Einträge
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="analytics" className="p-6">
            <TimeAnalyticsDashboard userRole={userRole} />
          </TabsContent>

          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Schnellstatistiken
                </h3>
                {loading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Heutige Stunden</span>
                      <span className="font-semibold text-2xl">
                        {quickStats.todayHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Diese Woche</span>
                      <span className="font-semibold text-2xl">
                        {quickStats.weekHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Dieser Monat</span>
                      <span className="font-semibold text-2xl">
                        {quickStats.monthHours.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Letzte Aktivitäten
                </h3>
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${getAreaColorClasses(activity.color)}`}
                      >
                        <div>
                          <p className="font-medium">{activity.activity}</p>
                          <p className="text-sm opacity-75">
                            {formatTimeAgo(activity.date)}
                          </p>
                        </div>
                        <span className="font-semibold">
                          {activity.duration.toFixed(1)}h
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Keine aktuellen Aktivitäten</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="development" className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">
                Entwicklung - Bereiche
              </h2>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Felder und Aktivitäten für den
                Entwicklungsbereich.
              </p>
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea="development"
              />
            </div>
          </TabsContent>

          <TabsContent value="design" className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Design - Bereiche</h2>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Felder und Aktivitäten für den Designbereich.
              </p>
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea="design"
              />
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Marketing - Bereiche</h2>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Felder und Aktivitäten für den Marketingbereich.
              </p>
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea="marketing"
              />
            </div>
          </TabsContent>

          <TabsContent value="management" className="p-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Management - Bereiche</h2>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Felder und Aktivitäten für den Managementbereich.
              </p>
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea="management"
              />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="p-0">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="new-entry" className="p-6">
            <TimeEntryForm onSubmit={handleTimeEntrySubmit} />
          </TabsContent>

          <TabsContent value="entries" className="p-6">
            <TimeEntriesTable userRole={userRole} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
