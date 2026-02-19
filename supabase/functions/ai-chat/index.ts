import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, timeEntries } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: "Invalid request: messages array is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("OpenAI API key is missing from environment variables");
      throw new Error("OpenAI API key is not configured");
    }

    // Enhance messages with time entry context if available
    let enhancedMessages = [...messages];

    if (timeEntries && timeEntries.length > 0) {
      // Format time entries context with more detailed information
      const timeEntriesContext = timeEntries
        .map((entry: any) => {
          const area = entry.areas?.name || "Unbekannter Bereich";
          const field = entry.fields?.name || "Unbekanntes Feld";
          const activity = entry.activities?.name || "Unbekannte Aktivität";
          const description = entry.description || "Keine Beschreibung";
          const startTime = entry.start_time
            ? ` (Start: ${entry.start_time})`
            : "";
          const endTime = entry.end_time ? ` (Ende: ${entry.end_time})` : "";

          return `${entry.date}: ${area} > ${field} > ${activity} - ${entry.duration}h${startTime}${endTime} - ${description}`;
        })
        .join("\n");

      // Add system message with context
      const systemMessage = {
        role: "system",
        content: `Du bist ein hilfreicher Assistent für Zeiterfassung und Produktivitätsanalyse. Du hilfst bei Fragen zu Zeiteinträgen, Arbeitsmustern und Produktivitätsoptimierung. Antworte auf Deutsch und sei konkret und hilfreich.

Aktuelle Zeiteinträge des Benutzers:
${timeEntriesContext}

Nutze diese Informationen, um konkrete und relevante Antworten zu geben, die sich auf die tatsächlichen Arbeitsgewohnheiten und Zeiteinträge des Benutzers beziehen.`,
      };

      // Insert system message at the beginning or update existing one
      const hasSystemMessage = enhancedMessages.some(
        (msg) => msg.role === "system",
      );
      if (hasSystemMessage) {
        enhancedMessages = enhancedMessages.map((msg) =>
          msg.role === "system" ? systemMessage : msg,
        );
      } else {
        enhancedMessages = [systemMessage, ...enhancedMessages];
      }
    }

    // Call OpenAI Chat Completion API directly
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: enhancedMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

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
    console.error("Error in AI chat function:", error);

    return new Response(
      JSON.stringify({
        error: "AI chat processing failed",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
