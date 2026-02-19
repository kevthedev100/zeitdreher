"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "../../supabase/client";
import { Clock, Send, Bot, RefreshCw } from "lucide-react";

interface TimeEntry {
  id: string;
  user_id: string;
  area_id: string;
  field_id: string;
  activity_id: string;
  duration: number;
  date: string;
  description: string;
  created_at: string;
  areas: { name: string; color: string };
  fields: { name: string };
  activities: { name: string };
  users: { full_name: string; email: string };
  start_time?: string | null;
}

interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export default function AIChat({ userRole = "member" }) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadCurrentUser();
    // Add initial system message
    setMessages([
      {
        role: "system",
        content:
          "Willkommen beim Zeitdreher AI-Chat! Ich kann dir helfen, deine Zeiteinträge zu analysieren und dir Produktivitätstipps zu geben. Wie kann ich dir heute helfen?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (currentUser || userRole === "admin") {
      loadTimeEntries();
    }
  }, [currentUser, userRole]);

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadTimeEntries = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("time_entries")
        .select(
          `
          *,
          areas(name, color),
          fields(name),
          activities(name),
          users(full_name, email)
        `,
        )
        .order("date", { ascending: false });

      // Filter by user role
      if (userRole === "member" && currentUser) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimeEntries(data || []);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading time entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AIMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare context about time entries for the AI
      const timeContext = prepareTimeContext();

      // Create message history for the AI
      const messageHistory = [
        {
          role: "system",
          content: `Du bist ein hilfreicher Assistent für die Zeiterfassungsplattform Zeitdreher. 
          Du hilfst Benutzern, ihre Zeiteinträge zu analysieren und gibst produktivitätsbezogene Empfehlungen.
          Du antwortest immer auf Deutsch und in einem freundlichen, professionellen Ton.
          
          Hier sind die aktuellen Zeitdaten des Benutzers mit detaillierten Beschreibungen:
          ${timeContext}
          
          Die Benutzerrolle ist: ${userRole}
          
          Nutze die Beschreibungen der Zeiteinträge, um präzisere und hilfreichere Antworten zu geben. Beziehe dich auf konkrete Aktivitäten und Projekte aus den Beschreibungen, wenn du Empfehlungen gibst.
          `,
        },
        ...messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({ role: msg.role, content: msg.content })),
        { role: "user", content: input },
      ];

      // Call the AI chat function
      const response = await supabase.functions.invoke(
        "supabase-functions-ai-chat",
        {
          body: { messages: messageHistory },
        },
      );

      if (response.error) {
        throw new Error(response.error.message || "Fehler bei der KI-Anfrage");
      }

      const aiResponse = response.data;

      // Normalize markdown formatting with asterisks (replace multiple asterisks with proper markdown)
      const content = aiResponse.choices[0].message.content
        .replace(/\*{3,}/g, "**")
        .replace(/\*\*\s*\*\*/g, "**");

      const assistantMessage: AIMessage = {
        role: "assistant",
        content: content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message to AI:", error);

      // Add error message
      const errorMessage: AIMessage = {
        role: "assistant",
        content:
          "Entschuldigung, es gab ein Problem bei der Verarbeitung deiner Anfrage. Bitte versuche es später noch einmal.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const prepareTimeContext = () => {
    if (!timeEntries || timeEntries.length === 0) {
      return "Keine Zeiteinträge vorhanden.";
    }

    // Calculate total hours
    const totalHours = timeEntries.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );

    // Get most recent entries
    const recentEntries = timeEntries.slice(0, 5);

    // Calculate hours by area
    const areaHours: { [key: string]: number } = {};
    timeEntries.forEach((entry) => {
      const areaName = entry.areas?.name || "Unbekannt";
      areaHours[areaName] = (areaHours[areaName] || 0) + entry.duration;
    });

    // Format the context
    let context = `Gesamtstunden: ${totalHours.toFixed(1)}h\n`;
    context += "Stunden nach Bereichen:\n";

    Object.entries(areaHours).forEach(([area, hours]) => {
      context += `- ${area}: ${hours.toFixed(1)}h\n`;
    });

    context += "\nLetzte Einträge mit Beschreibungen:\n";
    recentEntries.forEach((entry) => {
      const area = entry.areas?.name || "Unbekannter Bereich";
      const field = entry.fields?.name || "Unbekanntes Feld";
      const activity = entry.activities?.name || "Unbekannte Aktivität";
      const description = entry.description || "Keine Beschreibung";
      const startTime = entry.start_time ? ` (${entry.start_time})` : "";

      context += `- ${entry.date}: ${area} > ${field} > ${activity} (${entry.duration.toFixed(1)}h${startTime}) - ${description}\n`;
    });

    // Add more detailed information about all entries (limited to 20 for context size)
    if (timeEntries.length > 5) {
      context += "\nAlle Zeiteinträge (bis zu 20):\n";
      timeEntries.slice(0, 20).forEach((entry) => {
        const area = entry.areas?.name || "Unbekannter Bereich";
        const activity = entry.activities?.name || "Unbekannte Aktivität";
        const description = entry.description || "Keine Beschreibung";

        context += `- ${entry.date}: ${area} > ${activity} - ${description}\n`;
      });
    }

    return context;
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white p-1 sm:p-4 lg:p-6">
      <Card className="max-w-4xl mx-auto border-0 shadow-none lg:border lg:shadow-sm">
        <CardHeader className="px-2 py-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bot className="w-5 h-5" />
            Zeitdreher AI-Chat
          </CardTitle>
          <CardDescription className="text-sm">
            Erhalte intelligente Einblicke und Ratschläge zu deinen
            Zeiteinträgen
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="flex flex-col h-[calc(100vh-220px)] sm:h-[600px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mb-3 p-2 sm:p-4 border rounded-lg bg-gray-50">
              {messages.map((message, index) =>
                message.role !== "system" ? (
                  <div
                    key={index}
                    className={`mb-4 ${message.role === "user" ? "text-right" : ""}`}
                  >
                    <div
                      className={`inline-block max-w-[90%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 ${message.role === "user" ? "bg-blue-100 text-blue-800" : "bg-white text-gray-800 border"}`}
                    >
                      <p className="whitespace-pre-wrap">
                        {message.content
                          .split(/\*\*([^*]+)\*\*/)
                          .map((part, i) =>
                            i % 2 === 0 ? (
                              part
                            ) : (
                              <strong key={i}>{part}</strong>
                            ),
                          )}
                      </p>
                      <div
                        className={`text-xs mt-1 ${message.role === "user" ? "text-blue-600" : "text-gray-500"}`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ) : null,
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>KI denkt nach...</span>
                </div>
              )}
              {!isLoading && messages.length === 1 && (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Stelle eine Frage zu deinen Zeiteinträgen</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Stelle eine Frage zu deinen Zeiteinträgen..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading || !dataLoaded}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim() || !dataLoaded}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Data loading status */}
            {!dataLoaded && !isLoading && (
              <div className="text-center mt-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
                Lade Zeitdaten...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
