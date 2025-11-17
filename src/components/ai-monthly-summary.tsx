"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, RefreshCw, Calendar } from "lucide-react";
import { createClient } from "../../supabase/client";

interface AIMonthlySummaryProps {
  monthHours: number;
  loading: boolean;
}

export default function AIMonthlySummary({
  monthHours,
  loading,
}: AIMonthlySummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [monthlyEntries, setMonthlyEntries] = useState<any[]>([]);

  const supabase = createClient();

  // Load monthly entries when component mounts
  useEffect(() => {
    if (!loading) {
      loadMonthlyEntries();
    }
  }, [loading]);

  // Generate summary when monthly entries change
  useEffect(() => {
    generateSummary();
  }, [monthlyEntries]);

  // Listen for time entry updates
  useEffect(() => {
    const handleTimeEntryAdded = () => {
      loadMonthlyEntries();
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

  const loadMonthlyEntries = async () => {
    try {
      // Get last 30 days' start and end dates
      const now = new Date();
      const startOfMonth = new Date(now);
      startOfMonth.setDate(now.getDate() - 30); // 30 days ago
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(now);
      endOfMonth.setHours(23, 59, 59, 999);

      // Format dates for query
      const startDate = startOfMonth.toISOString().split("T")[0];
      const endDate = endOfMonth.toISOString().split("T")[0];

      console.log("Loading monthly entries from", startDate, "to", endDate);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found for monthly summary");
        return;
      }

      // Query time entries for the last 30 days
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
        console.error("Database error loading monthly entries:", error);
        throw error;
      }

      console.log("Raw monthly entries data:", data);

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

      console.log("Formatted monthly entries:", formattedEntries);
      setMonthlyEntries(formattedEntries);
    } catch (err) {
      console.error("Error loading monthly entries:", err);
      setError("Fehler beim Laden der monatlichen Einträge.");
      setMonthlyEntries([]); // Set empty array on error
    }
  };

  const generateSummary = async () => {
    console.log("Generating summary with entries:", monthlyEntries.length);

    if (monthlyEntries.length === 0) {
      console.log("No monthly entries found, setting empty message");
      setSummary(
        "<h4>Monatsübersicht</h4><p>In den letzten 30 Tagen wurden noch keine Zeiteinträge erfasst.</p><p><em>Tipp:</em> Beginnen Sie mit der Erfassung Ihrer Arbeitszeit für bessere Produktivitätsanalysen.</p>",
      );
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      console.log("Monthly entries for AI:", monthlyEntries);

      // Group entries by week for better AI context
      const entriesByWeek = monthlyEntries.reduce((acc: any, entry: any) => {
        const entryDate = new Date(entry.date);
        const weekStart = new Date(entryDate);
        const dayOfWeek = entryDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(entryDate.getDate() - daysToMonday);
        const weekKey = weekStart.toISOString().split("T")[0];

        if (!acc[weekKey]) acc[weekKey] = [];
        acc[weekKey].push(entry);
        return acc;
      }, {});

      // Format daily entries for the AI (we need this for the API call)
      const today = new Date().toISOString().split("T")[0];
      const dailyEntriesText =
        monthlyEntries.filter((entry) => entry.date === today).length > 0
          ? formatEntriesForDay(
              monthlyEntries.filter((entry) => entry.date === today),
              "Heute",
            )
          : "Keine Einträge für heute";

      // Format monthly entries for the AI with full descriptions
      const monthlyEntriesText = Object.keys(entriesByWeek)
        .sort() // Sort dates chronologically
        .map((weekStart) => {
          const weekEntries = entriesByWeek[weekStart];
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          return formatEntriesForWeek(
            weekEntries,
            `Woche ${formatDate(weekStart)} - ${formatDate(weekEnd.toISOString().split("T")[0])}`,
          );
        })
        .join("\n\n");

      console.log("Sending to AI:", { dailyEntriesText, monthlyEntriesText });

      // Call the generate-summaries edge function with monthly data
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate-summaries",
        {
          body: {
            dailyEntries: dailyEntriesText,
            weeklyEntries: monthlyEntriesText, // Use monthly data but keep the parameter name for compatibility
            summaryType: "monthly", // Add a flag to indicate this is a monthly summary
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Edge function failed");
      }

      console.log("AI Response:", data);

      // Extract the summary from the response
      let fullResponse = data.choices[0].message.content;
      let monthlySummary = "";

      // Split by separator to get the summary part
      if (fullResponse.includes("---SUMMARY_SEPARATOR---")) {
        monthlySummary =
          fullResponse.split("---SUMMARY_SEPARATOR---")[1]?.trim() || "";
      } else {
        // Fallback: use the entire response as monthly summary
        monthlySummary = fullResponse.trim();
      }

      // Clean up any remaining markdown and labels, ensure proper HTML structure
      monthlySummary = monthlySummary
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /^(monatszusammenfassung:|monatsübersicht:|monatsbericht:|zusammenfassung:|wochenbericht:)\s*/gi,
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
      if (monthlySummary && !monthlySummary.startsWith("<")) {
        monthlySummary = `<p>${monthlySummary}</p>`;
      }

      // If no meaningful content, provide a simple message
      if (
        monthlySummary.length < 20 ||
        monthlySummary.includes("Keine monatlichen Einträge")
      ) {
        const totalHours = monthlyEntries.reduce(
          (sum, entry) => sum + entry.duration,
          0,
        );
        const areas = [...new Set(monthlyEntries.map((entry) => entry.area))];
        const activities = [
          ...new Set(monthlyEntries.map((entry) => entry.activity)),
        ];

        monthlySummary = `<h4>Monatsübersicht (30 Tage)</h4><p>In den letzten 30 Tagen wurden insgesamt <strong>${totalHours.toFixed(1)} Stunden</strong> in ${areas.length} verschiedenen Bereichen und ${activities.length} Aktivitäten erfasst.</p><h4>Hauptbereiche</h4><ul>${areas
          .slice(0, 4)
          .map((area) => `<li><em>${area}</em></li>`)
          .join(
            "",
          )}</ul><p><strong>Monatsbilanz:</strong> <em>Kontinuierliche Arbeitserfassung</em> über verschiedene Projekte und Bereiche hinweg.</p>`;
      }

      setSummary(monthlySummary);
    } catch (err: any) {
      console.error("Error generating monthly summary:", err);
      setError(`Fehler bei der Generierung: ${err.message}`);

      // Simple fallback without API call
      setSummary(
        "<h4>Fehler</h4><p>Die KI-Monatsübersicht konnte nicht generiert werden.</p><p><em>Bitte versuchen Sie es später erneut.</em></p>",
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

  const formatEntriesForWeek = (entries: any[], weekLabel: string): string => {
    const totalHours = entries.reduce(
      (sum: number, entry: any) => sum + entry.duration,
      0,
    );

    let result = `${weekLabel} (${totalHours.toFixed(1)}h):\n`;

    // Group entries by day within the week
    const entriesByDay = entries.reduce((acc: any, entry: any) => {
      if (!acc[entry.date]) acc[entry.date] = [];
      acc[entry.date].push(entry);
      return acc;
    }, {});

    // Format each day's entries
    Object.keys(entriesByDay)
      .sort()
      .forEach((date) => {
        const dayEntries = entriesByDay[date];
        const dayTotal = dayEntries.reduce(
          (sum: number, entry: any) => sum + entry.duration,
          0,
        );
        result += `  ${formatDate(date)} (${dayTotal.toFixed(1)}h):\n`;

        dayEntries.forEach((entry: any) => {
          const area = entry.area || "Unbekannter Bereich";
          const field = entry.field || "Unbekanntes Feld";
          const activity = entry.activity || "Unbekannte Aktivität";
          const description =
            entry.description || "Keine detaillierte Beschreibung verfügbar";
          const duration = entry.duration?.toFixed(1) || "0.0";

          result += `    ${area} > ${field} > ${activity} (${duration}h) - ${description}\n`;
        });
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
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-purple-600" />
        KI-Monatsübersicht
      </h3>

      {loading || isGenerating ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="flex items-center gap-2 mt-4 text-purple-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generiere Monatsübersicht...</span>
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
        <div className="p-4 bg-purple-50 rounded-lg">
          <div
            className="text-purple-900 font-normal prose prose-sm max-w-none [&>h4]:text-purple-800 [&>h4]:font-semibold [&>h4]:mb-2 [&>h4]:mt-3 [&>h4]:first:mt-0 [&>p]:mb-2 [&>ul]:mb-2 [&>li]:mb-0 [&>strong]:font-semibold [&>em]:italic [&>em]:text-purple-700"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Keine Daten für die Monatsübersicht verfügbar</p>
        </div>
      )}
    </div>
  );
}
