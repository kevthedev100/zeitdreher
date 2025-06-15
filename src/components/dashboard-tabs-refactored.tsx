"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import TimeEntryForm from "@/components/time-entry-form";
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
  RefreshCw,
  AlertCircle,
  Sparkles,
  Menu,
  X,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useState, useEffect } from "react";
import { createClient } from "../../supabase/client";

// Import individual tab components
import {
  OverviewTab,
  AnalyticsTab,
  NewEntryTab,
  EntriesTab,
  AIChatTab,
  CategoriesTab,
  ProfileTab,
} from "@/components/tabs";

interface DashboardTabsProps {
  userRole: "manager" | "employee";
  isOnboarded?: boolean;
}

export default function DashboardTabs({
  userRole,
  isOnboarded = false,
}: DashboardTabsProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile or tablet based on screen width
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // Consider devices with width < 1024px as mobile/tablet
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const [quickStats, setQuickStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [showHierarchicalNav, setShowHierarchicalNav] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadCurrentUser();

    // Listen for the openNewEntry event from AddEntryButton
    const handleOpenNewEntry = () => {
      setActiveTab("new-entry");
    };

    // Listen for the openTimeEntryEditDialog event from time analytics dashboard
    const handleOpenEditDialog = async (event: CustomEvent) => {
      console.log(
        "[DASHBOARD-TABS] Received openTimeEntryEditDialog event:",
        event.detail,
      );
      const { entryId } = event.detail;

      if (!entryId) {
        console.error("[DASHBOARD-TABS] No entryId provided in event detail");
        return;
      }

      try {
        console.log(
          "[DASHBOARD-TABS] Loading time entry for editing:",
          entryId,
        );
        // Load the time entry data from database
        const { data: entry, error } = await supabase
          .from("time_entries")
          .select(
            `
            *,
            areas(id, name, color),
            fields(id, name),
            activities(id, name),
            users(full_name, email)
          `,
          )
          .eq("id", entryId)
          .single();

        if (error) {
          console.error(
            "[DASHBOARD-TABS] Database error loading entry:",
            error,
          );
          throw error;
        }

        if (entry) {
          console.log(
            "[DASHBOARD-TABS] Loaded entry for editing from dashboard:",
            entry,
          );
          setEditingEntry(entry);
          setIsEditDialogOpen(true);
          console.log(
            "[DASHBOARD-TABS] Edit dialog should now be open, isEditDialogOpen:",
            true,
          );
        } else {
          console.error("[DASHBOARD-TABS] No entry found with ID:", entryId);
          alert("Zeiteintrag nicht gefunden.");
        }
      } catch (error) {
        console.error(
          "[DASHBOARD-TABS] Error loading time entry for editing:",
          error,
        );
        alert(
          "Fehler beim Laden des Zeiteintrags zum Bearbeiten: " + error.message,
        );
      }
    };

    console.log("[DASHBOARD-TABS] Setting up event listeners");

    window.addEventListener("openNewEntry", handleOpenNewEntry);
    window.addEventListener(
      "openTimeEntryEditDialog",
      handleOpenEditDialog as EventListener,
    );

    // Also listen on document as fallback
    document.addEventListener(
      "openTimeEntryEditDialog",
      handleOpenEditDialog as EventListener,
    );

    return () => {
      console.log("[DASHBOARD-TABS] Cleaning up event listeners");
      window.removeEventListener("openNewEntry", handleOpenNewEntry);
      window.removeEventListener(
        "openTimeEntryEditDialog",
        handleOpenEditDialog as EventListener,
      );
      document.removeEventListener(
        "openTimeEntryEditDialog",
        handleOpenEditDialog as EventListener,
      );
    };
  }, [supabase]);

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

      // Load time entries with related data - using same query structure as analytics dashboard
      let query = supabase
        .from("time_entries")
        .select(
          `
          *,
          areas(name, color),
          fields(name),
          activities(name),
          users(full_name, email)
        `,
        )
        .order("date", { ascending: false });

      // Filter by user role - same logic as analytics dashboard
      if (userRole === "employee" && currentUser) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data: entries, error } = await query;

      if (error) throw error;

      // Only use real data, no mock data
      const timeEntryData = entries || [];

      console.log("=== Dashboard Tabs Quick Stats Debug ===");
      console.log("Total entries loaded:", timeEntryData.length);
      console.log(
        "Sample entries:",
        timeEntryData.slice(0, 5).map((e) => ({
          date: e.date,
          duration: e.duration,
          activity: e.activities?.name,
        })),
      );

      if (timeEntryData.length === 0) {
        console.log("No time entries found, returning zeros");
        setQuickStats({
          todayHours: 0,
          weekHours: 0,
          monthHours: 0,
        });
        setRecentActivities([]);
        return;
      }

      // Use local timezone for all date calculations - EXACT same logic as analytics dashboard
      const now = new Date();

      // Get today's date in local timezone (YYYY-MM-DD format)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        .toISOString()
        .split("T")[0];
      console.log("Today's date (local):", today);

      // Calculate start of current week (Monday) in local timezone
      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need 6 days back
      startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
      const startOfWeekStr = startOfWeek.toISOString().split("T")[0];
      console.log("Start of week (Monday, local):", startOfWeekStr);

      // Calculate start of current month in local timezone
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
      console.log("Start of month (local):", startOfMonthStr);

      // Helper function to normalize date strings for comparison - EXACT same as analytics dashboard
      const normalizeDate = (dateStr: string) => {
        // Ensure we're working with YYYY-MM-DD format
        const date = new Date(dateStr + "T00:00:00.000Z");
        return date.toISOString().split("T")[0];
      };

      // Calculate today's hours
      const todayEntries = timeEntryData.filter((entry) => {
        const entryDate = normalizeDate(entry.date);
        const match = entryDate === today;
        console.log(
          `Comparing entry date ${entryDate} with today ${today}: ${match}`,
        );
        return match;
      });
      const todayHours = todayEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );
      console.log(
        "Today's entries:",
        todayEntries.length,
        "Total hours:",
        todayHours,
        "Entries:",
        todayEntries.map((e) => ({ date: e.date, duration: e.duration })),
      );

      // Calculate this week's hours (from Monday to today)
      const thisWeekEntries = timeEntryData.filter((entry) => {
        const entryDate = normalizeDate(entry.date);
        const match = entryDate >= startOfWeekStr;
        console.log(
          `Comparing entry date ${entryDate} >= start of week ${startOfWeekStr}: ${match}`,
        );
        return match;
      });
      const weekHours = thisWeekEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );
      console.log(
        "This week's entries:",
        thisWeekEntries.length,
        "Total hours:",
        weekHours,
        "Entries:",
        thisWeekEntries.map((e) => ({ date: e.date, duration: e.duration })),
      );

      // Calculate this month's hours
      const thisMonthEntries = timeEntryData.filter((entry) => {
        const entryDate = normalizeDate(entry.date);
        const match = entryDate >= startOfMonthStr;
        console.log(
          `Comparing entry date ${entryDate} >= start of month ${startOfMonthStr}: ${match}`,
        );
        return match;
      });
      const monthHours = thisMonthEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );
      console.log(
        "This month's entries:",
        thisMonthEntries.length,
        "Total hours:",
        monthHours,
        "Entries:",
        thisMonthEntries.map((e) => ({ date: e.date, duration: e.duration })),
      );

      console.log("Final calculated stats:", {
        todayHours,
        weekHours,
        monthHours,
      });
      console.log("=== End Dashboard Tabs Quick Stats Debug ===");

      setQuickStats({
        todayHours,
        weekHours,
        monthHours,
      });

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
      // Set empty data instead of mock data
      setQuickStats({
        todayHours: 0,
        weekHours: 0,
        monthHours: 0,
      });

      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeEntrySubmit = useCallback(
    async (data: any) => {
      console.log("Time entry submitted:", data);

      // Refresh data without full page reload
      await loadQuickData();

      // Trigger custom event to refresh other components
      window.dispatchEvent(new CustomEvent("timeEntryAdded", { detail: data }));

      // Switch to analytics tab to show the updated data with AI summaries
      setActiveTab("analytics");
    },
    [loadQuickData],
  );

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

  const handleEditSubmit = (data: any) => {
    // Close the dialog after submission
    setIsEditDialogOpen(false);
    setEditingEntry(null);

    // Refresh data
    loadQuickData();

    // Dispatch the timeEntryUpdated event to refresh other components
    window.dispatchEvent(new CustomEvent("timeEntryUpdated", { detail: data }));
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingEntry(null);
  };

  return (
    <>
      {/* Mobile Header - Completely isolated from main container */}
      <div className="lg:hidden fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-white shadow-sm border-b z-30 w-full">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-lg font-bold">Zeitdreher</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("new-entry")}
            className="text-blue-600 px-2 py-1 h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs">Neu</span>
          </Button>
        </div>
      </div>

      <div className="relative pt-12 lg:pt-0">
        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-full max-w-none p-0 border-0">
            <div className="flex flex-col h-full bg-white">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Zeitdreher</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("overview");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Clock className="w-5 h-5" />
                    Übersicht
                  </Button>
                  <Button
                    variant={activeTab === "analytics" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("analytics");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <BarChart3 className="w-5 h-5" />
                    Analytik
                  </Button>
                  <Button
                    variant={activeTab === "new-entry" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("new-entry");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Plus className="w-5 h-5" />
                    Neuer Eintrag
                  </Button>
                  <Button
                    variant={activeTab === "entries" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("entries");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Table className="w-5 h-5" />
                    Alle Einträge
                  </Button>
                  <Button
                    variant={activeTab === "ai-chat" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => {
                      setActiveTab("ai-chat");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Bot className="w-5 h-5" />
                    AI-Chat
                  </Button>
                </div>

                {/* Categories Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Kategorien
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        setShowHierarchicalNav(!showHierarchicalNav)
                      }
                    >
                      {showHierarchicalNav ? "-" : "+"}
                    </Button>
                  </div>

                  {showHierarchicalNav && (
                    <div className="mb-4 max-h-60 overflow-y-auto">
                      <HierarchicalNavigation
                        onSelectActivity={(areaId, fieldId, activityId) => {
                          handleActivitySelect(areaId, fieldId, activityId);
                          setIsMobileMenuOpen(false);
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      variant={
                        activeTab === "categories" ? "secondary" : "ghost"
                      }
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => {
                        setActiveTab("categories");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Layers className="w-5 h-5" />
                      Kategorien verwalten
                    </Button>
                    <Button
                      variant={activeTab === "profile" ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => {
                        setActiveTab("profile");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <UserCircle className="w-5 h-5" />
                      Profil
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main container */}
        <div className="flex bg-gray-50 pt-0">
          {/* Desktop Sidebar */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex w-full"
            orientation="vertical"
          >
            <TabsList className="hidden lg:flex flex-col h-fit w-64 p-2 bg-white shadow-sm border-r">
              <TabsTrigger
                value="overview"
                className="w-full justify-start gap-2 mb-2"
              >
                <Clock className="w-4 h-4" />
                Übersicht
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="w-full justify-start gap-2 mb-2"
              >
                <BarChart3 className="w-4 h-4" />
                Analytik
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
                  <h3 className="text-sm font-medium text-gray-500">
                    KATEGORIEN
                  </h3>
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
                <div className="mb-4 w-full">
                  <HierarchicalNavigation
                    onSelectActivity={handleActivitySelect}
                  />
                </div>
              )}

              <TabsTrigger
                value="categories"
                className="w-full justify-start gap-2 mb-4"
              >
                <Layers className="w-4 h-4" />
                Kategorien verwalten
              </TabsTrigger>

              <TabsTrigger
                value="profile"
                className="w-full justify-start gap-2"
              >
                <UserCircle className="w-4 h-4" />
                Profil
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto pb-16 lg:pb-0 lg:min-h-screen mt-0">
              <TabsContent
                value="overview"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <OverviewTab userRole={userRole} isOnboarded={isOnboarded} />
              </TabsContent>

              <TabsContent
                value="analytics"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <AnalyticsTab
                  userRole={userRole}
                  quickStats={quickStats}
                  recentActivities={recentActivities}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent
                value="categories"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <CategoriesTab />
              </TabsContent>

              <TabsContent
                value="new-entry"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <NewEntryTab
                  selectedAreaId={selectedAreaId}
                  selectedFieldId={selectedFieldId}
                  selectedActivityId={selectedActivityId}
                  onTimeEntrySubmit={handleTimeEntrySubmit}
                />
              </TabsContent>

              <TabsContent
                value="entries"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <EntriesTab userRole={userRole} isOnboarded={isOnboarded} />
              </TabsContent>

              <TabsContent
                value="ai-chat"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <AIChatTab userRole={userRole} />
              </TabsContent>

              <TabsContent
                value="profile"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <ProfileTab />
              </TabsContent>
            </div>
          </Tabs>

          {/* Mobile Bottom Navigation */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center p-1 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none"
              onClick={() => setActiveTab("overview")}
            >
              <Clock
                className={`h-5 w-5 ${activeTab === "overview" ? "text-blue-600" : "text-gray-500"}`}
              />
              <span
                className={`text-[10px] mt-0.5 ${activeTab === "overview" ? "text-blue-600 font-medium" : "text-gray-500"}`}
              >
                Übersicht
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none"
              onClick={() => setActiveTab("analytics")}
            >
              <BarChart3
                className={`h-5 w-5 ${activeTab === "analytics" ? "text-blue-600" : "text-gray-500"}`}
              />
              <span
                className={`text-[10px] mt-0.5 ${activeTab === "analytics" ? "text-blue-600 font-medium" : "text-gray-500"}`}
              >
                Analytik
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none relative"
              onClick={() => setActiveTab("new-entry")}
            >
              <div
                className={`absolute -top-3 rounded-full ${activeTab === "new-entry" ? "bg-blue-600" : "bg-blue-500"} p-1.5 shadow-md`}
              >
                <Plus className="h-4 w-4 text-white" />
              </div>
              <div className="h-5 w-5"></div>
              <span
                className={`text-[10px] mt-0.5 ${activeTab === "new-entry" ? "text-blue-600 font-medium" : "text-gray-500"}`}
              >
                Neu
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none"
              onClick={() => setActiveTab("entries")}
            >
              <Table
                className={`h-5 w-5 ${activeTab === "entries" ? "text-blue-600" : "text-gray-500"}`}
              />
              <span
                className={`text-[10px] mt-0.5 ${activeTab === "entries" ? "text-blue-600 font-medium" : "text-gray-500"}`}
              >
                Einträge
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center py-1 px-1 h-auto w-full rounded-none"
              onClick={() => setActiveTab("ai-chat")}
            >
              <Bot
                className={`h-5 w-5 ${activeTab === "ai-chat" ? "text-blue-600" : "text-gray-500"}`}
              />
              <span
                className={`text-[10px] mt-0.5 ${activeTab === "ai-chat" ? "text-blue-600 font-medium" : "text-gray-500"}`}
              >
                AI-Chat
              </span>
            </Button>
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
              </DialogHeader>
              {editingEntry && (
                <TimeEntryForm
                  onSubmit={handleEditSubmit}
                  editingEntry={editingEntry}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
