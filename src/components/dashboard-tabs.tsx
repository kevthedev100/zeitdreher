"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeEntryForm from "@/components/time-entry-form";
import TimeAnalyticsDashboard from "@/components/time-analytics-dashboard";
import TimeEntriesTable from "@/components/time-entries-table";
import CategoryManagement from "@/components/category-management";
import AIChat from "@/components/ai-chat";
import Profile from "@/components/profile";
import HierarchicalNavigation from "@/components/hierarchical-navigation";
import {
  Clock,
  BarChart3,
  Table,
  Plus,
  Settings,
  FolderPlus,
  Bot,
  UserCircle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import AIDailySummary from "@/components/ai-daily-summary";
import AIWeeklySummary from "@/components/ai-weekly-summary";
import RecentTimeEntry from "@/components/recent-time-entry";

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
  const [recentTimeEntry, setRecentTimeEntry] = useState<any>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [showHierarchicalNav, setShowHierarchicalNav] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("analytics");

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

      // Use real data if available, otherwise generate mock data
      const timeEntryData =
        entries && entries.length > 0
          ? entries
          : generateMockTimeEntries(currentUser?.id || "user1", 10);

      if (!entries || entries.length === 0) {
        console.log("Using mock time entries data for quick stats");
      }

      const now = new Date();
      const today = now.toISOString().split("T")[0];

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayHours =
        timeEntryData
          .filter((entry) => entry.date === today)
          .reduce((sum, entry) => sum + entry.duration, 0) || 0;

      const weekHours =
        timeEntryData
          .filter((entry) => new Date(entry.date) >= startOfWeek)
          .reduce((sum, entry) => sum + entry.duration, 0) || 0;

      const monthHours =
        timeEntryData
          .filter((entry) => new Date(entry.date) >= startOfMonth)
          .reduce((sum, entry) => sum + entry.duration, 0) || 0;

      setQuickStats({ todayHours, weekHours, monthHours });

      // Get recent activities (last 3)
      const recent =
        timeEntryData.slice(0, 3).map((entry) => ({
          activity: entry.activities?.name || "Unbekannte Aktivität",
          duration: entry.duration,
          date: entry.date,
          area: entry.areas?.name || "Unbekannter Bereich",
          color: entry.areas?.color || "#6B7280",
        })) || [];

      setRecentActivities(recent);
    } catch (error) {
      console.error("Error loading quick data:", error);
      // Use mock data as fallback
      const mockData = generateMockTimeEntries(currentUser?.id || "user1", 10);
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // Calculate stats from mock data
      const todayHours = mockData
        .filter((entry) => entry.date === today)
        .reduce((sum, entry) => sum + entry.duration, 0);

      setQuickStats({
        todayHours,
        weekHours: 25.5,
        monthHours: 87.0,
      });

      // Get recent activities from mock data
      const recent = mockData.slice(0, 3).map((entry) => ({
        activity: entry.activities?.name || "Unbekannte Aktivität",
        duration: entry.duration,
        date: entry.date,
        area: entry.areas?.name || "Unbekannter Bereich",
        color: entry.areas?.color || "#6B7280",
      }));

      setRecentActivities(recent);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock time entries for demonstration
  const generateMockTimeEntries = (userId: string, count: number) => {
    const mockAreas = [
      { id: "area1", name: "Entwicklung", color: "#3B82F6" },
      { id: "area2", name: "Design", color: "#8B5CF6" },
      { id: "area3", name: "Marketing", color: "#10B981" },
      { id: "area4", name: "Management", color: "#F59E0B" },
    ];

    const mockFields = [
      { id: "field1", name: "Frontend" },
      { id: "field2", name: "Backend" },
      { id: "field3", name: "UI Design" },
      { id: "field4", name: "Content Creation" },
    ];

    const mockActivities = [
      { id: "activity1", name: "React Development" },
      { id: "activity2", name: "API Integration" },
      { id: "activity3", name: "Wireframing" },
      { id: "activity4", name: "Blog Writing" },
    ];

    const now = new Date();

    return Array.from({ length: count }).map((_, index) => {
      const dayOffset = index % 7;
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);

      const areaIndex = index % mockAreas.length;
      const fieldIndex = index % mockFields.length;
      const activityIndex = index % mockActivities.length;

      return {
        id: `mock-${index}`,
        user_id: userId,
        area_id: mockAreas[areaIndex].id,
        field_id: mockFields[fieldIndex].id,
        activity_id: mockActivities[activityIndex].id,
        duration: 1 + Math.random() * 4, // 1-5 hours
        date: date.toISOString().split("T")[0],
        description: `Mock time entry ${index + 1} for demonstration`,
        created_at: new Date().toISOString(),
        areas: mockAreas[areaIndex],
        fields: mockFields[fieldIndex],
        activities: mockActivities[activityIndex],
        users: { full_name: "Demo User", email: "demo@example.com" },
      };
    });
  };

  const handleTimeEntrySubmit = useCallback(
    async (data: any) => {
      console.log("Time entry submitted:", data);

      // Set the recent time entry to show for 30 seconds
      setRecentTimeEntry(data);

      // Refresh data without full page reload
      await loadQuickData();

      // Trigger custom event to refresh other components
      window.dispatchEvent(new CustomEvent("timeEntryAdded", { detail: data }));

      // Switch to overview tab to show the updated data with AI summaries
      setActiveTab("overview");
    },
    [loadQuickData],
  );

  const handleRecentEntryUpdate = useCallback(
    (updatedEntry: any) => {
      setRecentTimeEntry(updatedEntry);
      // Refresh data to reflect the update
      loadQuickData();
      // Trigger event for other components
      window.dispatchEvent(
        new CustomEvent("timeEntryUpdated", { detail: updatedEntry }),
      );
    },
    [loadQuickData],
  );

  const handleRecentEntryExpire = useCallback(() => {
    setRecentTimeEntry(null);
  }, []);

  const handleActivitySelect = useCallback(
    (areaId: string, fieldId: string, activityId: string) => {
      console.log("Activity selected:", { areaId, fieldId, activityId });
      setSelectedAreaId(areaId);
      setSelectedFieldId(fieldId);
      setSelectedActivityId(activityId);
      // Switch to new entry tab using state instead of DOM manipulation
      setActiveTab("new-entry");
    },
    [],
  );

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
        value={activeTab}
        onValueChange={setActiveTab}
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
            className="w-full justify-start gap-2 mb-2"
          >
            <Clock className="w-4 h-4" />
            Übersicht
          </TabsTrigger>

          <TabsTrigger
            value="new-entry"
            className="w-full justify-start gap-2 mb-2"
          >
            <Plus className="w-4 h-4" />
            Neuer Eintrag
          </TabsTrigger>
          <TabsTrigger
            value="entries"
            className="w-full justify-start gap-2 mb-2"
          >
            <Table className="w-4 h-4" />
            Alle Einträge
          </TabsTrigger>

          <TabsTrigger
            value="ai-chat"
            className="w-full justify-start gap-2 mb-4"
          >
            <Bot className="w-4 h-4" />
            AI-Chat
          </TabsTrigger>

          <div className="w-full border-t pt-4 mb-2">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-sm font-medium text-gray-500">KATEGORIEN</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowHierarchicalNav(!showHierarchicalNav)}
              >
                {showHierarchicalNav ? "-" : "+"}
              </Button>
            </div>
          </div>

          {showHierarchicalNav && (
            <div className="mb-4 px-3">
              <HierarchicalNavigation onSelectActivity={handleActivitySelect} />
            </div>
          )}

          <TabsTrigger
            value="categories"
            className="w-full justify-start gap-2 mb-4"
          >
            <Layers className="w-4 h-4" />
            Kategorien verwalten
          </TabsTrigger>

          <TabsTrigger value="profile" className="w-full justify-start gap-2">
            <UserCircle className="w-4 h-4" />
            Profil
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

              {/* AI Daily Summary */}
              <AIDailySummary
                timeEntries={recentActivities}
                loading={loading}
                todayHours={quickStats.todayHours}
              />

              {/* AI Weekly Summary */}
              <AIWeeklySummary
                weekHours={quickStats.weekHours}
                loading={loading}
              />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="p-6">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="new-entry" className="p-6">
            <div className="space-y-6">
              <TimeEntryForm
                onSubmit={handleTimeEntrySubmit}
                selectedArea={selectedAreaId}
                selectedField={selectedFieldId}
                selectedActivity={selectedActivityId}
              />

              {/* Recent Time Entry Display */}
              {recentTimeEntry && (
                <div className="mt-6">
                  <RecentTimeEntry
                    entry={recentTimeEntry}
                    onUpdate={handleRecentEntryUpdate}
                    onExpire={handleRecentEntryExpire}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="entries" className="p-6">
            <TimeEntriesTable userRole={userRole} />
          </TabsContent>

          <TabsContent value="ai-chat" className="p-6">
            <AIChat userRole={userRole} />
          </TabsContent>

          <TabsContent value="profile" className="p-6">
            <Profile />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
