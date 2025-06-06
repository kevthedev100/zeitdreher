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

// AI-powered parsing using OpenAI directly
async function parseWithAI(transcriptionText: string): Promise<any> {
  const messages = [
    {
      role: "system",
      content: `Du bist ein Assistent, der deutsche Spracheingaben für Zeiterfassung in strukturierte Daten umwandelt.
      Extrahiere folgende Informationen aus dem Text:
      - area: Arbeitsbereich (z.B. Entwicklung, Design, Marketing, Management, Vertrieb, Support)
      - field: Arbeitsfeld innerhalb des Bereichs (z.B. Frontend, Backend, UI Design, Content Creation, Kundenbetreuung)
      - activity: Spezifische Aktivität oder Projekt (z.B. React Development, API Integration, Wireframing, Blog Writing)
      - duration: Dauer in Stunden als Dezimalzahl (z.B. "2 Stunden" -> 2, "30 Minuten" -> 0.5, "1 Stunde 15 Minuten" -> 1.25)
      - date: Datum im Format YYYY-MM-DD ("heute" -> heutiges Datum, "gestern" -> gestriges Datum, "Montag" -> letzter Montag, etc.)
      - startTime: Startzeit im Format HH:MM (z.B. "9 Uhr" -> "09:00", "halb 10" -> "09:30", "viertel nach 2" -> "14:15")
      - endTime: Endzeit im Format HH:MM (z.B. "14 Uhr" -> "14:00", "halb 5" -> "16:30")
      - description: Detaillierte Beschreibung der Arbeit
      
      WICHTIGE ERKENNUNGSREGELN:
      - "von X bis Y Uhr" oder "von X bis Y" -> extrahiere X als startTime und Y als endTime
      - "die genaue Beschreibung ist..." oder "die Beschreibung lautet..." oder "beschreibung:" -> nutze den folgenden Text als description
      - "im Bereich X" oder "in X" -> extrahiere X als area
      - "im Feld Y" oder "für Y" -> extrahiere Y als field  
      - "Aktivität Z" oder "habe Z gemacht" -> extrahiere Z als activity
      - Zeitangaben wie "2 Stunden", "30 Minuten", "1,5 Stunden" -> konvertiere zu Dezimalstunden
      - Deutsche Uhrzeiten: "halb" = :30, "viertel nach" = :15, "viertel vor" = :45
      - Wochentage beziehen sich auf die letzte Instanz dieses Tages
      
      WICHTIG FÜR DIE BESCHREIBUNG:
      - Gib die Beschreibung 1:1 wieder, wie sie gesprochen wurde
      - Korrigiere nur offensichtliche Rechtschreibfehler
      - Fasse die Beschreibung NICHT zusammen oder abstrahiere sie
      - Behalte alle Details und den genauen Wortlaut bei
      
      Antworte nur mit einem JSON-Objekt ohne zusätzlichen Text. Wenn eine Information nicht im Text vorhanden ist, setze den Wert auf null.
      
      Beispiel-Antwort:
      {
        "area": "Entwicklung",
        "field": "Frontend",
        "activity": "React Development",
        "startTime": "09:00",
        "endTime": "11:30",
        "duration": 2.5,
        "date": "2024-01-15",
        "description": "Implementierung der neuen Dashboard-Komponente"
      }`,
    },
    {
      role: "user",
      content: transcriptionText,
    },
  ];

  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

  if (!openaiApiKey) {
    console.error("OpenAI API key is missing from environment variables");
    throw new Error("OpenAI API key is not configured");
  }

  try {
    console.log("Parsing transcription with OpenAI...");
    const chatResponse = await exponentialBackoffRetry(() =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.2,
          max_tokens: 300,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error("OpenAI API error:", {
            status: res.status,
            statusText: res.statusText,
            error: errorText,
          });
          throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
        }
        return res.json();
      }),
    );

    const content = chatResponse.choices?.[0]?.message?.content;
    if (content) {
      const parsedContent = JSON.parse(content);
      console.log("AI parsed content via OpenAI:", parsedContent);
      return parsedContent;
    }
  } catch (error) {
    console.warn("OpenAI parsing failed:", error);
  }

  // Fallback - return basic structure
  console.warn("AI parsing failed, using basic fallback");
  return {
    area: null,
    field: null,
    activity: null,
    startTime: null,
    endTime: null,
    duration: null,
    date: null,
    description: transcriptionText, // Use original text as description fallback
  };
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
    console.log(
      "OpenAI API key is available and will be used for transcription",
    );

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

    // Use AI-powered parsing with fallback options
    const parsedData = await parseWithAI(transcribedText);

    // Add natural language date parsing
    if (parsedData.date && typeof parsedData.date === "string") {
      parsedData.date = parseNaturalDate(parsedData.date);
    }

    // Format time values if they exist but aren't in HH:MM format
    if (parsedData.startTime && typeof parsedData.startTime === "string") {
      parsedData.startTime = formatTimeString(parsedData.startTime);
    }

    if (parsedData.endTime && typeof parsedData.endTime === "string") {
      parsedData.endTime = formatTimeString(parsedData.endTime);
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
    console.error("Error stack:", error.stack);

    // Determine if error is retryable
    const isRetryable =
      error instanceof Error &&
      (error.message.includes("timeout") ||
        error.message.includes("network") ||
        error.message.includes("502") ||
        error.message.includes("503") ||
        error.message.includes("504"));

    // Provide more detailed error information
    const errorDetails = {
      message: error.message || "Unknown error",
      type: error.constructor.name,
      retryable: isRetryable,
      timestamp: new Date().toISOString(),
    };

    console.error("Detailed error info:", errorDetails);

    return new Response(
      JSON.stringify({
        error: "Transcription processing failed",
        details: errorDetails,
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

// Format time string to HH:MM format
function formatTimeString(timeStr: string): string {
  // Remove any non-numeric characters except colon
  const cleanedStr = timeStr.replace(/[^0-9:]/g, "");

  // If it's already in HH:MM or HH:MM:SS format, return it
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanedStr)) {
    // Ensure hours have two digits
    const parts = cleanedStr.split(":");
    return `${parts[0].padStart(2, "0")}:${parts[1]}`;
  }

  // If it's just a number (like "14"), assume it's hours and add minutes
  if (/^\d{1,2}$/.test(cleanedStr)) {
    return `${cleanedStr.padStart(2, "0")}:00`;
  }

  // Default fallback
  return timeStr;
}
