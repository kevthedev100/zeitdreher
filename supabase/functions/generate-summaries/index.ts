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
            role: "user",
            content: `Du bist ein intelligenter Assistent, der Zeiterfassungsdaten analysiert und Optimierungsvorschläge gibt. Antworte auf Deutsch und in einem professionellen Ton. Verwende ausschließlich HTML-Formatierung für Hervorhebungen: <strong> für wichtige Begriffe, <ul> und <li> für Aufzählungen. Verwende NIEMALS Markdown-Sternchen (**) oder andere Markdown-Formatierung. Beginne NIEMALS mit \`\`\`html oder anderen Code-Blöcken. Analysiere die folgenden Zeiteinträge der letzten zwei Wochen und gib 3-4 konkrete, kurze KI-Optimierungsvorschläge:\n\n${weeklyEntries}\n\nFür jeden Vorschlag gib einen Titel, eine prägnante Beschreibung (max. 2 Sätze) und eine quantifizierte potenzielle Zeitersparnis oder Produktivitätssteigerung in Stunden oder Prozent an. Beispiel: "Potenzielle Zeitersparnis: 2-3 Stunden pro Woche" oder "Produktivitätssteigerung: 15-20%". Halte die Antwort kurz und prägnant.`,
          },
        ]
      : [
          {
            role: "user",
            content: `Du bist ein professioneller Projektmanager, der strukturierte Tages- und Wochenberichte in deutscher Sprache erstellt. Verwende ausschließlich HTML-Formatierung für eine professionelle Darstellung. Beginne NIEMALS mit \`\`\`html oder anderen Code-Blöcken.\n\nWICHTIGE FORMATIERUNGSREGELN:\n- Verwende KEINE <br /> Tags\n- Verwende KEINE doppelten Leerzeilen\n- Jeder <p> Tag sollte direkt aufeinander folgen\n- <h4> Tags sollten direkt nach </p> oder </ul> folgen\n- Listen sollten kompakt sein ohne zusätzliche Abstände\n\nFormatierungsrichtlinien:\n- <h4> für Überschriften und Kategorien\n- <strong> für wichtige Zahlen, Stunden und Schlüsselbegriffe\n- <em> für Fokuspunkte und Prioritäten\n- <p> für Absätze mit klarer Struktur (KEINE <br /> innerhalb)\n- <ul> und <li> für kompakte Aufzählungen\n- Trenne Tages- und Wochenbericht mit '---SUMMARY_SEPARATOR---'\n\nErstelle zwei strukturierte Arbeitsberichte basierend auf diesen Zeiterfassungsdaten:\n\nTAGESBERICHT (analysiere nur diese Daten):\n${dailyEntries || "Keine Einträge für heute"}\n\n---SUMMARY_SEPARATOR---\n\nWOCHENBERICHT (analysiere nur diese Daten):\n${weeklyEntries || "Keine wöchentlichen Einträge"}\n\nStruktur für jeden Bericht (KOMPAKT ohne Leerzeilen):\n1. <h4>Übersicht</h4><p>Gesamtstunden in <strong>X.X Stunden</strong></p>\n2. <h4>Hauptaktivitäten</h4><ul><li>Aktivität 1</li><li>Aktivität 2</li></ul>\n3. <p>Zusammenfassung mit <em>Fokuspunkten</em> und <strong>wichtigen Zahlen</strong></p>\n\nHalte jeden Bericht prägnant und kompakt strukturiert wie ChatGPT.`,
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
        Authorization: `Bearer ${openaiApiKey}`,
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
