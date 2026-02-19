"use client";

import { useState, useEffect } from "react";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  BarChart3,
  RefreshCw,
  Bot,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { createClient } from "../../../supabase/client";
import AIDailySummary from "@/components/ai-daily-summary";
import AIWeeklySummary from "@/components/ai-weekly-summary";
import AIMonthlySummary from "@/components/ai-monthly-summary";

interface AnalyticsTabProps {
  userRole: "admin" | "geschaeftsfuehrer" | "member";
  quickStats: {
    todayHours: number;
    weekHours: number;
    monthHours: number;
  };
  recentActivities: any[];
  loading: boolean;
}

export default function AnalyticsTab({
  userRole,
  quickStats,
  recentActivities,
  loading,
}: AnalyticsTabProps) {
  const [lastTwoWeeksEntries, setLastTwoWeeksEntries] = useState<any[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [areaSuggestions, setAreaSuggestions] = useState<any[]>([]);
  const [isGeneratingAreaSuggestions, setIsGeneratingAreaSuggestions] =
    useState(false);

  const supabase = createClient();

  useEffect(() => {
    checkEnoughDataForAnalysis();
  }, []);

  const checkEnoughDataForAnalysis = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date 14 days ago
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
        .eq("status", "active")
        .order("date", { ascending: false });

      // Handle different user roles with proper data access
      if (userRole === "member") {
        // Members see only their own data
        query = query.eq("user_id", user.id);
      } else if (userRole === "admin") {
        // Admins see their team's data using the helper function
        const { data: teamMembers } = await supabase.rpc(
          "get_user_team_members",
          {
            user_uuid: user.id,
            org_id: null, // Will use user's primary org
          },
        );

        if (teamMembers && teamMembers.length > 0) {
          const memberIds = teamMembers.map((member: any) => member.member_id);
          memberIds.push(user.id); // Include manager's own entries
          query = query.in("user_id", memberIds);
        } else {
          // Manager with no team members, show only their own data
          query = query.eq("user_id", user.id);
        }
      }
      // Admin role will see all data (no additional filter)

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
        `Found ${formattedEntries.length} entries in the last 14 days for ${userRole}. Enough data: ${formattedEntries.length >= 5}`,
      );
    } catch (error) {
      console.error("Error checking data for analysis:", error);
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
        <AIWeeklySummary weekHours={quickStats.weekHours} loading={loading} />
      </div>

      {/* AI Monthly Summary - Full Width */}
      <div className="mt-6">
        <AIMonthlySummary
          monthHours={quickStats.monthHours}
          loading={loading}
        />
      </div>

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
                    <div
                      className="text-gray-700 mb-3 [&>p]:mb-2 [&>ul]:mb-2 [&>li]:mb-1 [&>strong]:font-semibold [&>em]:italic"
                      dangerouslySetInnerHTML={{
                        __html: suggestion.description,
                      }}
                    />
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
                  Analysiert Ihre Zeiteinträge und gibt Empfehlungen zur
                  KI-Optimierung
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
                    Analysiert Ihre Zeiteinträge bereichsweise und gibt
                    spezifische Make.com Workflow- und ChatGPT-Empfehlungen
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
                      {lastTwoWeeksEntries.length} von 5 benötigten Einträgen
                      vorhanden
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
              Make.com Workflows und ChatGPT Prompts für Ihre Arbeitsbereiche
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
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed [&>h4]:text-blue-800 [&>h4]:font-semibold [&>h4]:mb-3 [&>h4]:mt-4 [&>h4]:first:mt-0 [&>p]:mb-3 [&>ul]:mb-3 [&>ul]:pl-4 [&>li]:mb-2 [&>li]:list-disc [&>strong]:font-semibold [&>strong]:text-blue-700 [&>em]:italic [&>em]:text-blue-600 [&>br]:block [&>br]:content-[''] [&>br]:h-4"
                    dangerouslySetInnerHTML={{
                      __html: areaSuggestion.suggestion,
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </Suspense>
  );
}
