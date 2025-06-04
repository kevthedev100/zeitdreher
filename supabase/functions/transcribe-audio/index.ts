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
async function parseWithAI(transcriptionText: string): Promise<any> {
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
    fetch("https://api.picaos.com/v1/passthrough/v1/chat/completions", {
      method: "POST",
      headers: {
        "x-pica-secret": Deno.env.get("PICA_SECRET_KEY")!,
        "x-pica-connection-key": Deno.env.get("PICA_OPENAI_CONNECTION_KEY")!,
        "x-pica-action-id": "conn_mod_def::GDzgi1QfvM4::4OjsWvZhRxmAVuLAuWgfVA",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0,
        max_completion_tokens: 1000,
      }),
    }).then((res) => {
      if (!res.ok)
        throw new Error(`Chat Completion API error: ${res.statusText}`);
      return res.json();
    }),
  );

  try {
    const parsedContent = JSON.parse(chatResponse.choices[0].message.content);
    return parsedContent;
  } catch (parseError) {
    console.warn("AI parsing failed, falling back to rule-based parsing");
    return null;
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

    // Create FormData for OpenAI API via Pica Passthrough
    const openAIFormData = new FormData();
    openAIFormData.append("file", audioFile, "audio.webm");
    openAIFormData.append("model", "whisper-1");
    openAIFormData.append("language", language);
    openAIFormData.append("response_format", "verbose_json");
    openAIFormData.append(
      "timestamp_granularities",
      JSON.stringify(["word", "segment"]),
    );

    // Call OpenAI Whisper API via Pica Passthrough with retry logic
    const transcriptionResult = await exponentialBackoffRetry(() =>
      fetch("https://api.picaos.com/v1/passthrough/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "x-pica-secret": Deno.env.get("PICA_SECRET_KEY")!,
          "x-pica-connection-key": Deno.env.get("PICA_OPENAI_CONNECTION_KEY")!,
          "x-pica-action-id":
            "conn_mod_def::GDzgH4tQCbA::kJ8mPI-0SmO6UV04cpjyZw",
        },
        body: openAIFormData,
      }).then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Transcription API error: ${response.status} ${errorText}`,
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

    // Try AI-powered parsing first, then fall back to rule-based parsing
    let parsedData = await parseWithAI(transcribedText);
    if (!parsedData) {
      parsedData = parseTimeEntryFromText(transcribedText);
    }

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
        processingMethod: parsedData ? "ai" : "rule-based",
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

function parseTimeEntryFromText(text: string) {
  const lowerText = text.toLowerCase();

  // Extract duration (look for patterns like "2 stunden", "1,5 stunden", "30 minuten")
  let duration = null;
  const hourPatterns = [
    /([0-9]+[,.]?[0-9]*) stunden?/,
    /([0-9]+[,.]?[0-9]*) std/,
    /([0-9]+[,.]?[0-9]*) h/,
  ];

  const minutePatterns = [/([0-9]+) minuten?/, /([0-9]+) min/];

  for (const pattern of hourPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      duration = parseFloat(match[1].replace(",", "."));
      break;
    }
  }

  if (!duration) {
    for (const pattern of minutePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        duration = parseFloat(match[1]) / 60; // Convert minutes to hours
        break;
      }
    }
  }

  // Extract area keywords
  let area = null;
  if (
    lowerText.includes("entwicklung") ||
    lowerText.includes("programmier") ||
    lowerText.includes("code")
  ) {
    area = "Entwicklung";
  } else if (
    lowerText.includes("design") ||
    lowerText.includes("ui") ||
    lowerText.includes("ux")
  ) {
    area = "Design";
  } else if (
    lowerText.includes("marketing") ||
    lowerText.includes("werbung") ||
    lowerText.includes("social media")
  ) {
    area = "Marketing";
  } else if (
    lowerText.includes("management") ||
    lowerText.includes("meeting") ||
    lowerText.includes("planung")
  ) {
    area = "Management";
  }

  // Extract field keywords
  let field = null;
  if (area === "Entwicklung") {
    if (
      lowerText.includes("frontend") ||
      lowerText.includes("react") ||
      lowerText.includes("css")
    ) {
      field = "Frontend";
    } else if (
      lowerText.includes("backend") ||
      lowerText.includes("api") ||
      lowerText.includes("server")
    ) {
      field = "Backend";
    } else if (lowerText.includes("test") || lowerText.includes("bug")) {
      field = "Testing";
    }
  } else if (area === "Design") {
    if (lowerText.includes("ui") || lowerText.includes("interface")) {
      field = "UI Design";
    } else if (lowerText.includes("ux") || lowerText.includes("research")) {
      field = "UX Research";
    } else if (lowerText.includes("prototyp")) {
      field = "Prototyping";
    }
  } else if (area === "Marketing") {
    if (lowerText.includes("content") || lowerText.includes("inhalt")) {
      field = "Content Creation";
    } else if (lowerText.includes("social")) {
      field = "Social Media";
    } else if (
      lowerText.includes("kampagne") ||
      lowerText.includes("campaign")
    ) {
      field = "Campaigns";
    }
  } else if (area === "Management") {
    if (lowerText.includes("planung") || lowerText.includes("plan")) {
      field = "Planning";
    } else if (
      lowerText.includes("meeting") ||
      lowerText.includes("besprechung")
    ) {
      field = "Meetings";
    } else if (lowerText.includes("report") || lowerText.includes("bericht")) {
      field = "Reporting";
    }
  }

  // Extract activity keywords
  let activity = null;
  if (field === "Frontend") {
    if (lowerText.includes("react") || lowerText.includes("component")) {
      activity = "React Development";
    } else if (
      lowerText.includes("css") ||
      lowerText.includes("styling") ||
      lowerText.includes("layout")
    ) {
      activity = "CSS/Styling";
    } else if (
      lowerText.includes("performance") ||
      lowerText.includes("optimier")
    ) {
      activity = "Performance Optimization";
    }
  } else if (field === "Backend") {
    if (lowerText.includes("api")) {
      activity = "API Development";
    } else if (
      lowerText.includes("datenbank") ||
      lowerText.includes("database")
    ) {
      activity = "Database Work";
    } else if (
      lowerText.includes("deployment") ||
      lowerText.includes("deploy")
    ) {
      activity = "Deployment";
    }
  } else if (field === "Testing") {
    if (lowerText.includes("unit")) {
      activity = "Unit Testing";
    } else if (lowerText.includes("integration")) {
      activity = "Integration Testing";
    } else if (lowerText.includes("bug") || lowerText.includes("fehler")) {
      activity = "Bug Fixing";
    }
  }

  return {
    duration,
    area,
    field,
    activity,
    description: text, // Use original text as description
  };
}
