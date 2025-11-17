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
    let messages;

    if (isOptimizationAnalysis) {
      const systemPrompt =
        "Du bist ein präziser Datenanalyst, der ausschließlich auf bereitgestellten Zeiterfassungsdaten basiert. KRITISCH: Verwende NUR die Informationen aus den bereitgestellten Zeiteinträgen. Erfinde NIEMALS zusätzliche Informationen, Aktivitäten oder Details, die nicht explizit in den Daten stehen. Wenn Informationen fehlen, sage explizit 'Keine Daten verfügbar'. Verwende ausschließlich HTML-Formatierung: <h4> für Überschriften, <ul><li> für Bullet Points, <strong> für wichtige Begriffe, <em> für Schwerpunkte, <p> für Absätze. NIEMALS Markdown verwenden!";

      const userPrompt = `Analysiere AUSSCHLIESSLICH die folgenden Zeiteinträge und erstelle einen strukturierten Bericht. WICHTIG: Verwende NUR die Informationen aus diesen Einträgen:

${weeklyEntries}

Erstelle einen Bericht basierend NUR auf den obigen Daten:

<h4>🎯 Optimierungspotenzial</h4>
<p>Kurze Einschätzung basierend NUR auf den bereitgestellten Zeiteinträgen</p>

<h4>⚡ Konkrete Optimierungsvorschläge</h4>
<ul>
<li><strong>Automatisierung:</strong> Nur basierend auf erkennbaren Mustern in den Daten</li>
<li><strong>Workflow-Optimierung:</strong> Nur basierend auf den tatsächlichen Aktivitäten</li>
<li><strong>Fokus-Verbesserung:</strong> Nur basierend auf der Zeitverteilung in den Daten</li>
</ul>

<h4>📊 Erwartete Ergebnisse</h4>
<p>Quantifizierte Analyse mit <strong>nur den tatsächlichen Zahlen aus den Einträgen</strong></p>

Verwende NUR Informationen aus den bereitgestellten Zeiteinträgen. Erfinde NICHTS hinzu!`;

      messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ];
    } else {
      const systemPrompt =
        "Du bist ein präziser Datenanalyst für Zeiterfassung. KRITISCH: Verwende ausschließlich die Informationen aus den bereitgestellten Zeiteinträgen. Erfinde NIEMALS zusätzliche Aktivitäten, Projekte oder Details, die nicht explizit in den Daten stehen. Wenn du unsicher bist oder Informationen fehlen, sage explizit 'Basierend auf den verfügbaren Daten' oder 'Keine weiteren Details verfügbar'. Verwende ausschließlich HTML-Formatierung: <h4> für Überschriften, <ul><li> für Bullet Points, <strong> für wichtige Zahlen, <em> für Trends, <p> für Absätze. NIEMALS Markdown verwenden! Analysiere nur Muster in den tatsächlichen Daten - erfinde keine zusätzlichen Erkenntnisse!";

      const userPrompt = `Analysiere diese Zeitdaten und erstelle zwei strukturierte Berichte. KRITISCH: Verwende NUR die Informationen aus den bereitgestellten Einträgen. Erfinde KEINE zusätzlichen Aktivitäten oder Details!

TAGESDATE:
${dailyEntries || "Keine Einträge für heute"}

---SUMMARY_SEPARATOR---

WOCHENDATE:
${weeklyEntries || "Keine wöchentlichen Einträge"}

Für jeden Bericht verwende diese Struktur und beziehe dich NUR auf die obigen Daten:

<h4>📈 Produktivitätsübersicht</h4>
<p>Analyse der tatsächlich erfassten Aktivitäten und Gesamtstunden aus den bereitgestellten Daten</p>

<h4>🎯 Aktivitätsschwerpunkte</h4>
<ul>
<li><strong>Bereich aus den Daten:</strong> Tatsächliche Stundenzahl und Anteil</li>
<li><strong>Weiterer Bereich aus den Daten:</strong> Tatsächliche Stundenzahl und Anteil</li>
<li><strong>Weitere Bereiche:</strong> Nur wenn in den Daten vorhanden</li>
</ul>

<h4>⚡ Effizienz-Highlights</h4>
<ul>
<li><em>Produktivitätsmuster:</em> Nur erkennbare Muster aus den tatsächlichen Daten</li>
<li><em>Arbeitsverteilung:</em> Nur basierend auf den erfassten Aktivitäten</li>
<li><em>Besondere Erkenntnisse:</em> Nur aus den bereitgestellten Zeiteinträgen</li>
</ul>

<h4>📊 Zahlen & Trends</h4>
<p>Bewertung mit <strong>nur den tatsächlichen Zahlen aus den Einträgen</strong> und <em>nur erkennbaren Trends aus den Daten</em></p>

WICHTIG: Trenne die beiden Berichte mit '---SUMMARY_SEPARATOR---'. Verwende NUR Informationen aus den bereitgestellten Zeiteinträgen!`;

      messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ];
    }

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
        temperature: 0.1, // Very low temperature to reduce hallucinations
        max_tokens: isOptimizationAnalysis ? 800 : 600,
        presence_penalty: 0.0, // No penalty for repetitions
        frequency_penalty: 0.0, // No penalty for frequent terms
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
