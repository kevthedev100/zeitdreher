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
    generateSummary();
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
      // Fix: Handle Sunday (0) correctly - if Sunday, go back 6 days to Monday
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(now.getDate() - daysToMonday); // Monday
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
      if (!user) {
        return;
      }

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

      if (error) {
        console.error("Database error loading weekly entries:", error);
        throw error;
      }

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
      setWeeklyEntries([]); // Set empty array on error
    }
  };

  const generateSummary = async () => {
    if (weeklyEntries.length === 0) {
      setSummary(
        "<h4>Wochenübersicht</h4><p>Diese Woche wurden noch keine Zeiteinträge erfasst.</p><p><em>Tipp:</em> Beginnen Sie mit der Erfassung Ihrer Arbeitszeit für bessere Produktivitätsanalysen.</p>",
      );
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Group entries by day for better AI context
      const entriesByDay = weeklyEntries.reduce((acc: any, entry: any) => {
        if (!acc[entry.date]) acc[entry.date] = [];
        acc[entry.date].push(entry);
        return acc;
      }, {});

      const weeklyEntriesText = Object.keys(entriesByDay)
        .sort()
        .map((date) =>
          formatEntriesForDay(entriesByDay[date], formatDate(date)),
        )
        .join("\n\n");

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate-summaries",
        {
          body: {
            weeklyEntries: weeklyEntriesText,
            summaryType: "weekly",
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Edge function failed");
      }

      let weeklySummary = (data.choices[0].message.content || "").trim();

      // Clean up any remaining markdown and labels, ensure proper HTML structure
      weeklySummary = weeklySummary
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /^(wochenzusammenfassung:|zusammenfassung:|wochenbericht:)\s*/gi,
          "",
        )
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/<br\s*\/?>/gi, "") // Remove all <br> tags
        .replace(/\n\s*\n+/g, "") // Remove multiple newlines
        .replace(/\n/g, "") // Remove single newlines
        .replace(/(<\/p>)\s*(<h4>)/g, "$1$2") // Remove spaces between </p> and <h4>
        .replace(/(<\/ul>)\s*(<h4>)/g, "$1$2") // Remove spaces between </ul> and <h4>
        .replace(/(<\/h4>)\s*(<p>)/g, "$1$2") // Remove spaces between </h4> and <p>
        .replace(/(<\/h4>)\s*(<ul>)/g, "$1$2") // Remove spaces between </h4> and <ul>
        .trim();

      // Ensure proper paragraph structure if not already present
      if (weeklySummary && !weeklySummary.startsWith("<")) {
        weeklySummary = `<p>${weeklySummary}</p>`;
      }

      // If no meaningful content, provide a simple message
      if (
        weeklySummary.length < 20 ||
        weeklySummary.includes("Keine wöchentlichen Einträge")
      ) {
        const totalHours = weeklyEntries.reduce(
          (sum, entry) => sum + entry.duration,
          0,
        );
        const areas = Array.from(new Set(weeklyEntries.map((entry) => entry.area)));

        weeklySummary = `<h4>Wochenübersicht</h4><p>Diese Woche wurden insgesamt <strong>${totalHours.toFixed(1)} Stunden</strong> in ${areas.length} verschiedenen Bereichen erfasst.</p><h4>Hauptbereiche</h4><ul>${areas
          .slice(0, 3)
          .map((area) => `<li><em>${area}</em></li>`)
          .join(
            "",
          )}</ul><p><strong>Wochenbilanz:</strong> <em>Ausgewogene Arbeitsverteilung</em> über verschiedene Projekte und Bereiche.</p>`;
      }

      setSummary(weeklySummary);
    } catch (err: any) {
      console.error("Error generating weekly summary:", err);
      setError(`Fehler bei der Generierung: ${err.message}`);

      // Simple fallback without API call
      setSummary(
        "<h4>Fehler</h4><p>Die KI-Wochenzusammenfassung konnte nicht generiert werden.</p><p><em>Bitte versuchen Sie es später erneut.</em></p>",
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
            className="text-blue-900 font-normal prose prose-sm max-w-none [&>h4]:text-blue-800 [&>h4]:font-semibold [&>h4]:mb-2 [&>h4]:mt-3 [&>h4]:first:mt-0 [&>p]:mb-2 [&>ul]:mb-2 [&>li]:mb-0 [&>strong]:font-semibold [&>em]:italic [&>em]:text-blue-700"
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
