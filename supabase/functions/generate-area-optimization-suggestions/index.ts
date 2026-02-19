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

      // Prepare prompt content in German with HTML formatting instructions
      const promptContent = `Analysiere die folgenden Zeiteinträge für den Bereich "${area}" und erstelle strukturierte Workflow-Optimierungsvorschläge:\n\n${entriesText}\n\nWICHTIGE FORMATIERUNGSREGELN:\n- Verwende KEINE <br /> Tags\n- Verwende KEINE doppelten Leerzeilen\n- Jeder <p> Tag sollte direkt aufeinander folgen\n- <h4> Tags sollten direkt nach </p> oder </ul> folgen\n- Listen sollten kompakt sein ohne zusätzliche Abstände\n\nErstelle eine professionell formatierte Antwort mit folgender kompakter HTML-Struktur:\n\n<h4>Optimierungspotenzial</h4><p>Kurze Einschätzung der Automatisierungsmöglichkeiten</p><h4>Make.com Workflows</h4><ul><li><strong>Workflow 1:</strong> Konkrete Beschreibung</li><li><strong>Workflow 2:</strong> Konkrete Beschreibung</li></ul><h4>ChatGPT Prompts</h4><ul><li><em>Prompt-Kategorie:</em> Spezifische Anwendung</li><li><em>Prompt-Kategorie:</em> Spezifische Anwendung</li></ul><p><strong>Geschätzte Zeitersparnis:</strong> X Stunden pro Woche durch <em>Automatisierung der Kernprozesse</em></p>\n\nVerwende ausschließlich HTML-Tags, keine Markdown-Formatierung. Halte die Struktur kompakt wie ChatGPT.`;

      try {
        console.log(`Calling OpenAI API for area: ${area}`);

        // Prepare request payload
        const openAiPayload = {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Du bist ein Workflow-Optimierungsexperte, der strukturierte Vorschläge basierend auf Zeiteinträgen erstellt. Antworte immer auf Deutsch mit professioneller HTML-Formatierung. Verwende NIEMALS Markdown-Formatierungen wie ### oder **. Nutze ausschließlich HTML-Tags für die Strukturierung: <h4> für Überschriften, <strong> für wichtige Begriffe, <em> für Fokuspunkte, <ul>/<li> für Aufzählungen, <p> für Absätze.",
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

        // Clean up any remaining markdown formatting and ensure proper HTML structure
        suggestionText = suggestionText
          .replace(/###/g, "")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/```/g, "")
          .replace(/^#{1,6}\s*/gm, "")
          .trim();

        // Ensure proper HTML structure if not already present
        if (
          !suggestionText.includes("<h4>") &&
          !suggestionText.includes("<p>")
        ) {
          suggestionText = `<p>${suggestionText.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
        }

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
          suggestion: `<h4>Optimierungspotenzial für ${area}</h4><p>Basierend auf den verfügbaren Daten könnten folgende Optimierungen hilfreich sein:</p><h4>Make.com Workflows</h4><ul><li><strong>Automatisierung:</strong> Wiederkehrende Aufgaben durch Verbindung verschiedener Tools</li><li><strong>Integration:</strong> Nahtlose Datenübertragung zwischen Systemen</li></ul><h4>ChatGPT Prompts</h4><ul><li><em>Dokumentation:</em> Vorlagen für häufige Berichtsformate</li><li><em>Kommunikation:</em> Standardisierte Antworten und Texte</li></ul><p><strong>Empfehlung:</strong> <em>Detailliertere Zeiteinträge erfassen</em> für spezifischere Optimierungsvorschläge</p>`,
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
