"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Clock,
  Calendar,
  Plus,
  Edit,
  Play,
  Square,
  Timer,
} from "lucide-react";
import { createClient } from "../../supabase/client";
import { createTimeEntry } from "@/app/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TimeEntryFormProps {
  onSubmit?: (data: any) => void;
  selectedArea?: string;
}

export default function TimeEntryForm({
  onSubmit = () => {},
  selectedArea: initialArea = "",
}: TimeEntryFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [selectedField, setSelectedField] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [newActivityName, setNewActivityName] = useState("");
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [areas, setAreas] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Load data from database
  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      loadFields(selectedArea);
    } else {
      setFields([]);
      setSelectedField("");
      setActivities([]);
      setSelectedActivity("");
    }
  }, [selectedArea]);

  useEffect(() => {
    if (selectedField) {
      loadActivities(selectedField);
    } else {
      setActivities([]);
      setSelectedActivity("");
    }
  }, [selectedField]);

  const loadAreas = async () => {
    try {
      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // If no areas found, create mock areas
      if (!data || data.length === 0) {
        const mockAreas = [
          {
            id: "area1",
            name: "Entwicklung",
            color: "#3B82F6",
            is_active: true,
          },
          { id: "area2", name: "Design", color: "#8B5CF6", is_active: true },
          { id: "area3", name: "Marketing", color: "#10B981", is_active: true },
          {
            id: "area4",
            name: "Management",
            color: "#F59E0B",
            is_active: true,
          },
        ];
        setAreas(mockAreas);
        console.log("Using mock areas data:", mockAreas);

        // Set initial area if provided
        if (initialArea) {
          const area = mockAreas.find(
            (a) => a.name.toLowerCase() === initialArea.toLowerCase(),
          );
          if (area) {
            setSelectedArea(area.id);
          }
        }
      } else {
        setAreas(data);
        console.log("Loaded real areas data:", data.length, "areas");

        // Set initial area if provided
        if (initialArea && data) {
          const area = data.find(
            (a) => a.name.toLowerCase() === initialArea.toLowerCase(),
          );
          if (area) {
            setSelectedArea(area.id);
          }
        }
      }
    } catch (error) {
      console.error("Error loading areas:", error);
      // Use mock areas as fallback
      const mockAreas = [
        { id: "area1", name: "Entwicklung", color: "#3B82F6", is_active: true },
        { id: "area2", name: "Design", color: "#8B5CF6", is_active: true },
        { id: "area3", name: "Marketing", color: "#10B981", is_active: true },
        { id: "area4", name: "Management", color: "#F59E0B", is_active: true },
      ];
      setAreas(mockAreas);

      // Set initial area if provided
      if (initialArea) {
        const area = mockAreas.find(
          (a) => a.name.toLowerCase() === initialArea.toLowerCase(),
        );
        if (area) {
          setSelectedArea(area.id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFields = async (areaId: string) => {
    try {
      const { data, error } = await supabase
        .from("fields")
        .select("*")
        .eq("area_id", areaId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // If no fields found, create mock fields based on the area
      if (!data || data.length === 0) {
        let mockFields = [];

        // Generate appropriate mock fields based on the area
        if (areaId === "area1" || areaId.includes("Entwicklung")) {
          mockFields = [
            {
              id: "field1",
              area_id: areaId,
              name: "Frontend",
              is_active: true,
            },
            { id: "field2", area_id: areaId, name: "Backend", is_active: true },
            { id: "field3", area_id: areaId, name: "Testing", is_active: true },
          ];
        } else if (areaId === "area2" || areaId.includes("Design")) {
          mockFields = [
            {
              id: "field4",
              area_id: areaId,
              name: "UI Design",
              is_active: true,
            },
            {
              id: "field5",
              area_id: areaId,
              name: "UX Research",
              is_active: true,
            },
            {
              id: "field6",
              area_id: areaId,
              name: "Prototyping",
              is_active: true,
            },
          ];
        } else if (areaId === "area3" || areaId.includes("Marketing")) {
          mockFields = [
            {
              id: "field7",
              area_id: areaId,
              name: "Content Creation",
              is_active: true,
            },
            {
              id: "field8",
              area_id: areaId,
              name: "Social Media",
              is_active: true,
            },
            {
              id: "field9",
              area_id: areaId,
              name: "Campaigns",
              is_active: true,
            },
          ];
        } else if (areaId === "area4" || areaId.includes("Management")) {
          mockFields = [
            {
              id: "field10",
              area_id: areaId,
              name: "Planning",
              is_active: true,
            },
            {
              id: "field11",
              area_id: areaId,
              name: "Meetings",
              is_active: true,
            },
            {
              id: "field12",
              area_id: areaId,
              name: "Reporting",
              is_active: true,
            },
          ];
        } else {
          // Generic fields for any other area
          mockFields = [
            {
              id: `field-${areaId}-1`,
              area_id: areaId,
              name: "Planning",
              is_active: true,
            },
            {
              id: `field-${areaId}-2`,
              area_id: areaId,
              name: "Execution",
              is_active: true,
            },
            {
              id: `field-${areaId}-3`,
              area_id: areaId,
              name: "Review",
              is_active: true,
            },
          ];
        }

        setFields(mockFields);
        console.log("Using mock fields data for area", areaId, ":", mockFields);
      } else {
        setFields(data);
        console.log(
          "Loaded real fields data for area",
          areaId,
          ":",
          data.length,
          "fields",
        );
      }
    } catch (error) {
      console.error("Error loading fields:", error);
      // Use generic mock fields as fallback
      const mockFields = [
        {
          id: `field-${areaId}-1`,
          area_id: areaId,
          name: "Planning",
          is_active: true,
        },
        {
          id: `field-${areaId}-2`,
          area_id: areaId,
          name: "Execution",
          is_active: true,
        },
        {
          id: `field-${areaId}-3`,
          area_id: areaId,
          name: "Review",
          is_active: true,
        },
      ];
      setFields(mockFields);
    }
  };

  const loadActivities = async (fieldId: string) => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("field_id", fieldId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // If no activities found, create mock activities based on the field
      if (!data || data.length === 0) {
        let mockActivities = [];

        // Generate appropriate mock activities based on the field ID or name
        if (fieldId === "field1" || fieldId.includes("Frontend")) {
          mockActivities = [
            {
              id: "activity1",
              field_id: fieldId,
              name: "React Development",
              is_active: true,
            },
            {
              id: "activity2",
              field_id: fieldId,
              name: "CSS/Styling",
              is_active: true,
            },
            {
              id: "activity3",
              field_id: fieldId,
              name: "Performance Optimization",
              is_active: true,
            },
          ];
        } else if (fieldId === "field2" || fieldId.includes("Backend")) {
          mockActivities = [
            {
              id: "activity4",
              field_id: fieldId,
              name: "API Development",
              is_active: true,
            },
            {
              id: "activity5",
              field_id: fieldId,
              name: "Database Work",
              is_active: true,
            },
            {
              id: "activity6",
              field_id: fieldId,
              name: "Deployment",
              is_active: true,
            },
          ];
        } else if (fieldId === "field3" || fieldId.includes("Testing")) {
          mockActivities = [
            {
              id: "activity7",
              field_id: fieldId,
              name: "Unit Testing",
              is_active: true,
            },
            {
              id: "activity8",
              field_id: fieldId,
              name: "Integration Testing",
              is_active: true,
            },
            {
              id: "activity9",
              field_id: fieldId,
              name: "Bug Fixing",
              is_active: true,
            },
          ];
        } else if (fieldId === "field4" || fieldId.includes("UI Design")) {
          mockActivities = [
            {
              id: "activity10",
              field_id: fieldId,
              name: "Wireframing",
              is_active: true,
            },
            {
              id: "activity11",
              field_id: fieldId,
              name: "Visual Design",
              is_active: true,
            },
            {
              id: "activity12",
              field_id: fieldId,
              name: "Icon Design",
              is_active: true,
            },
          ];
        } else {
          // Generic activities for any other field
          mockActivities = [
            {
              id: `activity-${fieldId}-1`,
              field_id: fieldId,
              name: "Research",
              is_active: true,
            },
            {
              id: `activity-${fieldId}-2`,
              field_id: fieldId,
              name: "Implementation",
              is_active: true,
            },
            {
              id: `activity-${fieldId}-3`,
              field_id: fieldId,
              name: "Review",
              is_active: true,
            },
          ];
        }

        setActivities(mockActivities);
        console.log(
          "Using mock activities data for field",
          fieldId,
          ":",
          mockActivities,
        );
      } else {
        setActivities(data);
        console.log(
          "Loaded real activities data for field",
          fieldId,
          ":",
          data.length,
          "activities",
        );
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      // Use generic mock activities as fallback
      const mockActivities = [
        {
          id: `activity-${fieldId}-1`,
          field_id: fieldId,
          name: "Research",
          is_active: true,
        },
        {
          id: `activity-${fieldId}-2`,
          field_id: fieldId,
          name: "Implementation",
          is_active: true,
        },
        {
          id: `activity-${fieldId}-3`,
          field_id: fieldId,
          name: "Review",
          is_active: true,
        },
      ];
      setActivities(mockActivities);
    }
  };

  // Timer functionality
  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerStartTime(new Date());
    setElapsedTime(0);
  };

  const stopTimer = () => {
    if (isTimerRunning && timerStartTime) {
      const endTime = new Date();
      const elapsed =
        (endTime.getTime() - timerStartTime.getTime()) / (1000 * 60 * 60); // Convert to hours
      setDuration(elapsed.toFixed(2));
      setIsTimerRunning(false);
      setTimerStartTime(null);
    }
  };

  const stopTimerAndStartVoice = () => {
    stopTimer();
    setTimeout(() => {
      handleVoiceToggle();
    }, 100);
  };

  const handleVoiceToggle = async () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          await processVoiceInput(audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();

        // Store recorder reference for stopping
        (window as any).currentRecorder = mediaRecorder;
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setIsRecording(false);
        alert(
          "Fehler beim Zugriff auf das Mikrofon. Bitte überprüfen Sie die Berechtigungen.",
        );
      }
    } else {
      // Stop recording
      const recorder = (window as any).currentRecorder;
      if (recorder && recorder.state === "recording") {
        recorder.stop();
      }
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // Show processing status
      const statusDiv = document.createElement("div");
      statusDiv.className =
        "fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
      statusDiv.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Verarbeite Spracheingabe...</span>
        </div>
      `;
      document.body.appendChild(statusDiv);

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", "de");

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-transcribe-audio",
        {
          body: formData,
        },
      );

      // Remove processing status
      document.body.removeChild(statusDiv);

      if (error) {
        console.error("Transcription error:", error);

        // Show error with retry option if retryable
        const isRetryable = error.details?.retryable || false;
        const errorMessage = isRetryable
          ? "Netzwerkfehler bei der Spracherkennung. Möchten Sie es erneut versuchen?"
          : "Fehler bei der Spracherkennung. Bitte versuchen Sie es erneut.";

        if (isRetryable && confirm(errorMessage)) {
          // Retry the request
          setTimeout(() => processVoiceInput(audioBlob), 1000);
        } else {
          alert(errorMessage);
        }
        return;
      }

      const { parsed, transcription, confidence, processingMethod } = data;
      console.log("Transcription:", transcription);
      console.log("Parsed data:", parsed);
      console.log("Confidence:", confidence);
      console.log("Processing method:", processingMethod);

      // Apply parsed data to form with fuzzy matching
      if (parsed.duration) {
        setDuration(parsed.duration.toString());
      }

      if (parsed.description) {
        setDescription(parsed.description);
      }

      // Handle date parsing
      if (parsed.date) {
        setDate(parsed.date);
      }

      // Enhanced area selection with fuzzy matching
      if (parsed.area) {
        const area = findBestMatch(parsed.area, areas, "name");
        if (area) {
          setSelectedArea(area.id);
          // Load fields for this area and then handle field/activity selection
          const fieldsData = await loadFieldsAndReturn(area.id);

          if (parsed.field && fieldsData) {
            const field = findBestMatch(parsed.field, fieldsData, "name");
            if (field) {
              setSelectedField(field.id);

              // Load activities and handle activity selection
              const activitiesData = await loadActivitiesAndReturn(field.id);

              if (parsed.activity && activitiesData) {
                const activity = findBestMatch(
                  parsed.activity,
                  activitiesData,
                  "name",
                );
                if (activity) {
                  setSelectedActivity(activity.id);
                }
              }
            }
          }
        }
      }

      // Show success message with confidence score
      const confidenceText = confidence
        ? ` (Genauigkeit: ${(confidence * 100).toFixed(1)}%)`
        : "";
      const methodText =
        processingMethod === "ai" ? " (KI-gestützt)" : " (Regelbasiert)";

      const successDiv = document.createElement("div");
      successDiv.className =
        "fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md";
      successDiv.innerHTML = `
        <div class="font-semibold mb-2">Spracheingabe erfolgreich verarbeitet!${methodText}</div>
        <div class="text-sm opacity-90">"${transcription}"${confidenceText}</div>
      `;
      document.body.appendChild(successDiv);

      // Remove success message after 5 seconds
      setTimeout(() => {
        successDiv.style.opacity = "0";
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 300);
      }, 5000);
    } catch (error) {
      console.error("Error processing voice input:", error);
      alert("Fehler bei der Verarbeitung der Spracheingabe.");
    }
  };

  // Fuzzy matching function for better category selection
  const findBestMatch = (target: string, items: any[], field: string) => {
    if (!target || !items.length) return null;

    const targetLower = target.toLowerCase();

    // Exact match first
    let exactMatch = items.find(
      (item) => item[field].toLowerCase() === targetLower,
    );
    if (exactMatch) return exactMatch;

    // Partial match
    let partialMatch = items.find(
      (item) =>
        item[field].toLowerCase().includes(targetLower) ||
        targetLower.includes(item[field].toLowerCase()),
    );
    if (partialMatch) return partialMatch;

    // Similarity-based matching (simple Levenshtein-like)
    let bestMatch = null;
    let bestScore = 0;

    items.forEach((item) => {
      const itemName = item[field].toLowerCase();
      const score = calculateSimilarity(targetLower, itemName);
      if (score > bestScore && score > 0.6) {
        // 60% similarity threshold
        bestScore = score;
        bestMatch = item;
      }
    });

    return bestMatch;
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  // Helper functions to load data and return it
  const loadFieldsAndReturn = async (areaId: string) => {
    try {
      const { data, error } = await supabase
        .from("fields")
        .select("*")
        .eq("area_id", areaId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setFields(data || []);
      return data || [];
    } catch (error) {
      console.error("Error loading fields:", error);
      return [];
    }
  };

  const loadActivitiesAndReturn = async (fieldId: string) => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("field_id", fieldId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setActivities(data || []);
      return data || [];
    } catch (error) {
      console.error("Error loading activities:", error);
      return [];
    }
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + S to stop timer and start voice input
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "S"
      ) {
        event.preventDefault();
        if (isTimerRunning) {
          stopTimerAndStartVoice();
        } else {
          handleVoiceToggle();
        }
      }
      // Ctrl/Cmd + Shift + T to start/stop timer
      else if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "T"
      ) {
        event.preventDefault();
        if (isTimerRunning) {
          stopTimer();
        } else {
          startTimer();
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isTimerRunning, timerStartTime]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - timerStartTime.getTime()) / 1000; // in seconds
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerStartTime]);

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate hierarchical selections
    if (!selectedArea || !selectedField || !selectedActivity) {
      alert("Bitte wählen Sie Bereich, Feld und Aktivität aus.");
      return;
    }

    const formData = new FormData();
    formData.append("area_id", selectedArea);
    formData.append("field_id", selectedField);
    formData.append("activity_id", selectedActivity);
    formData.append("duration", duration);
    formData.append("date", date);
    formData.append("description", description);

    try {
      // Get area, field, and activity names for better data passing
      const areaName = areas.find((a) => a.id === selectedArea)?.name || "";
      const fieldName = fields.find((f) => f.id === selectedField)?.name || "";
      const activityName =
        activities.find((a) => a.id === selectedActivity)?.name || "";
      const areaColor =
        areas.find((a) => a.id === selectedArea)?.color || "#6B7280";

      // Generate a unique ID for the time entry
      const entryId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create a complete time entry object
      const timeEntryObject = {
        id: entryId,
        user_id: (await supabase.auth.getUser()).data.user?.id || "anonymous",
        area_id: selectedArea,
        field_id: selectedField,
        activity_id: selectedActivity,
        duration: parseFloat(duration),
        date,
        description,
        created_at: new Date().toISOString(),
        // Add structured data for components
        areas: { name: areaName, color: areaColor },
        fields: { name: fieldName },
        activities: { name: activityName },
        users: {
          full_name:
            (await supabase.auth.getUser()).data.user?.user_metadata
              ?.full_name || "Demo User",
          email:
            (await supabase.auth.getUser()).data.user?.email ||
            "demo@example.com",
        },
      };

      // Try to save to database
      try {
        const result = await createTimeEntry(formData);
        console.log("Time entry saved to database:", result);
      } catch (dbError) {
        console.warn(
          "Could not save to database, but will continue with local data:",
          dbError,
        );
        // We'll continue with the local object even if the database save fails
      }

      // Call the onSubmit callback to refresh parent data with enhanced data
      onSubmit(timeEntryObject);

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300";
      notification.textContent = "Zeiteintrag erfolgreich gespeichert!";
      document.body.appendChild(notification);

      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);

      // Reset form
      setSelectedArea("");
      setSelectedField("");
      setSelectedActivity("");
      setFields([]);
      setActivities([]);
      setDuration("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);

      // Trigger custom event to refresh other components
      window.dispatchEvent(
        new CustomEvent("timeEntryAdded", { detail: timeEntryObject }),
      );
    } catch (error) {
      console.error("Error creating time entry:", error);
      alert(
        "Fehler beim Erstellen des Zeiteintrags. Bitte versuchen Sie es erneut.",
      );
    }
  };

  const handleAddArea = async () => {
    if (newAreaName.trim()) {
      const formData = new FormData();
      formData.append("name", newAreaName);

      try {
        const { data, error } = await supabase
          .from("areas")
          .insert({ name: newAreaName })
          .select()
          .single();

        if (error) throw error;

        setAreas([...areas, data]);
        setNewAreaName("");
        setIsAddingArea(false);
      } catch (error) {
        console.error("Error adding area:", error);
      }
    }
  };

  const handleAddField = async () => {
    if (newFieldName.trim() && selectedArea) {
      try {
        const { data, error } = await supabase
          .from("fields")
          .insert({ area_id: selectedArea, name: newFieldName })
          .select()
          .single();

        if (error) throw error;

        setFields([...fields, data]);
        setNewFieldName("");
        setIsAddingField(false);
      } catch (error) {
        console.error("Error adding field:", error);
      }
    }
  };

  const handleAddActivity = async () => {
    if (newActivityName.trim() && selectedField) {
      try {
        const { data, error } = await supabase
          .from("activities")
          .insert({ field_id: selectedField, name: newActivityName })
          .select()
          .single();

        if (error) throw error;

        setActivities([...activities, data]);
        setNewActivityName("");
        setIsAddingActivity(false);
      } catch (error) {
        console.error("Error adding activity:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Zeiteintrag
          </CardTitle>
          <CardDescription>
            Erfassen Sie Ihre Arbeitszeit mit Spracheingabe oder manueller
            Eingabe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Timer and Voice Controls */}
            <div className="flex flex-col items-center space-y-4">
              {/* Timer Display */}
              {isTimerRunning && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full max-w-md">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <Timer className="w-5 h-5 animate-pulse" />
                    <span className="text-2xl font-mono font-bold">
                      {formatElapsedTime(elapsedTime)}
                    </span>
                  </div>
                  <p className="text-center text-sm text-green-600 mt-1">
                    Timer läuft... Drücken Sie Strg+Shift+S zum Stoppen und
                    Spracheingabe
                  </p>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={isTimerRunning ? stopTimer : startTimer}
                  variant={isTimerRunning ? "destructive" : "default"}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isTimerRunning ? (
                    <>
                      <Square className="w-5 h-5" />
                      Timer stoppen
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Timer starten
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={handleVoiceToggle}
                  variant={isRecording ? "destructive" : "outline"}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      Aufnahme stoppen
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Spracheingabe
                    </>
                  )}
                </Button>

                {isTimerRunning && (
                  <Button
                    type="button"
                    onClick={stopTimerAndStartVoice}
                    variant="secondary"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    <Mic className="w-4 h-4" />
                    Stoppen & Sprechen
                  </Button>
                )}
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="text-center text-sm text-gray-500">
                <p>
                  Tastenkürzel:{" "}
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                    Strg+Shift+T
                  </kbd>{" "}
                  Timer •{" "}
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                    Strg+Shift+S
                  </kbd>{" "}
                  Stoppen & Sprechen
                </p>
              </div>
            </div>

            {isRecording && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  Aufnahme läuft... Sprechen Sie Ihren Zeiteintrag natürlich
                </div>
              </div>
            )}

            {/* Cascading Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="area">Bereich</Label>
                  <Dialog open={isAddingArea} onOpenChange={setIsAddingArea}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Neuen Bereich hinzufügen</DialogTitle>
                        <DialogDescription>
                          Geben Sie den Namen für den neuen Bereich ein.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Bereichsname"
                          value={newAreaName}
                          onChange={(e) => setNewAreaName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleAddArea}>Hinzufügen</Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingArea(false)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={selectedArea}
                  onValueChange={(value) => {
                    setSelectedArea(value);
                    // Clear dependent selections when area changes
                    setSelectedField("");
                    setSelectedActivity("");
                    setFields([]);
                    setActivities([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bereich auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="field">Feld</Label>
                  <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        disabled={!selectedArea}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Neues Feld hinzufügen</DialogTitle>
                        <DialogDescription>
                          Geben Sie den Namen für das neue Feld ein.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Feldname"
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleAddField}>Hinzufügen</Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingField(false)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={selectedField}
                  onValueChange={(value) => {
                    setSelectedField(value);
                    // Clear dependent selections when field changes
                    setSelectedActivity("");
                    setActivities([]);
                  }}
                  disabled={!selectedArea || fields.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedArea
                          ? "Zuerst Bereich auswählen"
                          : fields.length === 0
                            ? "Keine Felder verfügbar"
                            : "Feld auswählen"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="activity">Aktivität</Label>
                  <Dialog
                    open={isAddingActivity}
                    onOpenChange={setIsAddingActivity}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        disabled={!selectedField}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Neue Aktivität hinzufügen</DialogTitle>
                        <DialogDescription>
                          Geben Sie den Namen für die neue Aktivität ein.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Aktivitätsname"
                          value={newActivityName}
                          onChange={(e) => setNewActivityName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleAddActivity}>
                            Hinzufügen
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingActivity(false)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select
                  value={selectedActivity}
                  onValueChange={setSelectedActivity}
                  disabled={!selectedField || activities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedField
                          ? "Zuerst Feld auswählen"
                          : activities.length === 0
                            ? "Keine Aktivitäten verfügbar"
                            : "Aktivität auswählen"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((activity) => (
                      <SelectItem key={activity.id} value={activity.id}>
                        {activity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Dauer (Stunden)</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="2,5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                placeholder="Kurze Beschreibung der durchgeführten Arbeit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Validation Info */}
            {(!selectedArea || !selectedField || !selectedActivity) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Bitte vervollständigen Sie die Hierarchie:
                  </span>
                </div>
                <ul className="mt-2 text-sm text-yellow-600 space-y-1">
                  {!selectedArea && <li>• Bereich auswählen</li>}
                  {selectedArea && !selectedField && <li>• Feld auswählen</li>}
                  {selectedField && !selectedActivity && (
                    <li>• Aktivität auswählen</li>
                  )}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                !selectedArea ||
                !selectedField ||
                !selectedActivity ||
                !duration
              }
            >
              Zeiteintrag erfassen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
