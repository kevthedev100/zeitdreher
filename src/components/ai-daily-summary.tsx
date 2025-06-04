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
    // Continue even if there are no entries, to show a message about no entries for today
    if (loading) {
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Format daily entries for the AI
      const today = new Date().toISOString().split("T")[0];
      const dailyEntriesText = formatTimeEntriesForAI(
        timeEntries.filter((entry) => entry.date === today),
      );

      // We need some data for the weekly summary too, even though this component only shows daily
      const weeklyEntriesText =
        "Diese Woche: " + todayHours.toFixed(1) + " Stunden";

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

      if (error) throw new Error(error.message);

      // Extract the daily summary from the response
      const fullText = data.choices[0].message.content;
      // Normalize markdown formatting with asterisks (replace multiple asterisks with proper markdown)
      const cleanedText = fullText
        .replace(/\*{3,}/g, "**")
        .replace(/\*\*\s*\*\*/g, "**");
      const dailySummary = cleanedText.split("\n\n")[0]; // Get first paragraph (daily summary)

      setSummary(dailySummary || "Keine Zusammenfassung verfügbar.");
    } catch (err: any) {
      console.error("Error generating daily summary:", err);
      setError("Fehler bei der Generierung der Zusammenfassung.");

      // Use a fallback summary if the API call fails
      if (timeEntries.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const todayEntries = timeEntries.filter(
          (entry) => entry.date === today,
        );

        if (todayEntries.length > 0) {
          const totalHours = todayEntries.reduce(
            (sum, entry) => sum + entry.duration,
            0,
          );
          const activities = todayEntries
            .map((entry) => entry.activity)
            .join(", ");

          const fallbackSummary = `Heute wurden insgesamt ${totalHours.toFixed(1)} Stunden für folgende Aktivitäten aufgewendet: ${activities}. Die Produktivität liegt im normalen Bereich.`;
          setSummary(fallbackSummary);
        } else {
          setSummary("Heute wurden noch keine Zeiteinträge erfasst.");
        }
      } else {
        setSummary("Keine Zeiteinträge für heute verfügbar.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTimeEntriesForAI = (entries: any[]): string => {
    if (entries.length === 0) return "Keine Einträge";

    return entries
      .map((entry) => {
        return `- ${entry.activity || "Unbekannte Aktivität"} (${entry.duration.toFixed(1)}h)`;
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
          <p className="text-purple-900 whitespace-pre-line font-normal">
            {summary
              .split(/\*\*([^*]+)\*\*/)
              .map((part, i) =>
                i % 2 === 0 ? part : <strong key={i}>{part}</strong>,
              )}
          </p>
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
