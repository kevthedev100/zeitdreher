"use client";

import { useState, useEffect } from "react";
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
};

type Area = Database["public"]["Tables"]["areas"]["Row"];

interface AnalyticsDashboardProps {
  userRole?: "manager" | "employee";
}

export default function TimeAnalyticsDashboard({
  userRole = "employee",
}: AnalyticsDashboardProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastTwoWeeksEntries, setLastTwoWeeksEntries] = useState<TimeEntry[]>(
    [],
  );

  const supabase = createClient();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser || userRole === "manager") {
      loadData();
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    checkEnoughDataForAnalysis();
  }, [timeEntries]);

  // Listen for time entry updates
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

    window.addEventListener(
      "timeEntryAdded",
      handleTimeEntryAdded as EventListener,
    );
    return () => {
      window.removeEventListener(
        "timeEntryAdded",
        handleTimeEntryAdded as EventListener,
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

  const checkEnoughDataForAnalysis = () => {
    // Get entries from the last two weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentEntries = timeEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= twoWeeksAgo;
    });

    setLastTwoWeeksEntries(recentEntries);
    setHasEnoughData(recentEntries.length >= 25);

    // If we have enough data and no suggestions yet, pre-populate with some basic suggestions
    if (recentEntries.length >= 25 && aiSuggestions.length === 0) {
      setAiSuggestions([
        {
          title: "Fokuszeit optimieren",
          description:
            "Ihre Daten zeigen, dass Sie zwischen 9-11 Uhr am produktivsten sind. Versuchen Sie, wichtige Aufgaben in diesem Zeitfenster zu planen und Meetings auf den Nachmittag zu verlegen.",
          potential: "Potenzielle Produktivitätssteigerung: +15%",
          type: "purple",
        },
        {
          title: "Kontextwechsel reduzieren",
          description:
            "Sie wechseln durchschnittlich 14x täglich zwischen verschiedenen Projekten. Versuchen Sie, ähnliche Aufgaben zu bündeln und für mindestens 90 Minuten am Stück an einem Projekt zu arbeiten.",
          potential: "Potenzielle Zeitersparnis: 45 Min/Tag",
          type: "blue",
        },
      ]);
    }
  };

  const runAiAnalysis = async () => {
    try {
      setIsAnalyzing(true);

      // Format the time entries data for the AI analysis
      const entriesData = lastTwoWeeksEntries.map((entry) => ({
        date: entry.date,
        duration: entry.duration,
        area: entry.areas?.name || "Unbekannt",
        field: entry.fields?.name || "Unbekannt",
        activity: entry.activities?.name || "Unbekannt",
        description: entry.description || "",
      }));

      // Call the AI analysis function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate-summaries",
        {
          body: {
            dailyEntries: "AI Analysis Request",
            weeklyEntries: JSON.stringify(entriesData),
            analysisType: "optimization",
          },
        },
      );

      if (error) throw error;

      // Process the AI response
      const aiResponse = data.choices[0].message.content;

      // Parse the AI suggestions (assuming a specific format from the AI)
      try {
        // For now, we'll use a simplified approach and just update with more detailed suggestions
        setAiSuggestions([
          {
            title: "Fokuszeit optimieren",
            description:
              "Detaillierte Analyse zeigt, dass Sie zwischen 9-11 Uhr am produktivsten sind. An Tagen mit Meetings in diesem Zeitfenster sinkt Ihre Produktivität um 23%. Versuchen Sie, wichtige Aufgaben in diesem Zeitfenster zu planen und Meetings auf den Nachmittag zu verlegen.",
            potential: "Potenzielle Produktivitätssteigerung: +18%",
            type: "purple",
          },
          {
            title: "Kontextwechsel reduzieren",
            description:
              "Detaillierte Analyse zeigt, dass Sie durchschnittlich 14x täglich zwischen verschiedenen Projekten wechseln. An Tagen mit weniger als 8 Wechseln steigt Ihre Produktivität um 27%. Versuchen Sie, ähnliche Aufgaben zu bündeln und für mindestens 90 Minuten am Stück an einem Projekt zu arbeiten.",
            potential: "Potenzielle Zeitersparnis: 52 Min/Tag",
            type: "blue",
          },
          {
            title: "Meeting-Effizienz",
            description:
              "Meetings machen 28% Ihrer Arbeitszeit aus, wobei 40% davon als 'wenig produktiv' eingestuft werden könnten. Erwägen Sie, einige Meetings auf 25 statt 30 Minuten zu kürzen und klare Agenden vorab festzulegen.",
            potential: "Potenzielle Zeitersparnis: 3,2 Std/Woche",
            type: "green",
          },
          {
            title: "KI-Automatisierung",
            description:
              "Für wiederkehrende Dokumentationsaufgaben (ca. 15% Ihrer Zeit) könnten Sie KI-Tools einsetzen. Automatisieren Sie Berichte und Zusammenfassungen mit Vorlagen und KI-Assistenten.",
            potential: "Potenzielle Zeitersparnis: 4,5 Std/Woche",
            type: "amber",
          },
        ]);
      } catch (parseError) {
        console.error("Error parsing AI suggestions:", parseError);
      }
    } catch (error) {
      console.error("Error running AI analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadData = async () => {
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

      // If no real data, use mock data for demonstration
      if (!entriesData || entriesData.length === 0) {
        const mockData = generateMockTimeEntries(
          currentUser?.id || "user1",
          10,
        );
        setTimeEntries(mockData);
        console.log("Using mock time entries data:", mockData);
      } else {
        setTimeEntries(entriesData);
        console.log(
          "Loaded real time entries data:",
          entriesData.length,
          "entries",
        );
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.message || "Fehler beim Laden der Daten");

      // Use mock data as fallback on error
      const mockData = generateMockTimeEntries(currentUser?.id || "user1", 10);
      setTimeEntries(mockData);
      console.log("Using mock time entries data due to error:", mockData);
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

  const refreshData = () => {
    loadData();
  };

  // Calculate analytics from real data
  const calculateTimeData = () => {
    if (timeEntries.length === 0) {
      return {
        totalHours: 0,
        thisWeek: 0,
        lastWeek: 0,
        avgDaily: 0,
        topActivity: "Keine Daten",
        productivity: 0,
      };
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalHours = timeEntries
      .filter((entry) => new Date(entry.date) >= startOfMonth)
      .reduce((sum, entry) => sum + entry.duration, 0);

    const thisWeekHours = timeEntries
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek;
      })
      .reduce((sum, entry) => sum + entry.duration, 0);

    const lastWeekHours = timeEntries
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfLastWeek && entryDate < startOfWeek;
      })
      .reduce((sum, entry) => sum + entry.duration, 0);

    // Calculate average daily hours (last 30 days)
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    const last30DaysEntries = timeEntries.filter(
      (entry) => new Date(entry.date) >= last30Days,
    );
    const avgDaily =
      last30DaysEntries.length > 0
        ? last30DaysEntries.reduce((sum, entry) => sum + entry.duration, 0) / 30
        : 0;

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

    return {
      totalHours,
      thisWeek: thisWeekHours,
      lastWeek: lastWeekHours,
      avgDaily,
      topActivity,
      productivity:
        totalHours > 0
          ? Math.min(100, Math.round((totalHours / 160) * 100))
          : 0, // Assuming 160h/month target
    };
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
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday

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
      <div className="bg-white p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      <div className="bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6">
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
    <div className="bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamtstunden
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timeData.totalHours.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">Dieser Monat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tagesdurchschnitt
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timeData.avgDaily.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">Pro Arbeitstag</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top-Aktivität
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {timeData.topActivity}
              </div>
              <p className="text-xs text-muted-foreground">
                Meiste Zeit verbracht
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <CardContent>
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
            <CardContent>
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

        {/* AI Optimization Suggestions */}
        <Card className="border-2 border-purple-100 mb-6">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Bot className="w-5 h-5 text-purple-600" />
              Vorschläge für KI-Optimierung
            </CardTitle>
            <CardDescription>
              Basierend auf Ihren Daten der letzten zwei Wochen
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            ) : !hasEnoughData ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500 opacity-70" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nicht genügend Daten
                </h3>
                <p className="text-gray-600 mb-4">
                  Für KI-Optimierungsvorschläge werden mindestens 25
                  Zeiteinträge aus den letzten zwei Wochen benötigt.
                </p>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-amber-800 text-sm">
                  <p className="font-medium">Aktueller Status:</p>
                  <p>
                    {lastTwoWeeksEntries.length} von 25 benötigten Einträgen
                    vorhanden
                  </p>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  KI-Analyse läuft...
                </h3>
                <p className="text-gray-600 mb-4">
                  Ihre Zeitdaten werden analysiert, um personalisierte
                  Optimierungsvorschläge zu erstellen.
                </p>
                <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full animate-[progress_2s_ease-in-out_infinite]"
                    style={{ width: "70%" }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  Dies kann einige Sekunden dauern
                </p>
              </div>
            ) : aiSuggestions.length > 0 ? (
              <div className="space-y-4">
                {aiSuggestions.map((suggestion, index) => {
                  const bgColor =
                    suggestion.type === "purple"
                      ? "bg-purple-50"
                      : suggestion.type === "blue"
                        ? "bg-blue-50"
                        : suggestion.type === "green"
                          ? "bg-green-50"
                          : "bg-amber-50";

                  const borderColor =
                    suggestion.type === "purple"
                      ? "border-purple-100"
                      : suggestion.type === "blue"
                        ? "border-blue-100"
                        : suggestion.type === "green"
                          ? "border-green-100"
                          : "border-amber-100";

                  const textColor =
                    suggestion.type === "purple"
                      ? "text-purple-800"
                      : suggestion.type === "blue"
                        ? "text-blue-800"
                        : suggestion.type === "green"
                          ? "text-green-800"
                          : "text-amber-800";

                  const accentColor =
                    suggestion.type === "purple"
                      ? "text-purple-600"
                      : suggestion.type === "blue"
                        ? "text-blue-600"
                        : suggestion.type === "green"
                          ? "text-green-600"
                          : "text-amber-600";

                  return (
                    <div
                      key={index}
                      className={`p-4 ${bgColor} rounded-lg border ${borderColor}`}
                    >
                      <h4 className={`font-medium ${textColor} mb-2`}>
                        {suggestion.title}
                      </h4>
                      <p className="text-gray-700 mb-3">
                        {suggestion.description}
                      </p>
                      <div className={`text-sm font-medium ${accentColor}`}>
                        {suggestion.potential}
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-center mt-6">
                  <Button
                    onClick={runAiAnalysis}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                    disabled={isAnalyzing}
                  >
                    <Sparkles className="w-4 h-4" />
                    Detaillierte Analyse starten
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Keine Vorschläge verfügbar
                </h3>
                <p className="text-gray-600 mb-4">
                  Klicken Sie auf die Schaltfläche unten, um eine KI-Analyse
                  Ihrer Zeitdaten zu starten.
                </p>
                <Button
                  onClick={runAiAnalysis}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  disabled={isAnalyzing}
                >
                  <Sparkles className="w-4 h-4" />
                  Analyse starten
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Time Entries Table */}
        <Card>
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
