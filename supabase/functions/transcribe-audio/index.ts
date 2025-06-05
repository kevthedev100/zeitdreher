import { corsHeaders } from "@shared/cors.ts";

// Exponential backoff retry function
async function exponentialBackoffRetry(
  fn: () => Promise<any>,
  retries = 3,
  delay = 1000,
): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    // Check if error is retryable
    const isRetryable =
      error instanceof Error &&
      (error.message.includes("timeout") ||
        error.message.includes("network") ||
        error.message.includes("502") ||
        error.message.includes("503") ||
        error.message.includes("504"));

    if (!isRetryable) throw error;

    console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return exponentialBackoffRetry(fn, retries - 1, delay * 2);
  }
}

// Enhanced AI-powered parsing using GPT
async function parseWithAI(
  transcriptionText: string,
  apiKey: string,
): Promise<any> {
  const messages = [
    {
      role: "system",
      content: `Du bist ein Assistent, der deutsche Spracheingaben für Zeiterfassung in strukturierte Daten umwandelt. 
      Extrahiere folgende Informationen aus dem Text:
      - duration: Dauer in Stunden (z.B. "2 Stunden" -> 2, "30 Minuten" -> 0.5)
      - area: Arbeitsbereich (Entwicklung, Design, Marketing, Management)
      - field: Arbeitsfeld (Frontend, Backend, UI Design, etc.)
      - activity: Spezifische Aktivität
      - date: Datum ("heute" -> heutiges Datum, "gestern" -> gestriges Datum, etc.)
      - description: Beschreibung der Arbeit
      
      Antworte nur mit einem JSON-Objekt ohne zusätzlichen Text.`,
    },
    {
      role: "user",
      content: transcriptionText,
    },
  ];

  const chatResponse = await exponentialBackoffRetry(() =>
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0,
        max_tokens: 1000,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        console.error("OpenAI Chat Completion API error:", {
          status: res.status,
          statusText: res.statusText,
          error: errorText,
        });

        // Parse error response if it's JSON
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorText;
        } catch (e) {
          // Keep original error text if not JSON
        }

        throw new Error(
          `Chat Completion API error (${res.status}): ${errorDetails}`,
        );
      }
      return res.json();
    }),
  );

  try {
    const parsedContent = JSON.parse(chatResponse.choices[0].message.content);
    return parsedContent;
  } catch (parseError) {
    console.warn("AI parsing failed");
    throw new Error("Failed to parse AI response: " + parseError.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = (formData.get("language") as string) || "de";

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return new Response(
        JSON.stringify({
          error: "File size exceeds limit",
          details: `File size ${(audioFile.size / 1024 / 1024).toFixed(2)}MB exceeds 25MB limit`,
        }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create FormData for OpenAI API
    const openAIFormData = new FormData();
    openAIFormData.append("file", audioFile, "audio.webm");
    openAIFormData.append("model", "whisper-1");
    openAIFormData.append("language", language);
    openAIFormData.append("response_format", "verbose_json");
    openAIFormData.append(
      "timestamp_granularities",
      JSON.stringify(["word", "segment"]),
    );

    // Verify OpenAI API key is available
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OpenAI API key is missing from environment variables");
      throw new Error("OpenAI API key is not configured");
    }
    console.log("OpenAI API key is available:", openaiApiKey ? "Yes" : "No");

    // Call OpenAI Whisper API directly with retry logic
    const transcriptionResult = await exponentialBackoffRetry(() =>
      fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: openAIFormData,
      }).then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI Transcription API error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });

          // Parse error response if it's JSON
          let errorDetails = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error?.message || errorText;
          } catch (e) {
            // Keep original error text if not JSON
          }

          throw new Error(
            `Transcription API error (${response.status}): ${errorDetails}`,
          );
        }
        return response.json();
      }),
    );

    const transcribedText = transcriptionResult.text;

    // Calculate average confidence from segments
    let averageConfidence = 0;
    if (
      transcriptionResult.segments &&
      transcriptionResult.segments.length > 0
    ) {
      const totalConfidence = transcriptionResult.segments.reduce(
        (sum: number, segment: any) => sum + (segment.confidence || 0),
        0,
      );
      averageConfidence = totalConfidence / transcriptionResult.segments.length;
    }

    // Use AI-powered parsing
    const parsedData = await parseWithAI(transcribedText, openaiApiKey);

    // Add natural language date parsing
    if (parsedData.date && typeof parsedData.date === "string") {
      parsedData.date = parseNaturalDate(parsedData.date);
    }

    return new Response(
      JSON.stringify({
        transcription: transcribedText,
        parsed: parsedData,
        confidence: averageConfidence,
        segments: transcriptionResult.segments || [],
        processingMethod: "ai",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in transcribe-audio function:", error);

    // Determine if error is retryable
    const isRetryable =
      error instanceof Error &&
      (error.message.includes("timeout") ||
        error.message.includes("network") ||
        error.message.includes("502") ||
        error.message.includes("503") ||
        error.message.includes("504"));

    return new Response(
      JSON.stringify({
        error: "Transcription processing failed",
        details: error.message,
        retryable: isRetryable,
      }),
      {
        status: isRetryable ? 503 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Natural language date parsing
function parseNaturalDate(dateString: string): string {
  const today = new Date();
  const lowerDate = dateString.toLowerCase();

  if (lowerDate.includes("heute") || lowerDate.includes("today")) {
    return today.toISOString().split("T")[0];
  }

  if (lowerDate.includes("gestern") || lowerDate.includes("yesterday")) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }

  if (lowerDate.includes("vorgestern")) {
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(today.getDate() - 2);
    return dayBeforeYesterday.toISOString().split("T")[0];
  }

  // Parse weekdays
  const weekdays = {
    montag: 1,
    dienstag: 2,
    mittwoch: 3,
    donnerstag: 4,
    freitag: 5,
    samstag: 6,
    sonntag: 0,
  };

  for (const [day, dayNum] of Object.entries(weekdays)) {
    if (lowerDate.includes(day)) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      const daysBack =
        currentDay === 0 ? (7 - dayNum) % 7 : (currentDay - dayNum + 7) % 7;
      targetDate.setDate(today.getDate() - daysBack);
      return targetDate.toISOString().split("T")[0];
    }
  }

  return today.toISOString().split("T")[0]; // Default to today
}
