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
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  RefreshCw,
  AlertCircle,
  Sparkles,
  Menu,
  X,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCallback, useState, useEffect, Suspense } from "react";
import { createClient } from "../../supabase/client";
import AIDailySummary from "@/components/ai-daily-summary";
import AIWeeklySummary from "@/components/ai-weekly-summary";
import RecentTimeEntry from "@/components/recent-time-entry";

interface DashboardTabsProps {
  userRole: "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer";
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
  const [recentTimeEntry, setRecentTimeEntry] = useState<any>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [showHierarchicalNav, setShowHierarchicalNav] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [lastTwoWeeksEntries, setLastTwoWeeksEntries] = useState<any[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [areaSuggestions, setAreaSuggestions] = useState<any[]>([]);
  const [isGeneratingAreaSuggestions, setIsGeneratingAreaSuggestions] =
    useState(false);
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
          "Fehler beim Laden des Zeiteintrags zum Bearbeiten: " + (error as Error).message,
        );
      }
    };

    console.log("[DASHBOARD-TABS] Setting up event listeners");

    window.addEventListener("openNewEntry", handleOpenNewEntry);
    window.addEventListener(
      "openTimeEntryEditDialog",
      handleOpenEditDialog as unknown as EventListener,
    );

    // Also listen on document as fallback
    document.addEventListener(
      "openTimeEntryEditDialog",
      handleOpenEditDialog as unknown as EventListener,
    );

    return () => {
      console.log("[DASHBOARD-TABS] Cleaning up event listeners");
      window.removeEventListener("openNewEntry", handleOpenNewEntry);
      window.removeEventListener(
        "openTimeEntryEditDialog",
        handleOpenEditDialog as unknown as EventListener,
      );
      document.removeEventListener(
        "openTimeEntryEditDialog",
        handleOpenEditDialog as unknown as EventListener,
      );
    };
  }, [supabase]);

  useEffect(() => {
    if (currentUser || userRole === "admin") {
      loadQuickData();
      checkEnoughDataForAnalysis();
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

  const checkEnoughDataForAnalysis = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user && userRole !== "admin") return;

      // Calculate date 14 weeks ago
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split("T")[0];

      // Query to get entries from the last 14 days
      let query = supabase
        .from("time_entries")
        .select(
          `
          *,
          activities(name),
          areas(name, color),
          fields(name)
        `,
        )
        .gte("date", twoWeeksAgoStr)
        .order("date", { ascending: false });

      // Filter by user if member role
      if (userRole === "member" && user) {
        query = query.eq("user_id", user.id);
      }

      const { data: entries, error } = await query;

      if (error) throw error;

      // Format entries for AI analysis
      const formattedEntries =
        entries?.map((entry) => ({
          date: entry.date,
          duration: entry.duration,
          area: entry.areas?.name || "Unbekannt",
          field: entry.fields?.name || "Unbekannt",
          activity: entry.activities?.name || "Unbekannt",
          description: entry.description || "",
        })) || [];

      setLastTwoWeeksEntries(formattedEntries);
      setHasEnoughData(formattedEntries.length >= 5);

      console.log(
        `Found ${formattedEntries.length} entries in the last 14 days. Enough data: ${formattedEntries.length >= 5}`,
      );
    } catch (error) {
      console.error("Error checking data for analysis:", error);
      // Set empty data instead of mock data
      setLastTwoWeeksEntries([]);
      setHasEnoughData(false);
    }
  };

  const runAiAnalysis = async () => {
    try {
      setIsAnalyzing(true);

      // Call the edge function to generate optimization plan
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate-area-optimization-suggestions",
        {
          body: {
            entries: lastTwoWeeksEntries,
          },
        },
      );

      if (error) throw error;

      console.log("AI Optimization Analysis Response:", data);

      // Update suggestions with the AI response
      if (data.suggestions && data.suggestions.length > 0) {
        // Convert area suggestions format to match the expected format for aiSuggestions
        const formattedSuggestions = data.suggestions.map(
          (suggestion: any, index: number) => {
            const types = ["purple", "blue", "green", "amber"];
            return {
              title: suggestion.area,
              description: suggestion.suggestion,
              potential: `Einträge: ${suggestion.entriesCount}, Stunden: ${suggestion.totalHours.toFixed(1)}h`,
              type: types[index % types.length],
            };
          },
        );
        setAiSuggestions(formattedSuggestions);
      } else {
        // Fallback if no recommendations were returned
        setAiSuggestions([
          {
            title: "Automatisierung von Berichten",
            description:
              "Ihre regelmäßigen Dokumentationsaufgaben könnten durch KI-gestützte Automatisierung effizienter gestaltet werden. Implementieren Sie Vorlagen und KI-Assistenten für wiederkehrende Berichtsformate.",
            potential: "Zeitersparnis: 3-4 Stunden pro Woche",
            type: "purple",
          },
          {
            title: "Meeting-Optimierung",
            description:
              "KI kann Ihre Meetings effizienter gestalten durch automatische Zusammenfassungen, Transkription und Aktionspunkt-Extraktion. Reduzieren Sie die Meeting-Dauer und verbessern Sie die Nachbereitung.",
            potential: "Produktivitätssteigerung: 15-20%",
            type: "blue",
          },
          {
            title: "Priorisierung von Aufgaben",
            description:
              "Basierend auf Ihren Zeiteinträgen könnte ein KI-System Ihnen helfen, Aufgaben nach Wichtigkeit und Dringlichkeit zu priorisieren und optimale Zeitfenster für konzentriertes Arbeiten vorzuschlagen.",
            potential: "Effizienzsteigerung: 10-15%",
            type: "green",
          },
        ]);
      }
    } catch (error) {
      console.error("Error running AI analysis:", error);
      // Fallback suggestions on error
      setAiSuggestions([
        {
          title: "Automatisierung von Berichten",
          description:
            "Ihre regelmäßigen Dokumentationsaufgaben könnten durch KI-gestützte Automatisierung effizienter gestaltet werden.",
          potential: "Zeitersparnis: 3-4 Stunden pro Woche",
          type: "purple",
        },
        {
          title: "Meeting-Optimierung",
          description:
            "KI kann Ihre Meetings effizienter gestalten durch automatische Zusammenfassungen und Aktionspunkt-Extraktion.",
          potential: "Produktivitätssteigerung: 15-20%",
          type: "blue",
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAreaOptimizationSuggestions = async () => {
    try {
      setIsGeneratingAreaSuggestions(true);
      setAreaSuggestions([]);

      // Call the new edge function for area-specific suggestions
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate-area-optimization-suggestions",
        {
          body: {
            entries: lastTwoWeeksEntries,
          },
        },
      );

      if (error) throw error;

      console.log("Area Optimization Suggestions Response:", data);

      if (data.suggestions && data.suggestions.length > 0) {
        setAreaSuggestions(data.suggestions);
      } else {
        // Fallback if no suggestions were returned
        setAreaSuggestions([
          {
            area: "Allgemein",
            suggestion:
              "Keine spezifischen Vorschläge verfügbar. Versuchen Sie, mehr detaillierte Zeiteinträge zu erfassen.",
            entriesCount: 0,
            totalHours: 0,
          },
        ]);
      }
    } catch (error) {
      console.error("Error generating area optimization suggestions:", error);
      // Fallback suggestions on error
      setAreaSuggestions([
        {
          area: "Fehler",
          suggestion:
            "Es gab einen Fehler beim Generieren der Vorschläge. Bitte versuchen Sie es später erneut.",
          entriesCount: 0,
          totalHours: 0,
        },
      ]);
    } finally {
      setIsGeneratingAreaSuggestions(false);
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
      if (userRole === "member" && currentUser) {
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
        timeEntryData
          .slice(0, 5)
          .map((e) => ({
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

      const now = new Date();

      // Format a local Date as YYYY-MM-DD without UTC shift
      const fmtLocal = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const today = fmtLocal(now);
      console.log("Today's date (local):", today);

      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
      const startOfWeekStr = fmtLocal(startOfWeek);
      console.log("Start of week (Monday, local):", startOfWeekStr);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = fmtLocal(startOfMonth);
      console.log("Start of month (local):", startOfMonthStr);

      const normalizeDate = (dateStr: string) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const d = new Date(dateStr);
        return fmtLocal(d);
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

      // Set the recent time entry to show for 30 seconds
      setRecentTimeEntry(data);

      // Refresh data without full page reload
      await loadQuickData();

      // Trigger custom event to refresh other components
      window.dispatchEvent(new CustomEvent("timeEntryAdded", { detail: data }));

      // Switch to analytics tab to show the updated data with AI summaries
      setActiveTab("analytics");
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

  const handleAddEntryClick = useCallback(() => {
    setActiveTab("new-entry");
  }, []);

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
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      Loading...
                    </div>
                  }
                >
                  <TimeAnalyticsDashboard
                    userRole={userRole}
                    isOnboarded={isOnboarded}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent
                value="analytics"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      Loading...
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
                            <span className="text-gray-600">
                              Heutige Stunden
                            </span>
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
                                <p className="font-medium">
                                  {activity.activity}
                                </p>
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
                </Suspense>

                {/* AI Optimization Suggestions */}
                <Card className="border-2 border-yellow-100 mt-8">
                  <CardHeader className="bg-yellow-50">
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                      <Bot className="w-5 h-5 text-yellow-600" />
                      Vorschläge für KI-Optimierung
                    </CardTitle>
                    <CardDescription>
                      Basierend auf Ihren Daten der letzten zwei Wochen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {hasEnoughData ? (
                      aiSuggestions.length > 0 ? (
                        <div className="space-y-4 lg:space-y-6 pb-16 lg:pb-0">
                          {aiSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${suggestion.type === "purple" ? "bg-purple-50 border-purple-200" : suggestion.type === "blue" ? "bg-blue-50 border-blue-200" : suggestion.type === "green" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
                            >
                              <h3
                                className={`text-lg font-medium mb-2 ${suggestion.type === "purple" ? "text-purple-700" : suggestion.type === "blue" ? "text-blue-700" : suggestion.type === "green" ? "text-green-700" : "text-amber-700"}`}
                              >
                                {suggestion.title}
                              </h3>
                              <p className="text-gray-700 mb-3">
                                {suggestion.description}
                              </p>
                              <div
                                className={`text-sm font-medium ${suggestion.type === "purple" ? "text-purple-600" : suggestion.type === "blue" ? "text-blue-600" : suggestion.type === "green" ? "text-green-600" : "text-amber-600"}`}
                              >
                                {suggestion.potential}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Button
                            onClick={runAiAnalysis}
                            disabled={isAnalyzing}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                          >
                            {isAnalyzing ? (
                              <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                KI-Analyse läuft...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5" />
                                KI-Optimierungsplan erstellen
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-gray-500 mt-3">
                            Analysiert Ihre Zeiteinträge und gibt Empfehlungen
                            zur KI-Optimierung
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-4 lg:py-8">
                        {hasEnoughData ? (
                          <div>
                            <Button
                              onClick={generateAreaOptimizationSuggestions}
                              disabled={isGeneratingAreaSuggestions}
                              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 mx-auto mb-4"
                            >
                              {isGeneratingAreaSuggestions ? (
                                <>
                                  <RefreshCw className="w-5 h-5 animate-spin" />
                                  Generiere Optimierungsvorschläge...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5" />
                                  Optimierungsvorschläge generieren
                                </>
                              )}
                            </Button>
                            <p className="text-sm text-gray-500">
                              Analysiert Ihre Zeiteinträge bereichsweise und
                              gibt spezifische Make.com Workflow- und
                              ChatGPT-Empfehlungen
                            </p>
                          </div>
                        ) : (
                          <div>
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-70" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Nicht genügend Daten
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Für KI-Optimierungsvorschläge werden mindestens 5
                              Zeiteinträge aus den letzten zwei Wochen benötigt.
                            </p>
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-800 text-sm">
                              <p className="font-medium">Aktueller Status:</p>
                              <p>
                                {lastTwoWeeksEntries.length} von 5 benötigten
                                Einträgen vorhanden
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Area-Specific Optimization Suggestions */}
                {areaSuggestions.length > 0 && (
                  <Card className="border-2 border-blue-100 mt-8">
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="flex items-center gap-2 text-blue-800">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        Bereichsspezifische Optimierungsvorschläge
                      </CardTitle>
                      <CardDescription>
                        Make.com Workflows und ChatGPT Prompts für Ihre
                        Arbeitsbereiche
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-8">
                        {areaSuggestions.map((areaSuggestion, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                {areaSuggestion.area}
                              </h3>
                              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {areaSuggestion.entriesCount} Einträge •{" "}
                                {areaSuggestion.totalHours.toFixed(1)}h
                              </div>
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                              {areaSuggestion.suggestion
                                .split("\n")
                                .map((line: string, lineIndex: number) => {
                                  if (line.trim() === "")
                                    return <br key={lineIndex} />;
                                  if (line.startsWith("•")) {
                                    return (
                                      <div
                                        key={lineIndex}
                                        className="flex items-start gap-2 my-2"
                                      >
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                        <span>{line.substring(1).trim()}</span>
                                      </div>
                                    );
                                  }
                                  if (
                                    line.includes("**") &&
                                    line.includes("**")
                                  ) {
                                    const parts = line.split("**");
                                    return (
                                      <p key={lineIndex} className="my-2">
                                        {parts.map((part: string, partIndex: number) =>
                                          partIndex % 2 === 1 ? (
                                            <strong
                                              key={partIndex}
                                              className="text-blue-700"
                                            >
                                              {part}
                                            </strong>
                                          ) : (
                                            part
                                          ),
                                        )}
                                      </p>
                                    );
                                  }
                                  return (
                                    <p key={lineIndex} className="my-2">
                                      {line}
                                    </p>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent
                value="categories"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      Loading...
                    </div>
                  }
                >
                  <CategoryManagement />
                </Suspense>
              </TabsContent>

              <TabsContent
                value="new-entry"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      Loading...
                    </div>
                  }
                >
                  <div className="space-y-4 lg:space-y-6 pb-16 lg:pb-0">
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
                </Suspense>
              </TabsContent>

              <TabsContent
                value="entries"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      Loading...
                    </div>
                  }
                >
                  <TimeEntriesTable
                    userRole={userRole}
                    isOnboarded={isOnboarded}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent
                value="ai-chat"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      Loading...
                    </div>
                  }
                >
                  <AIChat userRole={userRole} />
                </Suspense>
              </TabsContent>

              <TabsContent
                value="profile"
                className="p-0 sm:px-3 sm:pb-3 lg:px-6 lg:pb-6"
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full">
                      Loading...
                    </div>
                  }
                >
                  <Profile />
                </Suspense>
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
