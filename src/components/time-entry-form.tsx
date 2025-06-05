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
  selectedField?: string;
  selectedActivity?: string;
  editingEntry?: any;
}

export default function TimeEntryForm({
  onSubmit = () => {},
  selectedArea: initialArea = "",
  selectedField: initialField = "",
  selectedActivity: initialActivity = "",
  editingEntry = null,
}: TimeEntryFormProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedArea, setSelectedArea] = useState(initialArea);
  const [selectedField, setSelectedField] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [duration, setDuration] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const supabase = createClient();

  // Load areas from database
  useEffect(() => {
    loadAreas();
  }, []);

  // Handle editingEntry prop to populate form for editing
  useEffect(() => {
    if (editingEntry) {
      console.log("Populating form with editingEntry:", editingEntry);

      setIsEditing(true);
      setEditingEntryId(editingEntry.id);

      // Set the area, field, and activity IDs
      setSelectedArea(editingEntry.area_id);

      // Convert duration from decimal hours to HH:MM:SS format
      if (editingEntry.duration) {
        const hours = Math.floor(editingEntry.duration);
        const minutes = Math.floor((editingEntry.duration - hours) * 60);
        const seconds = Math.floor(
          ((editingEntry.duration - hours) * 60 - minutes) * 60,
        );
        const formattedDuration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        setDuration(formattedDuration);
      }

      setDate(editingEntry.date);
      setStartTime(editingEntry.start_time || "");
      setEndTime(editingEntry.end_time || "");
      setDescription(editingEntry.description || "");

      // Load fields and activities for the selected area and field
      const loadEditingData = async () => {
        if (editingEntry.area_id) {
          const fieldsData = await loadFieldsAndReturn(editingEntry.area_id);
          if (fieldsData && editingEntry.field_id) {
            setSelectedField(editingEntry.field_id);

            const activitiesData = await loadActivitiesAndReturn(
              editingEntry.field_id,
            );
            if (activitiesData && editingEntry.activity_id) {
              setSelectedActivity(editingEntry.activity_id);
            }
          }
        }
      };

      // Load the dependent data after areas are loaded
      if (areas.length > 0) {
        loadEditingData();
      }
    }
  }, [editingEntry, areas]);

  // Listen for populateTimeEntryForm event to handle editing (legacy support)
  useEffect(() => {
    const handlePopulateForm = (event: CustomEvent) => {
      const {
        entryId,
        areaId,
        fieldId,
        activityId,
        duration,
        date,
        startTime,
        endTime,
        description,
      } = event.detail;
      console.log("Populating form for editing:", event.detail);

      setIsEditing(true);
      setEditingEntryId(entryId);
      setSelectedArea(areaId);
      setSelectedField(fieldId);
      setSelectedActivity(activityId);

      // Convert duration from decimal hours to HH:MM:SS format
      if (duration) {
        const hours = Math.floor(duration);
        const minutes = Math.floor((duration - hours) * 60);
        const seconds = Math.floor(((duration - hours) * 60 - minutes) * 60);
        const formattedDuration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        setDuration(formattedDuration);
      }

      setDate(date);
      setStartTime(startTime || "");
      setEndTime(endTime || "");
      setDescription(description || "");
    };

    window.addEventListener(
      "populateTimeEntryForm",
      handlePopulateForm as EventListener,
    );

    return () => {
      window.removeEventListener(
        "populateTimeEntryForm",
        handlePopulateForm as EventListener,
      );
    };
  }, []);

  // Handle initial selections from props with sequential loading
  useEffect(() => {
    console.log("TimeEntryForm props changed:", {
      initialArea,
      initialField,
      initialActivity,
    });

    const setInitialSelections = async () => {
      // Check if any of the initial values are different from current selections
      const areaChanged = initialArea && initialArea !== selectedArea;
      const fieldChanged = initialField && initialField !== selectedField;
      const activityChanged =
        initialActivity && initialActivity !== selectedActivity;

      if (
        (areaChanged || fieldChanged || activityChanged) &&
        areas.length > 0
      ) {
        console.log("Setting initial selections:", {
          areaChanged,
          fieldChanged,
          activityChanged,
        });

        // Always start by setting the area if provided
        if (initialArea) {
          console.log("Setting initial area:", initialArea);
          setSelectedArea(initialArea);

          // Wait a bit for the area to be set, then load and set field
          setTimeout(async () => {
            if (initialField) {
              const fieldsData = await loadFieldsAndReturn(initialArea);
              console.log("Loaded fields for initial area:", fieldsData);

              // Set the initial field if it exists
              const fieldExists = fieldsData.some(
                (field) => field.id === initialField,
              );
              if (fieldExists) {
                console.log("Setting initial field:", initialField);
                setSelectedField(initialField);

                // Wait a bit for the field to be set, then load and set activity
                setTimeout(async () => {
                  if (initialActivity) {
                    const activitiesData =
                      await loadActivitiesAndReturn(initialField);
                    console.log(
                      "Loaded activities for initial field:",
                      activitiesData,
                    );

                    // Set the initial activity if it exists
                    const activityExists = activitiesData.some(
                      (activity) => activity.id === initialActivity,
                    );
                    if (activityExists) {
                      console.log("Setting initial activity:", initialActivity);
                      setSelectedActivity(initialActivity);
                    }
                  }
                }, 100);
              }
            }
          }, 100);
        }
      }
    };

    if ((initialArea || initialField || initialActivity) && areas.length > 0) {
      setInitialSelections();
    }
  }, [
    initialArea,
    initialField,
    initialActivity,
    selectedArea,
    selectedField,
    selectedActivity,
    areas,
  ]);

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

      if (data && data.length > 0) {
        setAreas(data);
        console.log("Loaded areas data:", data.length, "areas");

        // Set initial area if provided
        if (initialArea && data) {
          const area = data.find(
            (a) => a.name.toLowerCase() === initialArea.toLowerCase(),
          );
          if (area) {
            setSelectedArea(area.id);
          }
        }
      } else {
        setAreas([]);
        console.log("No areas found in database");
      }
    } catch (error) {
      console.error("Error loading areas:", error);
      setAreas([]);
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

      if (data && data.length > 0) {
        setFields(data);
        console.log(
          "Loaded fields data for area",
          areaId,
          ":",
          data.length,
          "fields",
        );
      } else {
        setFields([]);
        console.log("No fields found for this area");
      }
    } catch (error) {
      console.error("Error loading fields:", error);
      setFields([]);
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

      if (data && data.length > 0) {
        setActivities(data);
        console.log(
          "Loaded activities data for field",
          fieldId,
          ":",
          data.length,
          "activities",
        );
      } else {
        setActivities([]);
        console.log("No activities found for this field");
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      setActivities([]);
    }
  };

  // Timer functionality
  const startTimer = () => {
    const now = new Date();
    setIsTimerRunning(true);
    setTimerStartTime(now);
    setElapsedTime(0);

    // Set start time automatically with seconds
    const timeString = now.toTimeString().slice(0, 8); // HH:MM:SS format
    setStartTime(timeString);
  };

  const stopTimer = () => {
    if (isTimerRunning && timerStartTime) {
      const endTimeDate = new Date();

      // Set end time automatically with seconds
      const endTimeString = endTimeDate.toTimeString().slice(0, 8); // HH:MM:SS format
      setEndTime(endTimeString);

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

      // Handle time parsing
      if (parsed.startTime) {
        setStartTime(parsed.startTime);
      }

      if (parsed.endTime) {
        setEndTime(parsed.endTime);
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

  // Function to calculate duration from start and end times
  const calculateDurationFromTimes = (
    startTimeStr: string,
    endTimeStr: string,
  ) => {
    if (!startTimeStr || !endTimeStr) return;

    try {
      // Parse time strings (HH:MM:SS or HH:MM)
      const parseTime = (timeStr: string) => {
        const parts = timeStr.split(":").map(Number);
        const hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        const seconds = parts[2] || 0;
        return { hours, minutes, seconds };
      };

      const startTime = parseTime(startTimeStr);
      const endTime = parseTime(endTimeStr);

      // Create Date objects for calculation
      const startDate = new Date();
      startDate.setHours(
        startTime.hours,
        startTime.minutes,
        startTime.seconds,
        0,
      );

      const endDate = new Date();
      endDate.setHours(endTime.hours, endTime.minutes, endTime.seconds, 0);

      // Handle case where end time is next day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      // Calculate duration in milliseconds
      const durationMs = endDate.getTime() - startDate.getTime();

      // Convert to hours, minutes, seconds
      const totalSeconds = Math.floor(durationMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      // Format as HH:MM:SS
      const formattedDuration = `${hours.toString().padStart(1, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      setDuration(formattedDuration);
    } catch (error) {
      console.error("Error calculating duration:", error);
    }
  };

  // Function to format time for display (show seconds only if they exist)
  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return "";

    const parts = timeStr.split(":");
    if (parts.length === 3 && parts[2] !== "00") {
      return timeStr; // Show full HH:MM:SS if seconds are not zero
    } else if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`; // Show HH:MM if no seconds or seconds are zero
    }
    return timeStr;
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

    if (!duration || duration.trim() === "") {
      alert("Bitte geben Sie eine gültige Dauer ein.");
      return;
    }

    // Convert HH:MM:SS format to decimal hours for database storage
    let durationInHours = 0;
    if (duration.includes(":")) {
      const parts = duration.split(":").map(Number);
      const hours = parts[0] || 0;
      const minutes = parts[1] || 0;
      const seconds = parts[2] || 0;
      durationInHours = hours + minutes / 60 + seconds / 3600;
    } else {
      // If it's already a decimal number, use it as is
      durationInHours = parseFloat(duration) || 0;
    }

    if (durationInHours <= 0) {
      alert("Bitte geben Sie eine gültige Dauer ein.");
      return;
    }

    const formData = new FormData();
    formData.append("area_id", selectedArea);
    formData.append("field_id", selectedField);
    formData.append("activity_id", selectedActivity);
    formData.append("duration", durationInHours.toString());
    formData.append("date", date);
    if (startTime) formData.append("start_time", startTime);
    if (endTime) formData.append("end_time", endTime);
    formData.append("description", description);

    try {
      console.log("Submitting time entry with data:", {
        area_id: selectedArea,
        field_id: selectedField,
        activity_id: selectedActivity,
        duration: durationInHours,
        date,
        start_time: startTime,
        end_time: endTime,
        description,
        isEditing,
        editingEntryId,
      });

      let result;

      if (isEditing && editingEntryId) {
        // Update existing entry
        const { data, error } = await supabase
          .from("time_entries")
          .update({
            area_id: selectedArea,
            field_id: selectedField,
            activity_id: selectedActivity,
            duration: durationInHours,
            date,
            start_time: startTime || null,
            end_time: endTime || null,
            description,
          })
          .eq("id", editingEntryId)
          .select()
          .single();

        if (error) throw error;
        result = { success: true, data };
      } else {
        // Create new entry using the server action
        result = await createTimeEntry(formData);
      }

      if (result.success && result.data) {
        console.log("Time entry saved successfully:", result.data);

        // Call the onSubmit callback with the actual database result
        onSubmit(result.data);

        // Show success notification
        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300";
        notification.textContent = isEditing
          ? "Zeiteintrag erfolgreich aktualisiert!"
          : "Zeiteintrag erfolgreich in der Datenbank gespeichert!";
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
        setStartTime("");
        setEndTime("");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
        setIsEditing(false);
        setEditingEntryId(null);

        // Trigger custom event to refresh other components
        const eventName = isEditing ? "timeEntryUpdated" : "timeEntryAdded";
        window.dispatchEvent(
          new CustomEvent(eventName, { detail: result.data }),
        );
      } else {
        throw new Error(result.message || "Failed to create time entry");
      }
    } catch (error) {
      console.error("Error creating time entry:", error);

      // Show error notification
      const errorNotification = document.createElement("div");
      errorNotification.className =
        "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300";
      errorNotification.textContent = `Fehler beim Erstellen des Zeiteintrags: ${error.message || error}`;
      document.body.appendChild(errorNotification);

      // Remove error notification after 5 seconds
      setTimeout(() => {
        errorNotification.style.opacity = "0";
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 300);
      }, 5000);
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
            {isEditing ? (
              <Edit className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            {isEditing ? "Zeiteintrag bearbeiten" : "Zeiteintrag"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Bearbeiten Sie Ihren bestehenden Zeiteintrag"
              : "Erfassen Sie Ihre Arbeitszeit mit Spracheingabe oder manueller Eingabe"}
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

            {/* Time Details */}
            <div className="space-y-4">
              {/* Duration and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Dauer</Label>
                  <Input
                    id="duration"
                    type="text"
                    placeholder={
                      startTime && endTime
                        ? "Wird automatisch berechnet"
                        : "H:MM:SS (z.B. 0:12:17)"
                    }
                    value={duration}
                    disabled={startTime && endTime}
                    className={
                      startTime && endTime ? "bg-gray-100 text-gray-500" : ""
                    }
                    onChange={(e) => {
                      // Only allow manual input if start or end time is missing
                      if (!startTime || !endTime) {
                        setDuration(e.target.value);
                      }
                    }}
                    required
                  />
                  {startTime && endTime && (
                    <p className="text-xs text-gray-500">
                      Automatisch berechnet aus Start- und Endzeit
                    </p>
                  )}
                  {!startTime && !endTime && (
                    <p className="text-xs text-gray-500">
                      Format: H:MM:SS (z.B. 0:12:17 für 12 Min. 17 Sek.)
                    </p>
                  )}
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

              {/* Start and End Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Startzeit</Label>
                  <Input
                    id="startTime"
                    type="time"
                    step="1"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      // Auto-calculate duration if end time is set
                      if (endTime && e.target.value) {
                        calculateDurationFromTimes(e.target.value, endTime);
                      }
                    }}
                    placeholder="09:00:00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Endzeit</Label>
                  <Input
                    id="endTime"
                    type="time"
                    step="1"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      // Auto-calculate duration if start time is set
                      if (startTime && e.target.value) {
                        calculateDurationFromTimes(startTime, e.target.value);
                      }
                    }}
                    placeholder="17:00:00"
                  />
                </div>
              </div>

              {/* Time Range Display */}
              {startTime && endTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      Arbeitszeit: {formatTimeDisplay(startTime)} -{" "}
                      {formatTimeDisplay(endTime)} Uhr
                      {duration && ` (${duration})`}
                    </span>
                  </div>
                </div>
              )}
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
            {(!selectedArea ||
              !selectedField ||
              !selectedActivity ||
              !duration) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Bitte vervollständigen Sie die Eingabe:
                  </span>
                </div>
                <ul className="mt-2 text-sm text-yellow-600 space-y-1">
                  {!selectedArea && <li>• Bereich auswählen</li>}
                  {selectedArea && !selectedField && <li>• Feld auswählen</li>}
                  {selectedField && !selectedActivity && (
                    <li>• Aktivität auswählen</li>
                  )}
                  {!duration && (
                    <li>
                      • Start- und Endzeit eingeben (Dauer wird automatisch
                      berechnet)
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                size="lg"
                disabled={
                  !selectedArea ||
                  !selectedField ||
                  !selectedActivity ||
                  !duration
                }
              >
                {isEditing
                  ? "Zeiteintrag aktualisieren"
                  : "Zeiteintrag erfassen"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    // Reset form to new entry mode
                    setIsEditing(false);
                    setEditingEntryId(null);
                    setSelectedArea("");
                    setSelectedField("");
                    setSelectedActivity("");
                    setFields([]);
                    setActivities([]);
                    setDuration("");
                    setStartTime("");
                    setEndTime("");
                    setDescription("");
                    setDate(new Date().toISOString().split("T")[0]);
                  }}
                >
                  Abbrechen
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
