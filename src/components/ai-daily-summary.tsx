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
      // Using explicit foreign key references to ensure correct joins
      const { data: todayEntries, error: todayError } = await supabase
        .from("time_entries")
        .select(
          `
          *,
          areas:area_id(name, color),
          fields:field_id(name),
          activities:activity_id(name)
        `,
        )
        .eq("user_id", user.id)
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (todayError) {
        console.error("Error loading today's entries:", todayError);
        throw todayError;
      }

      const dailyEntriesText = formatTimeEntriesForAI(todayEntries || []);

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-generate-summaries",
        {
          body: {
            dailyEntries: dailyEntriesText,
            summaryType: "daily",
          },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Edge function failed");
      }

      let dailySummary = (data.choices[0].message.content || "").trim();

      // Clean up any remaining markdown and labels, ensure proper HTML structure
      dailySummary = dailySummary
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(
          /^(tageszusammenfassung:|zusammenfassung:|tagesbericht:)\s*/gi,
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
      if (dailySummary && !dailySummary.startsWith("<")) {
        dailySummary = `<p>${dailySummary}</p>`;
      }

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
          const uniqueActivities = Array.from(new Set(activities));

          dailySummary = `<h4>Tagesübersicht</h4><p>Heute wurden insgesamt <strong>${totalHours.toFixed(1)} Stunden</strong> für ${uniqueActivities.length} verschiedene Aktivitäten aufgewendet.</p><h4>Hauptaktivitäten</h4><ul>${uniqueActivities
            .slice(0, 3)
            .map((activity) => `<li><em>${activity}</em></li>`)
            .join(
              "",
            )}</ul><p><strong>Status:</strong> <em>Produktiver Arbeitstag</em> mit fokussierter Zeiteinteilung.</p>`;
        } else {
          dailySummary =
            "<h4>Tagesübersicht</h4><p>Heute wurden noch keine Zeiteinträge erfasst.</p><p><em>Tipp:</em> Beginnen Sie mit der Erfassung Ihrer Arbeitszeit für bessere Produktivitätsanalysen.</p>";
        }
      }

      setSummary(dailySummary);
    } catch (err: any) {
      console.error("Error generating daily summary:", err);
      setError(`Fehler bei der Generierung: ${err.message}`);

      // Simple fallback without API call
      setSummary(
        "<h4>Fehler</h4><p>Die KI-Zusammenfassung konnte nicht generiert werden.</p><p><em>Bitte versuchen Sie es später erneut.</em></p>",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTimeEntriesForAI = (entries: any[]): string => {
    if (!entries || entries.length === 0) {
      return "Keine Zeiteinträge für heute vorhanden";
    }

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
            className="text-purple-900 font-normal prose prose-sm max-w-none [&>h4]:text-purple-800 [&>h4]:font-semibold [&>h4]:mb-2 [&>h4]:mt-3 [&>h4]:first:mt-0 [&>p]:mb-2 [&>ul]:mb-2 [&>li]:mb-0 [&>strong]:font-semibold [&>em]:italic [&>em]:text-purple-700"
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
