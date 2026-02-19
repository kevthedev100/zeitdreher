import { corsHeaders } from "@shared/cors.ts";

// Exponential backoff retry function with enhanced OpenAI error detection
async function exponentialBackoffRetry(
  fn: () => Promise<any>,
  retries = 3,
  delay = 1000,
): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      console.error("[RETRY_EXHAUSTED] All retry attempts exhausted", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }

    // Enhanced retryable error detection for OpenAI issues
    const isRetryable =
      error instanceof Error &&
      (error.message.includes("timeout") ||
        error.message.includes("network") ||
        error.message.includes("502") ||
        error.message.includes("503") ||
        error.message.includes("504") ||
        error.message.includes("500") ||
        error.message.includes("OpenAI API error (5") || // 5xx errors from OpenAI
        error.message.includes("Service Unavailable") ||
        error.message.includes("Bad Gateway") ||
        error.message.includes("Gateway Timeout") ||
        error.message.includes("Internal Server Error"));

    if (!isRetryable) {
      console.error("[NON_RETRYABLE_ERROR] Error is not retryable:", {
        error: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }

    console.log(
      `[RETRY_ATTEMPT] Retrying in ${delay}ms... (${retries} retries left)`,
      {
        error: error.message,
        attempt: 4 - retries,
        timestamp: new Date().toISOString(),
      },
    );

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
    console.error(
      "[PARSE_AI_ERROR] OpenAI API key is missing from environment variables",
    );
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

Deno.serve(async (req) => {
  // Handle CORS preflight request IMMEDIATELY, without any authentication checks
  if (req.method === "OPTIONS") {
    console.log("[CORS_DEBUG] Handling OPTIONS preflight request");
    return new Response(null, {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    // Log request headers for debugging (without sensitive data)
    console.log("[REQUEST_DEBUG] Request method:", req.method);
    console.log(
      "[REQUEST_DEBUG] Content-Type:",
      req.headers.get("content-type"),
    );
    console.log(
      "[REQUEST_DEBUG] Authorization header present:",
      !!req.headers.get("authorization"),
    );
    console.log(
      "[REQUEST_DEBUG] ApiKey header present:",
      !!req.headers.get("apikey"),
    );

    // Check for required Supabase headers (only for non-OPTIONS requests)
    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("apikey");

    if (!authHeader && !apiKeyHeader) {
      console.error("[AUTH_ERROR] No authorization or apikey header found");
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          details: "Missing authorization or apikey header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify OpenAI API key is available
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error(
        "[CONFIG_ERROR] OpenAI API key is missing from environment variables",
      );
      return new Response(
        JSON.stringify({
          error: "Service configuration error",
          details: "OpenAI API key not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    console.log("[CONFIG_DEBUG] OpenAI API key is available");
    // Check if the request has the correct content type
    const requestContentType = req.headers.get("content-type") || "";
    if (!requestContentType.includes("multipart/form-data")) {
      console.error("Invalid content type:", requestContentType);
      return new Response(
        JSON.stringify({
          error: "Invalid content type",
          details: "Expected multipart/form-data",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse form data with robust error handling and fallback
    let formData: FormData | null = null;
    let audioFile: File | null = null;

    try {
      console.log("[FORM_DATA_DEBUG] Attempting to parse form data...");
      formData = await req.formData();
      console.log("[FORM_DATA_DEBUG] Form data parsed successfully");
    } catch (formError) {
      console.error("[FORM_DATA_ERROR] Primary form data parsing failed:", {
        error: formError.message,
        type: formError.constructor.name,
        timestamp: new Date().toISOString(),
        contentType: req.headers.get("content-type"),
        contentLength: req.headers.get("content-length"),
      });

      // Attempt fallback: manual multipart parsing
      try {
        console.log(
          "[FORM_DATA_DEBUG] Attempting fallback multipart parsing...",
        );
        const fallbackContentType = req.headers.get("content-type") || "";
        const boundaryMatch = fallbackContentType.match(/boundary=([^;]+)/);

        if (!boundaryMatch) {
          throw new Error("No boundary found in content-type header");
        }

        const boundary = boundaryMatch[1];
        console.log("[FORM_DATA_DEBUG] Found boundary:", boundary);

        // Get the raw body as array buffer
        const bodyArrayBuffer = await req.arrayBuffer();
        const bodyBytes = new Uint8Array(bodyArrayBuffer);
        console.log("[FORM_DATA_DEBUG] Body size:", bodyBytes.length, "bytes");

        // Convert to string for boundary detection
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const bodyText = decoder.decode(bodyBytes);

        // Find audio file in multipart data
        const boundaryDelimiter = `--${boundary}`;
        const parts = bodyText.split(boundaryDelimiter);

        console.log(
          "[FORM_DATA_DEBUG] Found",
          parts.length,
          "parts in multipart data",
        );

        for (const part of parts) {
          if (part.includes('name="audio"') && part.includes("filename=")) {
            console.log("[FORM_DATA_DEBUG] Found audio part");

            // Extract the binary data part
            const headerEndIndex = part.indexOf("\r\n\r\n");
            if (headerEndIndex === -1) continue;

            const headers = part.substring(0, headerEndIndex);
            const binaryStart = headerEndIndex + 4;

            // Find content type
            let extractedContentType = "audio/webm";
            const contentTypeMatch = headers.match(
              /Content-Type:\s*([^\r\n]+)/,
            );
            if (contentTypeMatch) {
              extractedContentType = contentTypeMatch[1].trim();
            }

            // Extract filename
            let filename = "audio.webm";
            const filenameMatch = headers.match(/filename="([^"]+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }

            console.log("[FORM_DATA_DEBUG] Extracted metadata:", {
              contentType: extractedContentType,
              filename,
            });

            // Get the binary data by finding the exact byte positions
            const partBytes = new TextEncoder().encode(part);
            const headerEndBytes = new TextEncoder().encode("\r\n\r\n");

            // Find header end in bytes
            let headerEndByteIndex = -1;
            for (
              let i = 0;
              i <= partBytes.length - headerEndBytes.length;
              i++
            ) {
              let match = true;
              for (let j = 0; j < headerEndBytes.length; j++) {
                if (partBytes[i + j] !== headerEndBytes[j]) {
                  match = false;
                  break;
                }
              }
              if (match) {
                headerEndByteIndex = i + headerEndBytes.length;
                break;
              }
            }

            if (headerEndByteIndex === -1) {
              console.error(
                "[FORM_DATA_DEBUG] Could not find header end in bytes",
              );
              continue;
            }

            // Extract audio data from original body bytes
            const partStartInBody = bodyText.indexOf(part);
            const audioDataStart = partStartInBody + headerEndByteIndex;
            const nextBoundaryIndex = bodyText.indexOf(
              boundaryDelimiter,
              audioDataStart,
            );
            const audioDataEnd =
              nextBoundaryIndex === -1
                ? bodyBytes.length
                : partStartInBody +
                  bodyText
                    .substring(partStartInBody)
                    .indexOf(boundaryDelimiter, headerEndByteIndex) -
                  2; // -2 for \r\n before boundary

            if (
              audioDataStart < audioDataEnd &&
              audioDataEnd <= bodyBytes.length
            ) {
              const audioBytes = bodyBytes.slice(audioDataStart, audioDataEnd);
              console.log(
                "[FORM_DATA_DEBUG] Extracted audio data:",
                audioBytes.length,
                "bytes",
              );

              // Create File object
              audioFile = new File([audioBytes], filename, {
                type: extractedContentType,
              });
              console.log("[FORM_DATA_DEBUG] Created File object successfully");
              break;
            } else {
              console.error(
                "[FORM_DATA_DEBUG] Invalid audio data boundaries:",
                { audioDataStart, audioDataEnd, bodyLength: bodyBytes.length },
              );
            }
          }
        }

        if (!audioFile) {
          throw new Error("Could not extract audio file from multipart data");
        }
      } catch (fallbackError) {
        console.error("[FORM_DATA_ERROR] Fallback parsing also failed:", {
          error: fallbackError.message,
          type: fallbackError.constructor.name,
          timestamp: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            error: "Failed to parse multipart form data",
            details: {
              primaryError: formError.message,
              fallbackError: fallbackError.message,
              timestamp: new Date().toISOString(),
              retryable: false,
            },
            retryable: false,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Extract audio file and language from form data or fallback
    if (!audioFile && formData) {
      audioFile = formData.get("audio") as File;
    }

    const language = (formData?.get("language") as string) || "de";

    if (!audioFile) {
      console.error("[AUDIO_FILE_ERROR] No audio file found in request");
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[AUDIO_FILE_DEBUG] Audio file details:", {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });

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

    // Create FormData for OpenAI API with proper file handling
    const openAIFormData = new FormData();

    // Ensure we have a proper filename and content type
    const filename = audioFile.name || "recording.webm";
    const audioContentType = audioFile.type || "audio/webm";

    console.log("[OPENAI_PREP] Preparing audio for OpenAI:", {
      filename,
      contentType: audioContentType,
      size: audioFile.size,
    });

    // Create a new Blob with explicit type if needed
    const audioBlob = new Blob([audioFile], { type: audioContentType });

    openAIFormData.append("file", audioBlob, filename);
    openAIFormData.append("model", "whisper-1");
    openAIFormData.append("language", language);
    openAIFormData.append("response_format", "verbose_json");
    openAIFormData.append(
      "timestamp_granularities",
      JSON.stringify(["word", "segment"]),
    );

    console.log("[OPENAI_PREP] FormData prepared for OpenAI API");

    // OpenAI API key was already verified at the start of the function

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

          // Enhanced logging for OpenAI API issues
          const errorInfo = {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            timestamp: new Date().toISOString(),
            headers: Object.fromEntries(response.headers.entries()),
          };

          console.error(
            "[OPENAI_API_ERROR] OpenAI Transcription API error:",
            errorInfo,
          );

          // Check for specific OpenAI downtime indicators
          if (response.status >= 500) {
            console.error(
              "[OPENAI_DOWNTIME] OpenAI appears to be experiencing server issues (5xx error)",
            );
          } else if (response.status === 429) {
            console.error("[OPENAI_RATE_LIMIT] OpenAI rate limit exceeded");
          } else if (response.status === 503) {
            console.error(
              "[OPENAI_SERVICE_UNAVAILABLE] OpenAI service is temporarily unavailable",
            );
          }

          // Parse error response if it's JSON
          let errorDetails = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error?.message || errorText;

            // Log specific OpenAI error types
            if (errorJson.error?.type) {
              console.error(
                `[OPENAI_ERROR_TYPE] ${errorJson.error.type}: ${errorJson.error.message}`,
              );
            }
          } catch (e) {
            // Keep original error text if not JSON
            console.error(
              "[OPENAI_ERROR_PARSE] Could not parse OpenAI error response as JSON",
            );
          }

          throw new Error(
            `OpenAI API error (${response.status}): ${errorDetails}`,
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
    console.error(
      "[TRANSCRIPTION_FUNCTION_ERROR] Error in transcribe-audio function:",
      error,
    );
    console.error("[ERROR_STACK]", error.stack);

    // Enhanced error analysis for OpenAI issues
    const errorMessage = error.message || "Unknown error";
    const isOpenAIError =
      errorMessage.includes("OpenAI") ||
      errorMessage.includes("api.openai.com");
    const isNetworkError =
      errorMessage.includes("network") || errorMessage.includes("fetch");
    const isFormDataError = errorMessage.includes(
      "Body can not be decoded as form data",
    );

    // Determine if error is retryable
    const isRetryable =
      error instanceof Error &&
      (errorMessage.includes("timeout") ||
        errorMessage.includes("network") ||
        errorMessage.includes("502") ||
        errorMessage.includes("503") ||
        errorMessage.includes("504") ||
        errorMessage.includes("500") ||
        errorMessage.includes("OpenAI API error (5") ||
        errorMessage.includes("Service Unavailable") ||
        errorMessage.includes("Bad Gateway") ||
        errorMessage.includes("Gateway Timeout"));

    // Enhanced error categorization and logging
    if (isFormDataError) {
      console.error(
        "[FORM_DATA_DECODE_ERROR] This might indicate OpenAI API issues or network problems",
      );
    }

    if (isOpenAIError) {
      console.error(
        "[OPENAI_SERVICE_ERROR] Error appears to be related to OpenAI service",
      );
      if (errorMessage.includes("5")) {
        console.error(
          "[OPENAI_DOWNTIME_SUSPECTED] OpenAI may be experiencing downtime (5xx error)",
        );
      }
    }

    if (isNetworkError) {
      console.error("[NETWORK_ERROR] Network connectivity issue detected");
    }

    // Provide more detailed error information
    const errorDetails = {
      message: errorMessage,
      type: error.constructor.name,
      retryable: isRetryable,
      timestamp: new Date().toISOString(),
      category: isOpenAIError
        ? "openai_error"
        : isNetworkError
          ? "network_error"
          : isFormDataError
            ? "form_data_error"
            : "unknown_error",
      openai_related: isOpenAIError,
      suspected_downtime:
        isOpenAIError && (errorMessage.includes("5") || isFormDataError),
    };

    console.error("[DETAILED_ERROR_INFO]", errorDetails);

    // Provide user-friendly error message for suspected OpenAI downtime
    let userFriendlyError = "Transcription processing failed";
    if (errorDetails.suspected_downtime) {
      userFriendlyError =
        "OpenAI transcription service appears to be temporarily unavailable";
    } else if (isNetworkError) {
      userFriendlyError = "Network connectivity issue during transcription";
    }

    return new Response(
      JSON.stringify({
        error: userFriendlyError,
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
