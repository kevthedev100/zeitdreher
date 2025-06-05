import { corsHeaders } from "@shared/cors.ts";
import {
  OptimizationAnalysisRequest,
  TimeEntryData,
} from "@shared/optimization.ts";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { entries } = (await req.json()) as { entries: TimeEntryData[] };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
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

    // Format entries for the OpenAI API
    const entriesContent = entries
      .map((entry) => {
        return `- ${entry.date}: ${entry.activity} (${entry.area} > ${entry.field}) - ${entry.duration}h - ${entry.description || "Keine Beschreibung"}`;
      })
      .join("\n");

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("OpenAI API key is missing from environment variables");
      throw new Error("OpenAI API key is not configured");
    }

    // Call OpenAI API directly
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein KI-Assistent, der Zeiterfassungsdaten analysiert und Empfehlungen gibt, welche Prozesse und Tätigkeiten durch den Einsatz von KI optimiert werden könnten. Antworte auf Deutsch und in einem professionellen Ton. Strukturiere deine Antwort in 3-4 konkrete Empfehlungen mit jeweils einem Titel, einer kurzen Beschreibung und dem geschätzten Optimierungspotenzial in Stunden oder Prozent.",
          },
          {
            role: "user",
            content: `Analysiere die folgenden Zeiterfassungseinträge und empfehle, welche Prozesse und Tätigkeiten durch den Einsatz von KI optimiert werden könnten:\n\n${entriesContent}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Process the AI response to extract recommendations
    const aiContent = data.choices[0].message.content;

    // Parse the AI response to extract structured recommendations
    const recommendations = parseAIRecommendations(aiContent);

    return new Response(
      JSON.stringify({
        recommendations,
        rawContent: aiContent,
        dataQuality: {
          entriesAnalyzed: entries.length,
          confidenceScore: 0.85, // Example confidence score
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in generate-optimization-plan function:", error);

    return new Response(
      JSON.stringify({
        error: "Optimization plan generation failed",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Helper function to parse AI recommendations into structured format
function parseAIRecommendations(content: string) {
  // Simple parsing logic - in a real implementation, this would be more robust
  const recommendations = [];
  const types = ["purple", "blue", "green", "amber"];

  // Split by numbered points or headings
  const sections = content.split(/\d+\.\s|\n\s*\n/).filter(Boolean);

  for (let i = 0; i < Math.min(sections.length, 4); i++) {
    const section = sections[i].trim();

    // Try to extract title, description and potential
    let title = section.split("\n")[0].replace(/^[\*\-]\s*/, "");
    let description = "";
    let potential = "";

    // Look for potential/savings mentions
    const potentialMatch =
      section.match(/Potenzial[^:]*:\s*([^\n]+)/i) ||
      section.match(/Zeitersparnis[^:]*:\s*([^\n]+)/i) ||
      section.match(/Produktivitätssteigerung[^:]*:\s*([^\n]+)/i);

    if (potentialMatch) {
      potential = potentialMatch[1].trim();
      // Remove the potential line from the description
      description = section
        .replace(title, "")
        .replace(potentialMatch[0], "")
        .trim();
    } else {
      // If no specific potential found, use the rest as description
      description = section.replace(title, "").trim();
    }

    recommendations.push({
      title: title,
      description: description,
      potential: potential || "Potenzieller Zeitgewinn: 10-15%",
      type: types[i % types.length],
    });
  }

  return recommendations;
}
