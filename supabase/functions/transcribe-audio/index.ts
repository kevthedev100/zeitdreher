import { corsHeaders } from "@shared/cors.ts";

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

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create FormData for OpenAI API via Pica Passthrough
    const openAIFormData = new FormData();
    openAIFormData.append("file", audioFile, "audio.webm");
    openAIFormData.append("model", "whisper-1");
    openAIFormData.append("language", "de"); // German language

    // Call OpenAI Whisper API via Pica Passthrough
    const response = await fetch(
      "https://api.picaos.com/v1/passthrough/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          "x-pica-secret": Deno.env.get("PICA_SECRET_KEY")!,
          "x-pica-connection-key": Deno.env.get("PICA_OPENAI_CONNECTION_KEY")!,
          "x-pica-action-id":
            "conn_mod_def::GDzgH4tQCbA::kJ8mPI-0SmO6UV04cpjyZw",
        },
        body: openAIFormData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Transcription failed", details: errorText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const transcriptionResult = await response.json();
    const transcribedText = transcriptionResult.text;

    // Parse the transcribed text to extract time entry information
    const parsedData = parseTimeEntryFromText(transcribedText);

    return new Response(
      JSON.stringify({
        transcription: transcribedText,
        parsed: parsedData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in transcribe-audio function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

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
