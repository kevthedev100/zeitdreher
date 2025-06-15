"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  PieChart,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  Bot,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { createClient } from "../../supabase/client";
import type { Database } from "@/types/supabase";

type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  areas: { name: string; color: string } | null;
  fields: { name: string } | null;
  activities: { name: string } | null;
  users: { full_name: string; email: string } | null;
  start_time?: string | null;
};

type Area = Database["public"]["Tables"]["areas"]["Row"];

interface AnalyticsDashboardProps {
  userRole?: "manager" | "employee";
  isOnboarded?: boolean;
}

export default function TimeAnalyticsDashboard({
  userRole = "employee",
  isOnboarded = false,
}: AnalyticsDashboardProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser || userRole === "manager") {
      loadData();
    }
  }, [currentUser, userRole]);

  // Listen for time entry updates and edit requests
  useEffect(() => {
    const handleTimeEntryAdded = (event: CustomEvent) => {
      console.log(
        "Time entry added event received in analytics:",
        event.detail,
      );
      // Ensure we reload data with a slight delay to allow database updates to complete
      setTimeout(() => {
        loadData();
      }, 500);
    };

    const handleTimeEntryUpdated = (event: CustomEvent) => {
      console.log(
        "Time entry updated event received in analytics:",
        event.detail,
      );
      // Reload data when entries are updated
      setTimeout(() => {
        loadData();
      }, 500);
    };

    const handleTimeEntryDeleted = (event: CustomEvent) => {
      console.log(
        "Time entry deleted event received in analytics:",
        event.detail,
      );
      // Reload data when entries are deleted
      setTimeout(() => {
        loadData();
      }, 500);
    };

    window.addEventListener(
      "timeEntryAdded",
      handleTimeEntryAdded as EventListener,
    );
    window.addEventListener(
      "timeEntryUpdated",
      handleTimeEntryUpdated as EventListener,
    );
    window.addEventListener(
      "timeEntryDeleted",
      handleTimeEntryDeleted as EventListener,
    );

    return () => {
      window.removeEventListener(
        "timeEntryAdded",
        handleTimeEntryAdded as EventListener,
      );
      window.removeEventListener(
        "timeEntryUpdated",
        handleTimeEntryUpdated as EventListener,
      );
      window.removeEventListener(
        "timeEntryDeleted",
        handleTimeEntryDeleted as EventListener,
      );
    };
  }, []);

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

  // No mock data generation - we only use real user data

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load areas
      const { data: areasData, error: areasError } = await supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (areasError) throw areasError;
      setAreas(areasData || []);

      // Get today's date for filtering
      const today = new Date().toISOString().split("T")[0];

      // Load time entries with related data
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

      // Filter by user role
      if (userRole === "employee" && currentUser) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data: entriesData, error: entriesError } = await query;

      if (entriesError) throw entriesError;

      // Only use real data, no mock data
      setTimeEntries(entriesData || []);
      console.log(
        "Loaded time entries data:",
        entriesData ? entriesData.length : 0,
        "entries",
      );
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Fehler beim Laden der Daten");

      // Always show empty state on error, regardless of onboarding status
      setTimeEntries([]);
      console.log("Error loading data - showing empty state");
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  const refreshData = () => {
    loadData();
  };

  // Calculate analytics from real data
  const calculateTimeData = () => {
    console.log("=== Analytics Dashboard calculateTimeData Debug ===");
    console.log("Total time entries:", timeEntries.length);
    console.log(
      "Time entries:",
      timeEntries.map((e) => ({
        date: e.date,
        duration: e.duration,
        activity: e.activities?.name,
      })),
    );

    if (timeEntries.length === 0) {
      console.log("No time entries found, returning zeros");
      return {
        todayHours: 0,
        thisWeek: 0,
        lastWeek: 0,
        thisMonth: 0,
        topActivity: "Keine Daten",
        productivity: 0,
      };
    }

    // Use local timezone for all date calculations
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

    // Calculate start of last week
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    const startOfLastWeekStr = startOfLastWeek.toISOString().split("T")[0];
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setDate(startOfWeek.getDate() - 1);
    const endOfLastWeekStr = endOfLastWeek.toISOString().split("T")[0];
    console.log(
      "Last week range (local):",
      startOfLastWeekStr,
      "to",
      endOfLastWeekStr,
    );

    // Calculate start of current month in local timezone
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
    console.log("Start of month (local):", startOfMonthStr);

    // Helper function to normalize date strings for comparison
    const normalizeDate = (dateStr: string) => {
      // Ensure we're working with YYYY-MM-DD format
      const date = new Date(dateStr + "T00:00:00.000Z");
      return date.toISOString().split("T")[0];
    };

    // Calculate today's hours
    const todayEntries = timeEntries.filter((entry) => {
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
    const thisWeekEntries = timeEntries.filter((entry) => {
      const entryDate = normalizeDate(entry.date);
      const match = entryDate >= startOfWeekStr;
      console.log(
        `Comparing entry date ${entryDate} >= start of week ${startOfWeekStr}: ${match}`,
      );
      return match;
    });
    const thisWeekHours = thisWeekEntries.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );
    console.log(
      "This week's entries:",
      thisWeekEntries.length,
      "Total hours:",
      thisWeekHours,
      "Entries:",
      thisWeekEntries.map((e) => ({ date: e.date, duration: e.duration })),
    );

    // Calculate last week's hours
    const lastWeekEntries = timeEntries.filter((entry) => {
      const entryDate = normalizeDate(entry.date);
      const match =
        entryDate >= startOfLastWeekStr && entryDate <= endOfLastWeekStr;
      console.log(
        `Comparing entry date ${entryDate} in range ${startOfLastWeekStr} to ${endOfLastWeekStr}: ${match}`,
      );
      return match;
    });
    const lastWeekHours = lastWeekEntries.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );
    console.log(
      "Last week's entries:",
      lastWeekEntries.length,
      "Total hours:",
      lastWeekHours,
    );

    // Calculate this month's hours
    const thisMonthEntries = timeEntries.filter((entry) => {
      const entryDate = normalizeDate(entry.date);
      const match = entryDate >= startOfMonthStr;
      console.log(
        `Comparing entry date ${entryDate} >= start of month ${startOfMonthStr}: ${match}`,
      );
      return match;
    });
    const thisMonthHours = thisMonthEntries.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );
    console.log(
      "This month's entries:",
      thisMonthEntries.length,
      "Total hours:",
      thisMonthHours,
      "Entries:",
      thisMonthEntries.map((e) => ({ date: e.date, duration: e.duration })),
    );

    // Find top activity
    const activityHours: { [key: string]: number } = {};
    timeEntries.forEach((entry) => {
      const activityName = entry.activities?.name || "Unbekannt";
      activityHours[activityName] =
        (activityHours[activityName] || 0) + entry.duration;
    });

    const topActivity =
      Object.keys(activityHours).length > 0
        ? Object.keys(activityHours).reduce((a, b) =>
            activityHours[a] > activityHours[b] ? a : b,
          )
        : "Keine Daten";

    console.log("Activity breakdown:", activityHours);
    console.log("Top activity:", topActivity);

    const result = {
      todayHours,
      thisWeek: thisWeekHours,
      lastWeek: lastWeekHours,
      thisMonth: thisMonthHours,
      topActivity,
      productivity:
        thisMonthHours > 0
          ? Math.min(100, Math.round((thisMonthHours / 160) * 100))
          : 0, // Assuming 160h/month target
    };

    console.log("Final calculated result:", result);
    console.log("=== End Analytics Dashboard Debug ===");

    return result;
  };

  const calculateAreaBreakdown = () => {
    if (timeEntries.length === 0) return [];

    const areaHours: { [key: string]: { hours: number; color: string } } = {};
    let totalHours = 0;

    timeEntries.forEach((entry) => {
      const areaName = entry.areas?.name || "Unbekannt";
      const areaColor = entry.areas?.color || "#6B7280";
      areaHours[areaName] = areaHours[areaName] || {
        hours: 0,
        color: areaColor,
      };
      areaHours[areaName].hours += entry.duration;
      totalHours += entry.duration;
    });

    return Object.entries(areaHours)
      .map(([name, data]) => ({
        name,
        hours: data.hours,
        percentage:
          totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0,
        color: `bg-[${data.color}]`,
      }))
      .sort((a, b) => b.hours - a.hours);
  };

  const calculateWeeklyTrend = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const startOfWeek = new Date(now);
    // Fix: Handle Sunday (0) correctly
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(now.getDate() - daysToMonday); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);

      const dayHours = timeEntries
        .filter((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate.toDateString() === dayDate.toDateString();
        })
        .reduce((sum, entry) => sum + entry.duration, 0);

      return { day, hours: dayHours };
    });
  };

  const getRecentEntries = () => {
    return timeEntries.slice(0, 5).map((entry) => ({
      id: entry.id,
      activity: entry.activities?.name || "Unbekannte Aktivität",
      duration: entry.duration,
      date: entry.date,
      area: entry.areas?.name || "Unbekannter Bereich",
    }));
  };

  const timeData = calculateTimeData();
  const areaBreakdown = calculateAreaBreakdown();
  const weeklyTrend = calculateWeeklyTrend();
  const recentEntries = getRecentEntries();

  const getAreaColor = (area: string) => {
    const colors: { [key: string]: string } = {
      Entwicklung: "bg-blue-100 text-blue-800",
      Meetings: "bg-green-100 text-green-800",
      Planung: "bg-purple-100 text-purple-800",
      Testing: "bg-orange-100 text-orange-800",
    };
    return colors[area] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="bg-white p-1 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 mb-4 sm:mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-white border rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white border rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-1 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="px-3 py-2">
              <div className="text-center">
                <div className="text-red-600 mb-2">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Fehler beim Laden der Daten
                </h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={refreshData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-1 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zeit-Analytik</h1>
            <p className="text-gray-600 mt-1">
              {userRole === "manager"
                ? "Unternehmensweite Zeiterfassungsübersicht"
                : "Ihr persönliches Zeiterfassungs-Dashboard"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Badge
              variant={userRole === "manager" ? "default" : "secondary"}
              className="text-sm"
            >
              {userRole === "manager"
                ? "Manager-Ansicht"
                : "Mitarbeiter-Ansicht"}
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6 sm:mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2">
              <CardTitle className="text-sm font-medium">
                Heutige Stunden
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 py-2">
              <div className="text-2xl font-bold">
                {timeData.todayHours.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">Heute erfasst</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2">
              <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 py-2">
              <div className="text-2xl font-bold">
                {timeData.thisWeek.toFixed(1)}h
              </div>
              <p className="text-xs text-green-600">
                {timeData.thisWeek >= timeData.lastWeek ? "+" : ""}
                {(timeData.thisWeek - timeData.lastWeek).toFixed(1)}h seit
                letzter Woche
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2">
              <CardTitle className="text-sm font-medium">
                Dieser Monat
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 py-2">
              <div className="text-2xl font-bold">
                {timeData.thisMonth.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">Monatsstunden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2">
              <CardTitle className="text-sm font-medium">
                Top-Aktivität
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 py-2">
              <div className="text-2xl font-bold text-blue-600">
                {timeData.topActivity}
              </div>
              <p className="text-xs text-muted-foreground">
                Meiste Zeit verbracht
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Time Distribution Bar */}
        <Card className="bg-transparent sm:bg-white border-0 sm:border shadow-none sm:shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tagesübersicht
            </CardTitle>
            <CardDescription>
              Zeitverteilung über den Tag (5 Uhr bis 0 Uhr)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeEntries.length > 0 ? (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="text-center text-xs sm:text-sm">
                        {(i + 5) % 24}
                        <span className="hidden sm:inline">:00</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-10 bg-gray-100 rounded-lg relative">
                    {/* Create a single continuous bar */}
                    <div className="absolute top-0 left-0 h-full w-full">
                      {/* Process entries to create time segments */}
                      {(() => {
                        // Create time segments for the entire day (5:00 to 0:00)
                        // Each segment represents 5 minutes
                        const totalMinutes = 19 * 60; // 19 hours from 5:00 to 0:00
                        const segmentSize = 5; // 5-minute segments
                        const segments = Array(totalMinutes / segmentSize)
                          .fill(null)
                          .map(() => []);

                        // Format time for display
                        const formatTime = (date: Date) => {
                          return date.toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        };

                        // Get today's date for filtering
                        const today = new Date().toISOString().split("T")[0];

                        // Map entries to segments - ONLY TODAY'S ENTRIES
                        timeEntries
                          .filter((entry) => entry.date === today) // Filter for today only
                          .forEach((entry) => {
                            const startTime = entry.start_time
                              ? new Date(`${entry.date}T${entry.start_time}`)
                              : null;
                            if (!startTime) return;

                            const hour = startTime.getHours();
                            if (hour < 5) return; // Only show entries between 5:00 and 24:00

                            // Calculate start and end minutes from 5:00
                            const startHourAdjusted =
                              hour >= 5 ? hour - 5 : hour + 19;
                            const startMinuteTotal =
                              startHourAdjusted * 60 + startTime.getMinutes();

                            // Calculate end time
                            const endTime = new Date(startTime);
                            endTime.setMinutes(
                              endTime.getMinutes() + entry.duration * 60,
                            );
                            const endHour = endTime.getHours();
                            const endHourAdjusted =
                              endHour >= 5 ? endHour - 5 : endHour + 19;
                            const endMinuteTotal =
                              endHourAdjusted * 60 + endTime.getMinutes();

                            // Assign entry to all segments it spans
                            for (
                              let minute = startMinuteTotal;
                              minute < endMinuteTotal;
                              minute += segmentSize
                            ) {
                              const segmentIndex = Math.floor(
                                minute / segmentSize,
                              );
                              if (
                                segmentIndex >= 0 &&
                                segmentIndex < segments.length
                              ) {
                                segments[segmentIndex].push({
                                  ...entry,
                                  startTime,
                                  endTime,
                                  formatTime,
                                });
                              }
                            }
                          });

                        // Render segments
                        return segments.map(
                          (entriesInSegment, segmentIndex) => {
                            if (entriesInSegment.length === 0) return null;

                            const position =
                              ((segmentIndex * segmentSize) / totalMinutes) *
                              100;
                            const width = (segmentSize / totalMinutes) * 100;

                            // If only one entry in this segment, render it normally
                            if (entriesInSegment.length === 1) {
                              const entry = entriesInSegment[0];
                              return (
                                <div
                                  key={`segment-${segmentIndex}`}
                                  className="absolute h-full cursor-pointer hover:opacity-100 hover:z-10 transition-all duration-200 group"
                                  style={{
                                    left: `${position}%`,
                                    width: `${width}%`,
                                    backgroundColor:
                                      entry.areas?.color || "#6B7280",
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    console.log(
                                      "Clicked on time entry:",
                                      entry.id,
                                      "isMock:",
                                      entry.isMockData,
                                    );

                                    // All entries are real data now

                                    // Dispatch event to open edit dialog for this entry
                                    const editEvent = new CustomEvent(
                                      "openTimeEntryEditDialog",
                                      {
                                        detail: {
                                          entryId: entry.id,
                                        },
                                        bubbles: true,
                                        cancelable: true,
                                      },
                                    );

                                    console.log(
                                      "About to dispatch openTimeEntryEditDialog event for:",
                                      entry.id,
                                    );

                                    const dispatched =
                                      window.dispatchEvent(editEvent);

                                    console.log(
                                      "Event dispatched successfully:",
                                      dispatched,
                                      "Event detail:",
                                      editEvent.detail,
                                    );

                                    // Also try dispatching on document as fallback
                                    setTimeout(() => {
                                      const fallbackEvent = new CustomEvent(
                                        "openTimeEntryEditDialog",
                                        {
                                          detail: {
                                            entryId: entry.id,
                                          },
                                          bubbles: true,
                                          cancelable: true,
                                        },
                                      );
                                      document.dispatchEvent(fallbackEvent);
                                      console.log(
                                        "Fallback event dispatched on document",
                                      );
                                    }, 100);
                                  }}
                                  title={`${entry.activities?.name || "Aktivität"}: ${entry.duration.toFixed(1)}h (${entry.formatTime(entry.startTime)} - ${entry.formatTime(entry.endTime)})`}
                                >
                                  <div className="hidden group-hover:block absolute bottom-full left-0 bg-black text-white text-xs rounded p-2 mb-1 whitespace-nowrap z-20">
                                    {entry.activities?.name || "Aktivität"}:{" "}
                                    {entry.duration.toFixed(1)}h
                                    <br />
                                    {entry.formatTime(entry.startTime)} -{" "}
                                    {entry.formatTime(entry.endTime)}
                                    <br />
                                    {entry.areas?.name || "Bereich"}
                                    {entry.description && (
                                      <>
                                        <br />
                                        {entry.description.substring(0, 50)}
                                        {entry.description.length > 50
                                          ? "..."
                                          : ""}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            } else {
                              // Multiple entries in this segment - create a striped/gradient effect
                              const entryCount = entriesInSegment.length;
                              return (
                                <div
                                  key={`segment-${segmentIndex}`}
                                  className="absolute h-full cursor-pointer hover:opacity-100 hover:z-10 transition-all duration-200 group"
                                  style={{
                                    left: `${position}%`,
                                    width: `${width}%`,
                                    background: `linear-gradient(90deg, ${entriesInSegment
                                      .map(
                                        (entry, i) =>
                                          `${entry.areas?.color || "#6B7280"} ${(i / entryCount) * 100}%, ${entry.areas?.color || "#6B7280"} ${((i + 1) / entryCount) * 100}%`,
                                      )
                                      .join(", ")})`,
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    // For multiple entries, show the first one for editing
                                    const firstEntry = entriesInSegment[0];
                                    console.log(
                                      "Clicked on multiple entries, editing first:",
                                      firstEntry.id,
                                      "isMock:",
                                      firstEntry.isMockData,
                                    );

                                    // All entries are real data now

                                    const editEvent = new CustomEvent(
                                      "openTimeEntryEditDialog",
                                      {
                                        detail: {
                                          entryId: firstEntry.id,
                                        },
                                        bubbles: true,
                                        cancelable: true,
                                      },
                                    );
                                    window.dispatchEvent(editEvent);
                                    console.log(
                                      "Dispatched openTimeEntryEditDialog event for:",
                                      firstEntry.id,
                                    );
                                  }}
                                  title={`${entryCount} überlappende Einträge`}
                                >
                                  <div className="hidden group-hover:block absolute bottom-full left-0 bg-black text-white text-xs rounded p-2 mb-1 whitespace-nowrap z-20">
                                    <strong>
                                      {entryCount} überlappende Einträge:
                                    </strong>
                                    <br />
                                    {entriesInSegment.map((entry, i) => (
                                      <div key={i} className="mt-1">
                                        {i + 1}.{" "}
                                        {entry.activities?.name || "Aktivität"}:{" "}
                                        {entry.duration.toFixed(1)}h
                                        <br />
                                        <span className="text-xs opacity-75">
                                          {entry.formatTime(entry.startTime)} -{" "}
                                          {entry.formatTime(entry.endTime)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          },
                        );
                      })()}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-center text-gray-600">
                    Der Balken zeigt Ihre Zeitverteilung über den Tag (klicken
                    zum Bearbeiten)
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Daten verfügbar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Time Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Zeitverteilung nach Bereichen
              </CardTitle>
              <CardDescription>
                Aufschlüsselung der Stunden nach verschiedenen Arbeitsbereichen
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 py-2">
              <div className="space-y-4">
                {areaBreakdown.length > 0 ? (
                  areaBreakdown.map((area, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: area.color
                              .replace("bg-[", "")
                              .replace("]", ""),
                          }}
                        ></div>
                        <span className="font-medium">{area.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {area.hours.toFixed(1)}h
                        </div>
                        <div className="text-sm text-gray-500">
                          {area.percentage}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Keine Daten verfügbar</p>
                  </div>
                )}
              </div>

              {/* Simple visual representation */}
              <div className="mt-6">
                <div className="flex h-4 rounded-full overflow-hidden">
                  {areaBreakdown.map((area, index) => (
                    <div
                      key={index}
                      style={{
                        width: `${area.percentage}%`,
                        backgroundColor: area.color
                          .replace("bg-[", "")
                          .replace("]", ""),
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Trend Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Wöchentlicher Stunden-Trend
              </CardTitle>
              <CardDescription>
                Täglich gearbeitete Stunden diese Woche
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 py-2">
              <div className="space-y-4">
                {weeklyTrend.length > 0 ? (
                  weeklyTrend.map((day, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-12 text-sm font-medium">{day.day}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, (day.hours / 10) * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold w-12">
                            {day.hours.toFixed(1)}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Keine Daten verfügbar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Time Entries Table */}
        <Card className="bg-transparent sm:bg-white border-0 sm:border shadow-none sm:shadow-sm">
          <CardHeader>
            <CardTitle>Letzte Zeiteinträge</CardTitle>
            <CardDescription>
              {userRole === "manager"
                ? "Neueste Einträge aller Teammitglieder"
                : "Ihre letzten Zeiteinträge"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Aktivität</th>
                    <th className="text-left py-2 font-medium">Bereich</th>
                    <th className="text-left py-2 font-medium">Dauer</th>
                    <th className="text-left py-2 font-medium">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.length > 0 ? (
                    recentEntries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{entry.activity}</td>
                        <td className="py-3">
                          <Badge
                            variant="secondary"
                            className={getAreaColor(entry.area)}
                          >
                            {entry.area}
                          </Badge>
                        </td>
                        <td className="py-3">{entry.duration.toFixed(1)}h</td>
                        <td className="py-3 text-gray-600">
                          {new Date(entry.date).toLocaleDateString("de-DE")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-gray-500"
                      >
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Keine aktuellen Einträge verfügbar</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
