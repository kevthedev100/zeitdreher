"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, RefreshCw } from "lucide-react";
import { createClient } from "../../supabase/client";

interface AIDailySummaryProps {
  timeEntries: any[];
  loading: boolean;
  todayHours: number;
}

export default function AIDailySummary({
  timeEntries,
  loading,
  todayHours,
}: AIDailySummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Generate summary when time entries change
  useEffect(() => {
    if (!loading) {
      generateSummary();
    }
  }, [timeEntries, loading, todayHours]);

  // Listen for time entry updates
  useEffect(() => {
    const handleTimeEntryAdded = () => {
      generateSummary();
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

  const generateSummary = async () => {
    if (loading) {
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Load today's entries directly from database with full relations
      const today = new Date().toISOString().split("T")[0];
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get today's entries with full data including descriptions
      const { data: todayEntries, error: todayError } = await supabase
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
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (todayError) {
        console.error("Error loading today's entries:", todayError);
        throw todayError;
      }

      console.log("Today's entries loaded:", todayEntries);

      // Format entries for AI analysis
      const dailyEntriesText = formatTimeEntriesForAI(todayEntries || []);

      // Get basic weekly data for the API call requirement
      const weeklyEntriesText = `Diese Woche: ${todayHours.toFixed(1)} Stunden erfasst`;

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

      // Extract only the daily summary from the response
      let fullResponse = data.choices[0].message.content;
      let dailySummary = "";

      // Split by separator to get only the daily part
      if (fullResponse.includes("---SUMMARY_SEPARATOR---")) {
        dailySummary = fullResponse.split("---SUMMARY_SEPARATOR---")[0].trim();
      } else {
        // Fallback: use the entire response as daily summary
        dailySummary = fullResponse.trim();
      }

      // Clean up any remaining markdown and labels
      dailySummary = dailySummary
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /^(tageszusammenfassung:|zusammenfassung:|tagesbericht:)\s*/gi,
          "",
        )
        .replace(/^#{1,6}\s*/, "")
        .trim();

      // If no meaningful content, provide a simple message
      if (dailySummary.length < 20 || dailySummary.includes("Keine Einträge")) {
        if (todayEntries && todayEntries.length > 0) {
          const totalHours = todayEntries.reduce(
            (sum, entry) => sum + entry.duration,
            0,
          );
          const activities = todayEntries.map(
            (entry) => entry.activities?.name || "Unbekannte Aktivität",
          );
          const uniqueActivities = [...new Set(activities)];

          dailySummary = `<p>Heute wurden insgesamt <strong>${totalHours.toFixed(1)} Stunden</strong> für ${uniqueActivities.length} verschiedene Aktivitäten aufgewendet. Die Hauptaktivitäten umfassten <strong>${uniqueActivities.slice(0, 3).join(", ")}</strong>.</p>`;
        } else {
          dailySummary = "<p>Heute wurden noch keine Zeiteinträge erfasst.</p>";
        }
      }

      setSummary(dailySummary);
    } catch (err: any) {
      console.error("Error generating daily summary:", err);
      setError(`Fehler bei der Generierung: ${err.message}`);

      // Simple fallback without API call
      setSummary(
        "<p>Die KI-Zusammenfassung konnte nicht generiert werden. Bitte versuchen Sie es später erneut.</p>",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTimeEntriesForAI = (entries: any[]): string => {
    if (!entries || entries.length === 0) {
      return "Keine Zeiteinträge für heute vorhanden";
    }

    console.log("Formatting entries for AI:", entries);

    return entries
      .map((entry) => {
        const area = entry.areas?.name || "Unbekannter Bereich";
        const activity = entry.activities?.name || "Unbekannte Aktivität";
        const field = entry.fields?.name || "Unbekanntes Feld";
        const description =
          entry.description || "Keine detaillierte Beschreibung verfügbar";
        const duration = entry.duration?.toFixed(1) || "0.0";
        const startTime = entry.start_time ? ` (${entry.start_time})` : "";

        return `${area} > ${field} > ${activity} (${duration}h${startTime}) - ${description}`;
      })
      .join("\n");
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Bot className="w-5 h-5 text-purple-600" />
        KI-Tageszusammenfassung
      </h3>

      {loading || isGenerating ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="flex items-center gap-2 mt-4 text-purple-500">
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
        <div className="p-4 bg-purple-50 rounded-lg">
          <div
            className="text-purple-900 font-normal prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Keine Daten für die Zusammenfassung verfügbar</p>
        </div>
      )}
    </div>
  );
}
