import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { dailyEntries, weeklyEntries, analysisType } = await req.json();

    if (!dailyEntries || !weeklyEntries) {
      return new Response(
        JSON.stringify({
          error: "Invalid request: dailyEntries and weeklyEntries are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Determine if this is a regular summary or an optimization analysis
    const isOptimizationAnalysis = analysisType === "optimization";

    // Call OpenAI Chat Completion API via Pica Passthrough
    const response = await fetch(
      "https://api.picaos.com/v1/passthrough/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "x-pica-secret": Deno.env.get("PICA_SECRET_KEY")!,
          "x-pica-connection-key": Deno.env.get("PICA_OPENAI_CONNECTION_KEY")!,
          "x-pica-action-id":
            "conn_mod_def::GDzgi1QfvM4::4OjsWvZhRxmAVuLAuWgfVA",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-2024-08-06",
          messages: isOptimizationAnalysis
            ? [
                {
                  role: "system",
                  content:
                    "Du bist ein intelligenter Assistent, der Zeiterfassungsdaten analysiert und Optimierungsvorschläge gibt. Antworte auf Deutsch und in einem professionellen Ton. Wichtig: Verwende für Hervorhebungen und wichtige Begriffe Markdown-Formatierung mit genau zwei Sternchen für fett (**fett**), aber vermeide übermäßige oder mehrfache Sternchen. Analysiere die Zeiteinträge der letzten zwei Wochen und identifiziere Muster, Ineffizienzen und Optimierungspotenziale. Gib konkrete Vorschläge, wie KI eingesetzt werden kann, um Prozesse zu optimieren und Zeit zu sparen. Jeder Vorschlag sollte einen Titel, eine detaillierte Beschreibung und eine quantifizierte potenzielle Zeitersparnis oder Produktivitätssteigerung enthalten.",
                },
                {
                  role: "user",
                  content: `Analysiere die folgenden Zeiteinträge der letzten zwei Wochen und gib 4-5 konkrete KI-Optimierungsvorschläge:\n\n${weeklyEntries}\n\nFür jeden Vorschlag gib einen Titel, eine detaillierte Beschreibung und eine quantifizierte potenzielle Zeitersparnis oder Produktivitätssteigerung an.`,
                },
              ]
            : [
                {
                  role: "system",
                  content:
                    "Du bist ein intelligenter Assistent, der Zeiterfassungsdaten analysiert und zusammenfasst. Antworte auf Deutsch und in einem professionellen Ton. Wichtig: Verwende für Hervorhebungen und wichtige Begriffe Markdown-Formatierung mit genau zwei Sternchen für fett (**fett**), aber vermeide übermäßige oder mehrfache Sternchen. Nutze alle Einträge des jeweiligen Tages als Kontext für eine umfassende Analyse. Biete tiefere Einblicke in Produktivitätsmuster, Zeitverteilung und potenzielle Optimierungsmöglichkeiten. Identifiziere Trends und gib konstruktive Vorschläge.",
                },
                {
                  role: "user",
                  content: `Gib eine prägnante Tageszusammenfassung für die folgenden Zeiteinträge:\n\n${dailyEntries}\n\nGib dann eine prägnante Wochenzusammenfassung für die folgenden Zeiteinträge:\n\n${weeklyEntries}`,
                },
              ],
          temperature: 0.7,
          max_completion_tokens: isOptimizationAnalysis ? 1000 : 500,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
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
