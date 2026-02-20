import { corsHeaders } from "@shared/cors.ts";

interface TimeEntry {
  area: string;
  duration: number;
  task?: string;
  field?: string;
  description?: string;
  activity?: string;
  date?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const entries = requestBody.entries || requestBody.timeEntries;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "entries array is required and must not be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const groupedEntries: Record<string, TimeEntry[]> = {};
    for (const entry of entries) {
      const area = entry.area || "Unbekannt";
      if (!groupedEntries[area]) groupedEntries[area] = [];
      groupedEntries[area].push(entry);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const suggestions = [];

    for (const [area, areaEntries] of Object.entries(groupedEntries)) {
      const totalHours = areaEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

      const entriesText = areaEntries
        .map((entry) => {
          const task = entry.task || entry.activity || "Unbekannt";
          const field = entry.field || "";
          const desc = entry.description || "";
          const date = entry.date || "";
          return `- ${date ? date + ": " : ""}${task}${field ? " (" + field + ")" : ""} — ${entry.duration || 0}h${desc ? " — " + desc : ""}`;
        })
        .join("\n");

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `Du bist ein erfahrener KI- und Automatisierungsberater, der Unternehmen hilft, ihre Arbeitsprozesse mit modernen KI-Tools zu optimieren. Du kennst dich aus mit:
- KI-Assistenten (ChatGPT, Claude, Gemini) und deren praktische Anwendung
- Automatisierungsplattformen (bevorzugt Make.com, alternativ n8n — NICHT Zapier empfehlen)
- KI-gestützte Produktivitätstools (Notion AI, Otter.ai, Fireflies, etc.)
- Workflow-Automatisierung und Prozessoptimierung

Verwende AUSSCHLIESSLICH HTML-Formatierung: <h4>, <p>, <ul>, <li>, <strong>, <em>
KEIN Markdown. Setze ein passendes Emoji VOR jede h4-Überschrift (z.B. <h4>🔍 Titel</h4>). Kompakte Struktur ohne überflüssige Leerzeichen.`,
              },
              {
                role: "user",
                content: `Analysiere die folgenden ${areaEntries.length} Zeiteinträge im Bereich "${area}" (insgesamt ${totalHours.toFixed(1)} Stunden) und erstelle einen detaillierten KI-Optimierungsplan:

${entriesText}

Erstelle einen umfassenden, auf diese konkreten Tätigkeiten zugeschnittenen Bericht:

<h4>🔍 Analyse: ${area}</h4>
<p>Was wird in diesem Bereich konkret gemacht? Welche wiederkehrenden Aufgaben und Muster sind erkennbar? Beziehe dich auf die tatsächlichen Einträge und Beschreibungen.</p>

<h4>🤖 KI-Automatisierungspotenzial</h4>
<p>Welche der erfassten Tätigkeiten lassen sich durch KI teilweise oder vollständig automatisieren? Sei spezifisch — nenne die konkreten Aufgaben aus den Daten.</p>

<h4>🛠️ Empfohlene KI-Tools & Workflows</h4>
<ul>
<li>Für jede Empfehlung: Konkretes Tool, wie es eingesetzt wird, und welche der erfassten Aufgaben es optimiert. Z.B. Make.com-Workflows, ChatGPT-Prompts, spezialisierte KI-Tools.</li>
</ul>

<h4>📋 Konkrete Umsetzungsschritte</h4>
<ul>
<li>3-5 priorisierte Maßnahmen die sofort umgesetzt werden können, mit geschätztem Aufwand und erwartetem Nutzen</li>
</ul>

<h4>💰 Erwartete Ergebnisse</h4>
<p>Geschätzte Zeitersparnis pro Woche (in Stunden), Qualitätsverbesserungen, und langfristige Vorteile. Berechne die Einsparung basierend auf den tatsächlichen ${totalHours.toFixed(1)} Stunden in diesem Bereich.</p>`,
              },
            ],
            max_tokens: 900,
            temperature: 0.5,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} — ${errorText}`);
        }

        const data = await response.json();
        let suggestionText = data.choices?.[0]?.message?.content || "Keine Vorschläge verfügbar.";

        suggestionText = suggestionText
          .replace(/###/g, "")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/```/g, "")
          .replace(/^#{1,6}\s*/gm, "")
          .trim();

        if (!suggestionText.includes("<h4>") && !suggestionText.includes("<p>")) {
          suggestionText = `<p>${suggestionText.replace(/\n\n/g, "</p><p>")}</p>`;
        }

        suggestions.push({
          area,
          suggestion: suggestionText,
          entriesCount: areaEntries.length,
          totalHours,
        });
      } catch (error) {
        console.error(`Error for area ${area}:`, error);
        suggestions.push({
          area,
          suggestion: `<h4>Analyse: ${area}</h4><p>Die KI-Analyse konnte für diesen Bereich nicht erstellt werden. Bitte versuchen Sie es erneut.</p>`,
          entriesCount: areaEntries.length,
          totalHours,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        suggestions,
        totalAreas: Object.keys(groupedEntries).length,
        totalEntries: entries.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Error in generate-area-optimization-suggestions:", error);
    return new Response(
      JSON.stringify({ error: "Optimization suggestions generation failed", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
