import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { dailyEntries, weeklyEntries, analysisType } = await req.json();

    // Debug logging
    console.log("=== GENERATE SUMMARIES DEBUG ===");
    console.log("Daily Entries:", dailyEntries);
    console.log("Weekly Entries:", weeklyEntries);

    if (!dailyEntries && !weeklyEntries) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid request: at least dailyEntries or weeklyEntries is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Determine if this is a regular summary or an optimization analysis
    const isOptimizationAnalysis = analysisType === "optimization";

    // Construct messages for OpenAI API
    const messages = isOptimizationAnalysis
      ? [
          {
            role: "system",
            content:
              "Du bist ein intelligenter KI-Assistent, der Zeiterfassungsdaten analysiert und strukturierte Optimierungsvorschläge erstellt. Antworte auf Deutsch in professionellem Ton. Verwende ausschließlich HTML-Formatierung: <h4> für Überschriften, <ul><li> für Bullet Points, <strong> für wichtige Begriffe, <em> für Schwerpunkte, <p> für Absätze. NIEMALS Markdown verwenden! Erstelle klare, strukturierte Berichte mit Bullet Points und Subheadings.",
          },
          {
            role: "user",
            content: `Analysiere die folgenden Zeiteinträge der letzten zwei Wochen und erstelle einen strukturierten Optimierungsbericht:\n\n${weeklyEntries}\n\nErstelle einen Bericht mit folgender Struktur:\n\n<h4>🎯 Optimierungspotenzial</h4>\n<p>Kurze Einschätzung der wichtigsten Verbesserungsmöglichkeiten</p>\n\n<h4>⚡ Konkrete Optimierungsvorschläge</h4>\n<ul>\n<li><strong>Automatisierung:</strong> Spezifische Vorschläge mit Zeitersparnis</li>\n<li><strong>Workflow-Optimierung:</strong> Prozessverbesserungen mit Effizienzsteigerung</li>\n<li><strong>Fokus-Verbesserung:</strong> Konzentrations- und Produktivitätstipps</li>\n</ul>\n\n<h4>📊 Erwartete Ergebnisse</h4>\n<p>Quantifizierte Zeitersparnis und Produktivitätssteigerung mit <strong>konkreten Zahlen</strong></p>\n\nHalte jeden Punkt prägnant (max. 2 Sätze) und gib konkrete Zahlen an.",
          },
        ]
      : [
          {
            role: "system",
            content:
              "Du bist ein erfahrener Produktivitäts-Analyst, der strukturierte Zeitanalysen erstellt. Verwende ausschließlich HTML-Formatierung: <h4> für Überschriften, <ul><li> für Bullet Points, <strong> für wichtige Zahlen, <em> für Trends und Schwerpunkte, <p> für Absätze. NIEMALS Markdown verwenden! Erstelle klare, gut strukturierte Berichte mit Bullet Points und Subheadings. WICHTIG: Liste NIEMALS einzelne Zeiteinträge auf - analysiere Muster und fasse zusammen!",
          },
          {
            role: "user",
            content: `Analysiere diese Zeitdaten und erstelle zwei strukturierte Berichte mit Bullet Points und Subheadings. WICHTIG: Liste KEINE einzelnen Zeiteinträge auf!\n\nTAGESDATE:\n${dailyEntries || "Keine Einträge für heute"}\n\n---SUMMARY_SEPARATOR---\n\nWOCHENDATE:\n${weeklyEntries || "Keine wöchentlichen Einträge"}\n\nFür jeden Bericht verwende diese Struktur:\n\n<h4>📈 Produktivitätsübersicht</h4>\n<p>Kurze Analyse der Haupttätigkeiten und Gesamtstunden mit wichtigsten Erkenntnissen</p>\n\n<h4>🎯 Aktivitätsschwerpunkte</h4>\n<ul>\n<li><strong>Hauptbereich 1:</strong> Stundenzahl und Anteil</li>\n<li><strong>Hauptbereich 2:</strong> Stundenzahl und Anteil</li>\n<li><strong>Weitere Bereiche:</strong> Zusammenfassung</li>\n</ul>\n\n<h4>⚡ Effizienz-Highlights</h4>\n<ul>\n<li><em>Produktivitätsmuster:</em> Erkannte Trends und Zeiten</li>\n<li><em>Arbeitsverteilung:</em> Balance zwischen verschiedenen Aufgaben</li>\n<li><em>Besondere Erkenntnisse:</em> Auffälligkeiten oder Optimierungspotenzial</li>\n</ul>\n\n<h4>📊 Zahlen & Trends</h4>\n<p>Bewertung mit <strong>konkreten Zahlen</strong> und <em>identifizierten Trends</em></p>\n\nTrenne die beiden Berichte mit '---SUMMARY_SEPARATOR---'. Fasse zusammen, liste nicht auf!",
          },
        ];

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("OpenAI API key is missing from environment variables");
      throw new Error("OpenAI API key is not configured");
    }

    console.log("OpenAI API key available:", openaiApiKey ? "Yes" : "No");
    console.log("API key length:", openaiApiKey?.length);
    console.log("API key starts with sk-:", openaiApiKey?.startsWith("sk-"));

    // Call OpenAI Chat Completion API directly
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: isOptimizationAnalysis ? 800 : 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenAI API success response:", data);

    // Validate response structure before accessing nested properties
    if (
      !data.choices ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0
    ) {
      console.error(
        "OpenAI API response missing 'choices' array or it is empty:",
        data,
      );
      throw new Error(
        "OpenAI API response missing 'choices' array or it is empty.",
      );
    }

    if (!data.choices[0].message || !data.choices[0].message.content) {
      console.error(
        "OpenAI API response 'choices[0].message.content' is missing:",
        data.choices[0],
      );
      throw new Error(
        "OpenAI API response 'choices[0].message.content' is missing.",
      );
    }

    const summaryContent = data.choices[0].message.content;

    // Return the response in the exact format expected by the client components
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: summaryContent,
            },
          },
        ],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in generate-summaries function:", error);

    return new Response(
      JSON.stringify({
        error: "Summary generation failed",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});