import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { dailyEntries, weeklyEntries, summaryType, analysisType } =
      await req.json();

    if (!dailyEntries && !weeklyEntries) {
      return new Response(
        JSON.stringify({ error: "No entries provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const isOptimizationAnalysis = analysisType === "optimization";
    const type = summaryType || "daily";

    const messages = isOptimizationAnalysis
      ? buildOptimizationPrompt(weeklyEntries)
      : buildSummaryPrompt(type, dailyEntries, weeklyEntries);

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const maxTokens = isOptimizationAnalysis
      ? 1000
      : type === "monthly"
        ? 1200
        : type === "weekly"
          ? 1000
          : 800;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.4,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Empty response from OpenAI");
    }

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: data.choices[0].message.content } }],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in generate-summaries:", error);
    return new Response(
      JSON.stringify({ error: "Summary generation failed", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function buildSummaryPrompt(
  type: string,
  dailyEntries: string,
  weeklyEntries: string,
) {
  const systemPrompt = `Du bist ein erfahrener Produktivitätscoach und Zeitmanagement-Experte. Du analysierst Zeiterfassungsdaten und gibst persönliche, konkrete und hilfreiche Einschätzungen.

REGELN:
- Beziehe dich IMMER auf die konkreten Beschreibungen und Aktivitäten in den Einträgen
- Gib PERSÖNLICHE, kontextbezogene Empfehlungen (nicht generisch)
- Wenn ein Eintrag eine Beschreibung hat, gehe darauf ein
- Schreibe auf Deutsch, professionell aber freundlich
- Verwende AUSSCHLIESSLICH HTML: <h4>, <p>, <ul>, <li>, <strong>, <em>
- KEIN Markdown
- Setze ein passendes Emoji VOR jede h4-Überschrift (z.B. <h4>📊 Titel</h4>)
- Sei konkret: Nenne die echten Aktivitätsnamen, Bereiche und Beschreibungen aus den Daten`;

  if (type === "daily") {
    return [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Erstelle einen Tagesbericht basierend auf diesen heutigen Zeiteinträgen:

${dailyEntries || "Keine Einträge für heute"}

Struktur deines Berichts:

<h4>📊 Tagesübersicht</h4>
<p>Fasse zusammen was heute konkret gemacht wurde. Nenne die Bereiche und Aktivitäten beim Namen. Gehe auf die Beschreibungen der Einträge ein.</p>

<h4>⏱️ Zeiteinsatz</h4>
<ul><li>Für jeden Bereich: konkreter Name, Stunden, und was genau gemacht wurde (aus der Beschreibung)</li></ul>

<h4>💡 Einschätzung</h4>
<p>Gib eine ehrliche, persönliche Einschätzung des Tages: Wie war die Verteilung? Was lief gut? Wo könnte man morgen ansetzen? Beziehe dich auf die konkreten Tätigkeiten.</p>`,
      },
    ];
  }

  if (type === "weekly") {
    return [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Erstelle einen Wochenbericht basierend auf diesen Zeiteinträgen der aktuellen Woche:

${weeklyEntries || "Keine Einträge diese Woche"}

Struktur deines Berichts:

<h4>📅 Wochenrückblick</h4>
<p>Fasse zusammen was diese Woche insgesamt geleistet wurde. Welche Schwerpunkte gab es? Gehe auf die konkreten Projekte und Tätigkeiten ein.</p>

<h4>🎯 Arbeitsschwerpunkte</h4>
<ul><li>Top-Bereiche und Aktivitäten mit Stunden und konkreten Beschreibungen aus den Daten</li></ul>

<h4>📈 Wochenverlauf</h4>
<p>Wie hat sich die Arbeitswoche entwickelt? Welche Tage waren besonders produktiv? Gab es Muster (z.B. morgens mehr Fokus-Arbeit)?</p>

<h4>✅ Empfehlungen für nächste Woche</h4>
<p>Konkrete, auf die Daten bezogene Empfehlungen: Was sollte beibehalten werden? Was könnte optimiert werden? Beziehe dich auf die tatsächlichen Aktivitäten und deren Zeitaufwand.</p>`,
      },
    ];
  }

  if (type === "monthly") {
    return [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Erstelle einen Monatsbericht basierend auf diesen Zeiteinträgen der letzten 30 Tage:

${weeklyEntries || "Keine Einträge im letzten Monat"}

Struktur deines Berichts:

<h4>📊 Monatsübersicht</h4>
<p>Gesamtüberblick: Wie viele Stunden wurden insgesamt erfasst? Was waren die Hauptbereiche? Welche Projekte haben den Monat dominiert?</p>

<h4>🏆 Top-Bereiche & Aktivitäten</h4>
<ul><li>Die wichtigsten Bereiche mit Stundenzahlen, Anteilen und konkreten Tätigkeitsbeschreibungen</li></ul>

<h4>📈 Entwicklung über den Monat</h4>
<p>Wie hat sich das Arbeitsverhalten über die Wochen verändert? Gab es Wochen mit mehr/weniger Stunden? Welche Bereiche haben zugenommen/abgenommen?</p>

<h4>🔍 Muster & Erkenntnisse</h4>
<p>Welche wiederkehrenden Muster sind erkennbar? Wo wird regelmäßig viel Zeit investiert? Gibt es Bereiche die unterrepräsentiert sind?</p>

<h4>💡 Strategische Empfehlungen</h4>
<p>Konkrete Empfehlungen basierend auf den Monatsdaten: Zeitallokation, Fokus-Bereiche, potenzielle Effizienzgewinne. Immer mit Bezug auf die echten Daten.</p>`,
      },
    ];
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Analysiere diese Zeitdaten:\n${dailyEntries}\n${weeklyEntries}` },
  ];
}

function buildOptimizationPrompt(weeklyEntries: string) {
  return [
    {
      role: "system",
      content: `Du bist ein erfahrener KI-Berater und Produktivitätsexperte. Du analysierst Zeiterfassungsdaten und gibst konkrete, umsetzbare Empfehlungen zur Effizienzsteigerung mit KI-Tools und Automatisierung.

REGELN:
- Beziehe dich auf die konkreten Aktivitäten und Beschreibungen in den Einträgen
- Nenne spezifische KI-Tools (ChatGPT, Make.com, Notion AI, etc.) — bevorzuge Make.com als Automatisierungsplattform, NICHT Zapier
- Gib realistische Zeitersparnis-Schätzungen basierend auf den tatsächlichen Stunden
- Verwende AUSSCHLIESSLICH HTML: <h4>, <p>, <ul>, <li>, <strong>, <em>
- KEIN Markdown
- Setze ein passendes Emoji VOR jede h4-Überschrift (z.B. <h4>📊 Titel</h4>)`,
    },
    {
      role: "user",
      content: `Analysiere diese Zeiteinträge und erstelle einen KI-Optimierungsplan:

${weeklyEntries}

Struktur:

<h4>📊 Gesamtanalyse</h4>
<p>Überblick über die erfassten Tätigkeiten. Welche Bereiche dominieren? Wo steckt das größte Optimierungspotenzial? Beziehe dich auf die konkreten Aktivitäten.</p>

<h4>🤖 KI-Automatisierungspotenzial</h4>
<ul><li>Für jeden identifizierten Bereich: Welche Aufgaben können durch KI automatisiert oder beschleunigt werden? Nenne konkrete Tools und Anwendungsfälle.</li></ul>

<h4>🚀 Top-3 Sofortmaßnahmen</h4>
<ul><li>Die drei wirkungsvollsten Maßnahmen, die sofort umgesetzt werden können. Mit konkretem Tool, Beschreibung und geschätzter Zeitersparnis.</li></ul>

<h4>💰 Geschätzte Gesamtersparnis</h4>
<p>Realistische Einschätzung der wöchentlichen Zeitersparnis basierend auf den tatsächlichen Stunden in den Daten. Aufschlüsselung nach Bereich.</p>`,
    },
  ];
}
