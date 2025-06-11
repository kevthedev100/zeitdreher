import { corsHeaders } from "@shared/cors.ts";

interface TimeEntry {
  area: string;
  duration: number;
  task: string;
  field?: string;
  description?: string;
  activity?: string;
}

interface RequestBody {
  entries?: TimeEntry[];
  timeEntries?: TimeEntry[];
}

interface GroupedEntries {
  [area: string]: TimeEntry[];
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting generate-area-optimization-suggestions function");

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          details: parseError.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Handle both entries and timeEntries fields for backward compatibility
    const entries = requestBody.entries || requestBody.timeEntries;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      console.error("Invalid entries array in request", { entries: entries });
      return new Response(
        JSON.stringify({
          error:
            "Invalid request: entries array is required and must not be empty",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`Processing ${entries.length} time entries`);

    // Group entries by area
    const groupedEntries: GroupedEntries = {};
    for (const entry of entries) {
      const area = entry.area || "Unbekannt";
      if (!groupedEntries[area]) {
        groupedEntries[area] = [];
      }
      groupedEntries[area].push(entry);
    }

    console.log(
      `Grouped entries into ${Object.keys(groupedEntries).length} areas`,
    );

    const suggestions = [];

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error(
        "Missing OpenAI API key - environment variable OPENAI_API_KEY is not set",
      );
      return new Response(
        JSON.stringify({
          error: "Optimization suggestions generation failed",
          details: "OpenAI API key is not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("OpenAI API key found, proceeding with analysis");

    // Process each area
    for (const [area, areaEntries] of Object.entries(groupedEntries)) {
      console.log(
        `Processing area: ${area} with ${areaEntries.length} entries`,
      );

      const entriesText = areaEntries
        .map((entry) => {
          const task = entry.task || entry.activity || "Unbekannt";
          const field = entry.field || "Unbekannt";
          return `- ${task} (${field}) - ${entry.duration || 0}h - ${entry.description || "Keine Beschreibung"}`;
        })
        .join("\n");

      // Prepare prompt content in German
      const promptContent = `Analysiere die folgenden Zeiteinträge für den Bereich "${area}" und erstelle Workflow-Optimierungsvorschläge:\n${entriesText}\n\nSchlage konkrete Möglichkeiten vor, wie diese Aufgaben durch Make.com Workflows oder ChatGPT Prompts vereinfacht oder automatisiert werden könnten. Gib umsetzbare Optimierungsvorschläge in deutscher Sprache. Verwende eine klare Struktur mit Absätzen und hebe wichtige Punkte hervor.`;

      try {
        console.log(`Calling OpenAI API for area: ${area}`);

        // Prepare request payload
        const openAiPayload = {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Du bist ein Assistent, der Workflow-Optimierungsvorschläge basierend auf Zeiteinträgen erstellt. Antworte immer auf Deutsch mit einer klaren Struktur. Verwende keine Markdown-Formatierungen wie ### oder ** in deiner Antwort. Hebe wichtige Punkte und Überschriften durch klare Absätze und Struktur hervor.",
            },
            {
              role: "user",
              content: promptContent,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        };

        console.log(
          "OpenAI API request payload prepared:",
          JSON.stringify(openAiPayload).substring(0, 200) + "...",
        );

        // Call OpenAI API directly
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify(openAiPayload),
          },
        );

        console.log(`OpenAI API response status: ${response.status}`);

        if (!response.ok) {
          let errorDetails = "Unknown error";
          try {
            const errorJson = await response.json();
            errorDetails = JSON.stringify(errorJson);
            console.error(`OpenAI API error response: ${errorDetails}`);
          } catch (e) {
            const errorText = await response.text();
            errorDetails = errorText || "No error details available";
            console.error(`OpenAI API error text: ${errorDetails}`);
          }

          throw new Error(
            `OpenAI API error: ${response.status} - ${errorDetails}`,
          );
        }

        const data = await response.json();
        console.log(
          `OpenAI API response received successfully for area: ${area}`,
        );

        // Process the response to clean up any remaining special characters
        let suggestionText =
          data.choices?.[0]?.message?.content || "Keine Vorschläge verfügbar.";

        // Remove any markdown formatting characters that might remain
        suggestionText = suggestionText
          .replace(/###/g, "")
          .replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .replace(/```/g, "");

        // Ensure proper paragraph formatting
        suggestionText = suggestionText.trim();

        suggestions.push({
          area,
          suggestion: suggestionText,
          entriesCount: areaEntries.length,
          totalHours: areaEntries.reduce(
            (sum, entry) => sum + (entry.duration || 0),
            0,
          ),
        });

        console.log(`Successfully processed area: ${area}`);
      } catch (error) {
        console.error(`Error generating suggestion for area ${area}:`, error);
        // Add fallback suggestion for this area
        suggestions.push({
          area,
          suggestion: `Für den Bereich "${area}" könnten folgende Optimierungen hilfreich sein:\n\n• Make.com Workflow: Automatisierung wiederkehrender Aufgaben durch Verbindung verschiedener Tools\n• ChatGPT Prompts: Erstellung von Vorlagen für häufige Dokumentations- oder Kommunikationsaufgaben\n• Zeiterfassung: Automatische Kategorisierung ähnlicher Aktivitäten`,
          entriesCount: areaEntries.length,
          totalHours: areaEntries.reduce(
            (sum, entry) => sum + (entry.duration || 0),
            0,
          ),
          error: error.message,
        });
      }
    }

    console.log(
      `Completed processing all areas, returning ${suggestions.length} suggestions`,
    );

    return new Response(
      JSON.stringify({
        suggestions,
        totalAreas: Object.keys(groupedEntries).length,
        totalEntries: entries.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Error in generate-area-optimization-suggestions function:",
      error,
    );

    return new Response(
      JSON.stringify({
        error: "Optimization suggestions generation failed",
        details: error.message || "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
