"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, RefreshCw, Calendar } from "lucide-react";
import { createClient } from "../../supabase/client";

interface AIWeeklySummaryProps {
  weekHours: number;
  loading: boolean;
}

export default function AIWeeklySummary({
  weekHours,
  loading,
}: AIWeeklySummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyEntries, setWeeklyEntries] = useState<any[]>([]);

  const supabase = createClient();

  // Load weekly entries when component mounts
  useEffect(() => {
    if (!loading) {
      loadWeeklyEntries();
    }
  }, [loading]);

  // Generate summary when weekly entries change
  useEffect(() => {
    if (weeklyEntries.length > 0) {
      generateSummary();
    }
  }, [weeklyEntries]);

  // Listen for time entry updates
  useEffect(() => {
    const handleTimeEntryAdded = () => {
      loadWeeklyEntries();
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

  const loadWeeklyEntries = async () => {
    try {
      // Get current week's start and end dates
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      endOfWeek.setHours(23, 59, 59, 999);

      // Format dates for query
      const startDate = startOfWeek.toISOString().split("T")[0];
      const endDate = endOfWeek.toISOString().split("T")[0];

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Query time entries for this week
      const { data, error } = await supabase
        .from("time_entries")
        .select(
          `
          *,
          areas(name, color),
          fields(name),
          activities(name)
        `,
        )
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;

      // Format entries for display with descriptions
      const formattedEntries =
        data?.map((entry) => ({
          activity: entry.activities?.name || "Unbekannte Aktivität",
          area: entry.areas?.name || "Unbekannter Bereich",
          field: entry.fields?.name || "Unbekanntes Feld",
          duration: entry.duration,
          date: entry.date,
          description: entry.description || "Keine Beschreibung",
        })) || [];

      setWeeklyEntries(formattedEntries);
    } catch (err) {
      console.error("Error loading weekly entries:", err);
      setError("Fehler beim Laden der wöchentlichen Einträge.");
    }
  };

  const generateSummary = async () => {
    if (weeklyEntries.length === 0) {
      setSummary("<p>Keine Zeiteinträge für diese Woche verfügbar.</p>");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      console.log("Weekly entries for AI:", weeklyEntries);

      // Group entries by day for better AI context
      const entriesByDay = weeklyEntries.reduce((acc: any, entry: any) => {
        if (!acc[entry.date]) acc[entry.date] = [];
        acc[entry.date].push(entry);
        return acc;
      }, {});

      // Format daily entries for the AI (we need this for the API call)
      const today = new Date().toISOString().split("T")[0];
      const dailyEntriesText = entriesByDay[today]
        ? formatEntriesForDay(entriesByDay[today], "Heute")
        : "Keine Einträge für heute";

      // Format weekly entries for the AI with full descriptions
      const weeklyEntriesText = Object.keys(entriesByDay)
        .sort() // Sort dates chronologically
        .map((date) =>
          formatEntriesForDay(entriesByDay[date], formatDate(date)),
        )
        .join("\n\n");

      console.log("Sending to AI:", { dailyEntriesText, weeklyEntriesText });

      // Call the generate-summaries edge function
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate-summaries",
        {
          body: {
            dailyEntries: dailyEntriesText,
            weeklyEntries: weeklyEntriesText,
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Edge function failed");
      }

      console.log("AI Response:", data);

      // Extract only the weekly summary from the response
      let fullResponse = data.choices[0].message.content;
      let weeklySummary = "";

      // Split by separator to get only the weekly part
      if (fullResponse.includes("---SUMMARY_SEPARATOR---")) {
        weeklySummary =
          fullResponse.split("---SUMMARY_SEPARATOR---")[1]?.trim() || "";
      } else {
        // Fallback: use the entire response as weekly summary
        weeklySummary = fullResponse.trim();
      }

      // Clean up any remaining markdown and labels
      weeklySummary = weeklySummary
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /^(wochenzusammenfassung:|zusammenfassung:|wochenbericht:)\s*/gi,
          "",
        )
        .replace(/^#{1,6}\s*/, "")
        .trim();

      // If no meaningful content, provide a simple message
      if (
        weeklySummary.length < 20 ||
        weeklySummary.includes("Keine wöchentlichen Einträge")
      ) {
        const totalHours = weeklyEntries.reduce(
          (sum, entry) => sum + entry.duration,
          0,
        );
        const areas = [...new Set(weeklyEntries.map((entry) => entry.area))];

        weeklySummary = `<p>Diese Woche wurden insgesamt <strong>${totalHours.toFixed(1)} Stunden</strong> in ${areas.length} verschiedenen Bereichen erfasst. Die Arbeit verteilte sich hauptsächlich auf <strong>${areas.slice(0, 3).join(", ")}</strong>.</p>`;
      }

      setSummary(weeklySummary);
    } catch (err: any) {
      console.error("Error generating weekly summary:", err);
      setError(`Fehler bei der Generierung: ${err.message}`);

      // Simple fallback without API call
      setSummary(
        "<p>Die KI-Wochenzusammenfassung konnte nicht generiert werden. Bitte versuchen Sie es später erneut.</p>",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const formatEntriesForDay = (entries: any[], dayLabel: string): string => {
    const totalHours = entries.reduce(
      (sum: number, entry: any) => sum + entry.duration,
      0,
    );

    let result = `${dayLabel} (${totalHours.toFixed(1)}h):\n`;

    // Format each entry with full context
    entries.forEach((entry: any) => {
      const area = entry.area || "Unbekannter Bereich";
      const field = entry.field || "Unbekanntes Feld";
      const activity = entry.activity || "Unbekannte Aktivität";
      const description =
        entry.description || "Keine detaillierte Beschreibung verfügbar";
      const duration = entry.duration?.toFixed(1) || "0.0";

      result += `${area} > ${field} > ${activity} (${duration}h) - ${description}\n`;
    });

    return result;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Heute";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Gestern";
    } else {
      return date.toLocaleDateString("de-DE", { weekday: "long" });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        KI-Wochenzusammenfassung
      </h3>

      {loading || isGenerating ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="flex items-center gap-2 mt-4 text-blue-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generiere Zusammenfassung...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 rounded-lg text-red-700">
          <p>{error}</p>
          <button onClick={generateSummary} className="text-sm underline mt-2">
            Erneut versuchen
          </button>
        </div>
      ) : summary ? (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div
            className="text-blue-900 font-normal prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Keine Daten für die Zusammenfassung verfügbar</p>
        </div>
      )}
    </div>
  );
}
