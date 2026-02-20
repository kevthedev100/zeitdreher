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
  // Optional userId to load categories for a specific user (for admin/manager editing)
  specificUserId?: string;
}

export default function TimeEntryForm({
  onSubmit = () => {},
  selectedArea: initialArea = "",
  selectedField: initialField = "",
  selectedActivity: initialActivity = "",
  editingEntry = null as any,
  specificUserId = null as any,
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
  const [entryOwnerId, setEntryOwnerId] = useState<string | null>(null);
  
  // Voice confirmation states
  const [showActivityConfirmation, setShowActivityConfirmation] = useState(false);
  const [activityConfirmationData, setActivityConfirmationData] = useState<any>(null);
  const [showNewActivitySuggestion, setShowNewActivitySuggestion] = useState(false);
  const [newActivitySuggestionData, setNewActivitySuggestionData] = useState<any>(null);

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
      
      // Store the entry owner's user ID for loading their categories
      if (editingEntry.entry_owner_id) {
        console.log("Setting entry owner ID:", editingEntry.entry_owner_id);
        setEntryOwnerId(editingEntry.entry_owner_id);
      } else if (editingEntry.specificUserId) {
        console.log("Setting entry owner ID from specificUserId:", editingEntry.specificUserId);
        setEntryOwnerId(editingEntry.specificUserId);
      } else if (specificUserId) {
        console.log("Setting entry owner ID from prop specificUserId:", specificUserId);
        setEntryOwnerId(specificUserId);
      } else {
        console.log("No specific entry owner ID found, will use current user");
        setEntryOwnerId(null);
      }

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
  }, [editingEntry, areas, specificUserId]);

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
    console.log("[TIME-ENTRY-FORM] Props changed:", {
      initialArea,
      initialField,
      initialActivity,
      areasLoaded: areas.length > 0,
      currentSelections: {
        selectedArea,
        selectedField,
        selectedActivity,
      },
    });

    const setInitialSelections = async () => {
      // Only proceed if we have areas loaded and at least one initial value
      if (!areas.length || (!initialArea && !initialField && !initialActivity)) {
        console.log("[TIME-ENTRY-FORM] No areas loaded or no initial values provided");
        return;
      }

      // Check if we need to set initial selections
      const needsAreaSelection = initialArea && initialArea !== selectedArea;
      const needsFieldSelection = initialField && initialField !== selectedField;
      const needsActivitySelection = initialActivity && initialActivity !== selectedActivity;

      console.log("[TIME-ENTRY-FORM] Selection needs:", {
        needsAreaSelection,
        needsFieldSelection,
        needsActivitySelection,
      });

      // If we need to set any selection, start from the beginning of the hierarchy
      if (needsAreaSelection || needsFieldSelection || needsActivitySelection) {
        console.log("[TIME-ENTRY-FORM] Starting hierarchical selection process");

        // Step 1: Set area if provided
        if (initialArea) {
          console.log("[TIME-ENTRY-FORM] Setting area:", initialArea);
          setSelectedArea(initialArea);

          // Wait a bit for React to update
          await new Promise(resolve => setTimeout(resolve, 100));

          // Step 2: Load fields for the area
          console.log("[TIME-ENTRY-FORM] Loading fields for area:", initialArea);
          const fieldsData = await loadFieldsAndReturn(initialArea);
          console.log("[TIME-ENTRY-FORM] Loaded fields:", fieldsData.length);

          // Step 3: Set field if provided and exists
          if (initialField && fieldsData.length > 0) {
            const fieldExists = fieldsData.some(field => field.id === initialField);
            if (fieldExists) {
              console.log("[TIME-ENTRY-FORM] Setting field:", initialField);
              setSelectedField(initialField);

              // Wait a bit for React to update
              await new Promise(resolve => setTimeout(resolve, 100));

              // Step 4: Load activities for the field
              console.log("[TIME-ENTRY-FORM] Loading activities for field:", initialField);
              const activitiesData = await loadActivitiesAndReturn(initialField);
              console.log("[TIME-ENTRY-FORM] Loaded activities:", activitiesData.length);

              // Step 5: Set activity if provided and exists
              if (initialActivity && activitiesData.length > 0) {
                const activityExists = activitiesData.some(activity => activity.id === initialActivity);
                if (activityExists) {
                  console.log("[TIME-ENTRY-FORM] Setting activity:", initialActivity);
                  setSelectedActivity(initialActivity);
                } else {
                  console.log("[TIME-ENTRY-FORM] Activity not found in loaded activities:", initialActivity);
                }
              }
            } else {
              console.log("[TIME-ENTRY-FORM] Field not found in loaded fields:", initialField);
            }
          }
        }

        console.log("[TIME-ENTRY-FORM] Hierarchical selection process completed");
      }
    };

    // Only run if we have areas loaded and initial values
    if (areas.length > 0 && (initialArea || initialField || initialActivity)) {
      setInitialSelections();
    }
  }, [
    initialArea,
    initialField,
    initialActivity,
    areas.length, // Use length instead of the whole array to avoid unnecessary re-runs
  ]);

  useEffect(() => {
    if (selectedArea) {
      console.log("[TIME-ENTRY-FORM] Area changed, loading fields for:", selectedArea);
      const loadFieldsData = async () => {
        await loadFields(selectedArea);
      };
      loadFieldsData();
    } else {
      console.log("[TIME-ENTRY-FORM] No area selected, clearing fields and activities");
      setFields([]);
      setSelectedField("");
      setActivities([]);
      setSelectedActivity("");
    }
  }, [selectedArea]);

  useEffect(() => {
    if (selectedField) {
      console.log("[TIME-ENTRY-FORM] Field changed, loading activities for:", selectedField);
      const loadActivitiesData = async () => {
        await loadActivities(selectedField);
      };
      loadActivitiesData();
    } else {
      console.log("[TIME-ENTRY-FORM] No field selected, clearing activities");
      setActivities([]);
      setSelectedActivity("");
    }
  }, [selectedField]);

  const loadAreas = async () => {
    try {
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get current user's role to determine access level
      const { data: currentUserData } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const currentUserRole = currentUserData?.role || "member";
      console.log("Current user role for areas loading:", currentUserRole);

      // Determine which user ID to use for loading categories
      const targetUserId = entryOwnerId || specificUserId;
      console.log("Loading areas for target user ID:", targetUserId, "(current user:", user.id, ")");

      let query = supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .order("name");

      // If we have a specific target user (editing someone else's entry), filter by that user
      // Otherwise, load current user's areas
      if (targetUserId && currentUserRole === "admin") {
        // Admin/Manager editing another user's entry - load that user's areas
        query = query.eq("user_id", targetUserId);
        console.log("Admin/Manager loading areas for user:", targetUserId);
      } else {
        // Load current user's areas
        const { data: currentUserRecord } = await supabase
          .from("users")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (currentUserRecord) {
          query = query.eq("user_id", currentUserRecord.id);
          console.log("Loading areas for current user:", currentUserRecord.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database error loading areas:", error);
        throw error;
      }

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
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get current user's role to determine access level
      const { data: currentUserData } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const currentUserRole = currentUserData?.role || "member";
      
      // Determine which user ID to use for loading categories
      const targetUserId = entryOwnerId || specificUserId;
      console.log("Loading fields for area ID:", areaId, "target user:", targetUserId);

      let query = supabase
        .from("fields")
        .select("*")
        .eq("area_id", areaId)
        .eq("is_active", true)
        .order("name");

      // If we have a specific target user (editing someone else's entry), filter by that user
      // Otherwise, load current user's fields
      if (targetUserId && currentUserRole === "admin") {
        // Admin/Manager editing another user's entry - load that user's fields
        query = query.eq("user_id", targetUserId);
        console.log("Admin/Manager loading fields for user:", targetUserId);
      } else {
        // Load current user's fields
        const { data: currentUserRecord } = await supabase
          .from("users")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (currentUserRecord) {
          query = query.eq("user_id", currentUserRecord.id);
          console.log("Loading fields for current user:", currentUserRecord.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database error loading fields:", error);
        throw error;
      }
      
      console.log(
        "Fields loaded successfully:",
        data?.length || 0,
        "fields",
      );
      setFields(data || []);
      return data || [];
    } catch (error) {
      console.error("Error loading fields:", error);
      return [];
    }
  };

  const loadActivities = async (fieldId: string) => {
    try {
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get current user's role to determine access level
      const { data: currentUserData } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const currentUserRole = currentUserData?.role || "member";
      
      // Determine which user ID to use for loading categories
      const targetUserId = entryOwnerId || specificUserId;
      console.log("Loading activities for field ID:", fieldId, "target user:", targetUserId);

      let query = supabase
        .from("activities")
        .select("*")
        .eq("field_id", fieldId)
        .eq("is_active", true)
        .order("name");

      // If we have a specific target user (editing someone else's entry), filter by that user
      // Otherwise, load current user's activities
      if (targetUserId && currentUserRole === "admin") {
        // Admin/Manager editing another user's entry - load that user's activities
        query = query.eq("user_id", targetUserId);
        console.log("Admin/Manager loading activities for user:", targetUserId);
      } else {
        // Load current user's activities
        const { data: currentUserRecord } = await supabase
          .from("users")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (currentUserRecord) {
          query = query.eq("user_id", currentUserRecord.id);
          console.log("Loading activities for current user:", currentUserRecord.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database error loading activities:", error);
        throw error;
      }
      
      console.log(
        "Activities loaded successfully:",
        data?.length || 0,
        "activities",
      );
      setActivities(data || []);
      return data || [];
    } catch (error) {
      console.error("Error loading activities:", error);
      return [];
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

  // Process voice input
  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // Get current user ID for filtering
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated, cannot process voice input");
        alert("Bitte melden Sie sich an, um die Spracheingabe zu nutzen.");
        return;
      }
      console.log("Processing voice input for user ID:", user.id);

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
      formData.append("user_id", user.id); // Pass user ID to the transcription function

      // Get the session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session found");
      }

      // Use direct fetch to ensure proper multipart/form-data content type
      const response = await fetch(
        `${(supabase as any).supabaseUrl}/functions/v1/supabase-functions-transcribe-audio`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": (supabase as any).supabaseKey,
          },
          body: formData,
        }
      );

      let data, error;
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          error = errorJson;
        } catch {
          error = { message: errorText, status: response.status };
        }
      } else {
        data = await response.json();
      }

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

      const junkPhrases = [
        "untertitel der amara.org-community",
        "untertitel von",
        "amara.org",
        "copyright",
        "www.mooji.org",
      ];
      const isJunk = !transcription?.trim() || junkPhrases.some((p) => transcription.trim().toLowerCase().includes(p));
      if (isJunk) {
        alert("Aufnahme nicht erkannt. Bitte versuche es erneut oder überprüfe dein Mikrofon.");
        return;
      }

      // Apply parsed data to form with enhanced logic
      console.log(
        "Processing parsed voice data for user",
        user.id,
        ":",
        parsed,
      );

      // IMPORTANT: Don't reset form fields anymore to preserve existing selections
      // Only reset fields if we're going to set them based on the voice input
      const shouldResetHierarchy = parsed.activity && !selectedActivity;

      // Handle duration - convert to HH:MM:SS format if it's a decimal number
      if (parsed.duration && typeof parsed.duration === "number") {
        const hours = Math.floor(parsed.duration);
        const minutes = Math.floor((parsed.duration - hours) * 60);
        const seconds = Math.floor(
          ((parsed.duration - hours) * 60 - minutes) * 60,
        );
        const formattedDuration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        setDuration(formattedDuration);
      } else if (parsed.duration && typeof parsed.duration === "string") {
        setDuration(parsed.duration);
      }

      // Handle description - append to existing description if it exists
      if (parsed.description) {
        if (description && !description.includes(parsed.description)) {
          // Append to existing description
          setDescription(description + "\n" + parsed.description);
        } else {
          // Set new description
          setDescription(parsed.description);
        }
      }

      // Handle date parsing with enhanced natural language support
      if (parsed.date) {
        setDate(parsed.date);
      }

      // Handle time parsing with automatic duration calculation
      if (parsed.startTime) {
        // Ensure time is in HH:MM:SS format
        const formattedStartTime = formatTimeString(parsed.startTime);
        setStartTime(formattedStartTime);

        // If we have both start and end time, calculate duration
        if (parsed.endTime) {
          const formattedEndTime = formatTimeString(parsed.endTime);
          setEndTime(formattedEndTime);
          calculateDurationFromTimes(formattedStartTime, formattedEndTime);
        } else if (endTime) {
          // If we already have an end time, recalculate duration
          calculateDurationFromTimes(formattedStartTime, endTime);
        }
      } else if (parsed.endTime) {
        // Only end time provided
        const formattedEndTime = formatTimeString(parsed.endTime);
        setEndTime(formattedEndTime);

        if (startTime) {
          // If we already have a start time, calculate duration
          calculateDurationFromTimes(startTime, formattedEndTime);
        }
      }

      // Extract activity name from transcription if not already parsed
      if (!parsed.activity && transcription) {
        // Look for common patterns that might indicate an activity
        const activityPatterns = [
          /in der ([\w-]+)/i, // "in der TEST-Entwicklung"
          /für ([\w-]+)/i, // "für TEST-Entwicklung"
          /an ([\w-]+)/i, // "an TEST-Entwicklung"
          /mit ([\w-]+)/i, // "mit TEST-Entwicklung"
          /bei ([\w-]+)/i, // "bei TEST-Entwicklung"
          /aktivität ([\w-]+)/i, // "aktivität TEST-Entwicklung"
          /tätigkeit ([\w-]+)/i, // "tätigkeit TEST-Entwicklung"
          /([\w-]+) gearbeitet/i, // "TEST-Entwicklung gearbeitet"
        ];

        for (const pattern of activityPatterns) {
          const match = transcription.match(pattern);
          if (match && match[1]) {
            parsed.activity = match[1].trim();
            console.log(
              "Extracted activity from transcription:",
              parsed.activity,
            );
            break;
          }
        }
      }

      // If we have an activity name but no area/field, try to find them in the user's data
      if (parsed.activity && (!parsed.area || !parsed.field)) {
        console.log(
          "Attempting to find area and field for activity in user's data:",
          parsed.activity,
        );
        const { fieldId, areaId, activityId } =
          await findFieldAndAreaByActivity(parsed.activity);

        if (areaId && fieldId) {
          console.log(
            "Found matching area and field in user's data for activity:",
            parsed.activity,
          );
          // We'll let handleHierarchicalSelection handle the actual setting of these values
        }
      }

      // Enhanced hierarchical selection with intelligent fuzzy matching
      console.log("Starting hierarchical selection process...");
      await handleHierarchicalSelection(parsed);
      console.log("Hierarchical selection process completed.");

      // Show enhanced success message with detailed recognition feedback
      showVoiceProcessingSuccess(
        transcription,
        parsed,
        confidence,
        processingMethod,
      );
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
      console.log("Loading fields for area ID:", areaId);

      // Get current user ID for filtering
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get current user's role to determine access level
      const { data: currentUserData } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const currentUserRole = currentUserData?.role || "member";
      
      // Determine which user ID to use for loading categories
      const targetUserId = entryOwnerId || specificUserId;
      console.log("Loading fields for target user ID:", targetUserId);

      let query = supabase
        .from("fields")
        .select("*")
        .eq("area_id", areaId)
        .eq("is_active", true)
        .order("name");

      // If we have a specific target user (editing someone else's entry), filter by that user
      // Otherwise, load current user's fields
      if (targetUserId && currentUserRole === "admin") {
        // Admin/Manager editing another user's entry - load that user's fields
        query = query.eq("user_id", targetUserId);
        console.log("Admin/Manager loading fields for user:", targetUserId);
      } else {
        // Load current user's fields
        const { data: currentUserRecord } = await supabase
          .from("users")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (currentUserRecord) {
          query = query.eq("user_id", currentUserRecord.id);
          console.log("Loading fields for current user:", currentUserRecord.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database error loading fields:", error);
        throw error;
      }
      
      console.log(
        "Fields loaded successfully:",
        data?.length || 0,
        "fields",
      );
      setFields(data || []);
      return data || [];
    } catch (error) {
      console.error("Error loading fields:", error);
      return [];
    }
  };

  const loadActivitiesAndReturn = async (fieldId: string) => {
    try {
      console.log("Loading activities for field ID:", fieldId);

      // Get current user ID for filtering
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get current user's role to determine access level
      const { data: currentUserData } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const currentUserRole = currentUserData?.role || "member";
      
      // Determine which user ID to use for loading categories
      const targetUserId = entryOwnerId || specificUserId;
      console.log("Loading activities for target user ID:", targetUserId);

      let query = supabase
        .from("activities")
        .select("*")
        .eq("field_id", fieldId)
        .eq("is_active", true)
        .order("name");

      // If we have a specific target user (editing someone else's entry), filter by that user
      // Otherwise, load current user's activities
      if (targetUserId && currentUserRole === "admin") {
        // Admin/Manager editing another user's entry - load that user's activities
        query = query.eq("user_id", targetUserId);
        console.log("Admin/Manager loading activities for user:", targetUserId);
      } else {
        // Load current user's activities
        const { data: currentUserRecord } = await supabase
          .from("users")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (currentUserRecord) {
          query = query.eq("user_id", currentUserRecord.id);
          console.log("Loading activities for current user:", currentUserRecord.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database error loading activities:", error);
        throw error;
      }
      
      console.log(
        "Activities loaded successfully:",
        data?.length || 0,
        "activities",
      );
      setActivities(data || []);
      return data || [];
    } catch (error) {
      console.error("Error loading activities:", error);
      return [];
    }
  };

  // Enhanced lookup function to find field and area based on activity name with confidence scoring
  const findFieldAndAreaByActivity = async (activityName: string) => {
    console.log("Looking up field and area for activity:", activityName);
    try {
      // Get current user ID for filtering
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log("Current user ID for filtering:", user.id);

      // First, try exact match with strict user filtering
      const { data: exactMatchData, error: exactMatchError } = await supabase
        .from("activities")
        .select("id, name, field_id, user_id")
        .eq("name", activityName)
        .eq("is_active", true)
        .eq("user_id", user.id)
        .limit(1);

      console.log(
        "Exact match results:",
        exactMatchData?.length || 0,
        "items found",
      );

      // If no exact match, try case-insensitive partial match with strict user filtering
      let { data: activityData, error: activityError } = !exactMatchData?.length
        ? await supabase
            .from("activities")
            .select("id, name, field_id, user_id")
            .ilike("name", `%${activityName}%`)
            .eq("is_active", true)
            .eq("user_id", user.id)
            .limit(1)
        : { data: exactMatchData, error: null };

      console.log(
        "Partial match results:",
        activityData?.length || 0,
        "items found",
      );

      // If still no match, try fuzzy matching with all user's activities
      if (!activityData?.length) {
        console.log(
          "No direct match found, trying fuzzy matching with user's activities",
        );
        const { data: allActivities, error: allActivitiesError } =
          await supabase
            .from("activities")
            .select("id, name, field_id, user_id")
            .eq("is_active", true)
            .eq("user_id", user.id);

        if (allActivitiesError) throw allActivitiesError;
        console.log(
          "Total user activities for fuzzy matching:",
          allActivities?.length || 0,
        );

        if (allActivities && allActivities.length > 0) {
          // Use our fuzzy matching function to find the best match
          const bestMatch = findBestMatch(activityName, allActivities, "name");
          if (bestMatch) {
            console.log(
              "Found fuzzy match for activity:",
              bestMatch.name,
              "with user_id:",
              bestMatch.user_id,
            );
            activityData = [bestMatch];
          }
        }
      }

      if (activityError || exactMatchError)
        throw activityError || exactMatchError;
      if (!activityData || activityData.length === 0) {
        console.log(
          "No matching activity found in user's database for:",
          activityName,
        );
        return { fieldId: null, areaId: null, activityId: null };
      }

      const activity = activityData[0];
      console.log(
        "Found activity in database:",
        activity,
        "with user_id:",
        activity.user_id,
      );

      // Verify this activity belongs to the current user
      if (activity.user_id !== user.id) {
        console.log("Activity doesn't belong to current user, skipping");
        return { fieldId: null, areaId: null, activityId: null };
      }

      // Now find the field using the field_id from the activity, ensuring it belongs to the user
      const { data: fieldData, error: fieldError } = await supabase
        .from("fields")
        .select("id, name, area_id, user_id")
        .eq("id", activity.field_id)
        .eq("is_active", true)
        .eq("user_id", user.id)
        .single();

      if (fieldError) throw fieldError;
      if (!fieldData) {
        console.log(
          "No matching field found for user's activity:",
          activityName,
        );
        return { fieldId: null, areaId: null, activityId: activity.id };
      }

      console.log(
        "Found field in database:",
        fieldData,
        "with user_id:",
        fieldData.user_id,
      );

      // Finally, find the area using the area_id from the field, ensuring it belongs to the user
      const { data: areaData, error: areaError } = await supabase
        .from("areas")
        .select("id, name, user_id")
        .eq("id", fieldData.area_id)
        .eq("is_active", true)
        .eq("user_id", user.id)
        .single();

      if (areaError) throw areaError;
      if (!areaData) {
        console.log("No matching area found for user's field:", fieldData.name);
        return { fieldId: fieldData.id, areaId: null, activityId: activity.id };
      }

      console.log(
        "Found area in database:",
        areaData,
        "with user_id:",
        areaData.user_id,
      );

      // Calculate confidence score based on match type
      let confidence = 0;
      if (exactMatchData?.length > 0) {
        confidence = 1.0; // Perfect match
      } else if (activity.name.toLowerCase() === activityName.toLowerCase()) {
        confidence = 0.95; // Case-insensitive exact match
      } else if (activity.name.toLowerCase().includes(activityName.toLowerCase())) {
        confidence = 0.8; // Contains match
      } else {
        // Fuzzy match confidence based on similarity
        confidence = calculateSimilarity(activityName.toLowerCase(), activity.name.toLowerCase());
      }

      // Return all IDs for hierarchical selection with confidence
      return {
        fieldId: fieldData.id,
        areaId: areaData.id,
        activityId: activity.id,
        activityName: activity.name,
        areaName: areaData.name,
        fieldName: fieldData.name,
        confidence: confidence,
      };
    } catch (error) {
      console.error("Error finding field and area by activity:", error);
      return { fieldId: null, areaId: null, activityId: null, confidence: 0 };
    }
  };

  // Function to show activity confirmation dialog
  const showActivityConfirmationDialog = (activityData: any, originalInput: string, parsedData: any) => {
    setActivityConfirmationData({
      ...activityData,
      originalInput,
      parsedData
    });
    setShowActivityConfirmation(true);
  };

  // Function to suggest new activity creation
  const suggestNewActivity = async (activityName: string, parsedData: any) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the best matching area and field from user's existing data
      const { data: userAreas } = await supabase
        .from("areas")
        .select("id, name")
        .eq("is_active", true)
        .eq("user_id", user.id)
        .order("name");

      if (!userAreas || userAreas.length === 0) {
        alert("Sie haben noch keine Bereiche erstellt. Bitte erstellen Sie zuerst Bereiche und Felder in der Kategorienverwaltung.");
        return;
      }

      // Try to find the best matching area based on context or use the first one
      let suggestedArea = userAreas[0];
      let suggestedField = null;

      // If we have area/field info from parsed data, try to match it
      if (parsedData.area) {
        const matchedArea = findBestMatch(parsedData.area, userAreas, "name");
        if (matchedArea) suggestedArea = matchedArea;
      }

      // Get fields for the suggested area
      const { data: areaFields } = await supabase
        .from("fields")
        .select("id, name")
        .eq("area_id", suggestedArea.id)
        .eq("is_active", true)
        .eq("user_id", user.id)
        .order("name");

      if (!areaFields || areaFields.length === 0) {
        alert(`Der Bereich "${suggestedArea.name}" hat keine Felder. Bitte erstellen Sie zuerst Felder in der Kategorienverwaltung.`);
        return;
      }

      // Try to find the best matching field
      suggestedField = areaFields[0];
      if (parsedData.field) {
        const matchedField = findBestMatch(parsedData.field, areaFields, "name");
        if (matchedField) suggestedField = matchedField;
      }

      // Show suggestion dialog
      setNewActivitySuggestionData({
        activityName: activityName,
        suggestedArea: suggestedArea,
        suggestedField: suggestedField,
        allAreas: userAreas,
        allFields: areaFields,
        parsedData: parsedData
      });
      setShowNewActivitySuggestion(true);

    } catch (error) {
      console.error("Error suggesting new activity:", error);
      alert("Fehler beim Vorschlagen einer neuen Aktivität.");
    }
  };

  // Function to create new activity from voice input
  const createNewActivityFromVoice = async (suggestionData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("activities")
        .insert({
          field_id: suggestionData.suggestedField.id,
          name: suggestionData.activityName,
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local activities state
      setActivities(prev => [...prev, data]);

      // Set the new activity as selected and update hierarchy
      setSelectedArea(suggestionData.suggestedArea.id);
      await loadFieldsAndReturn(suggestionData.suggestedArea.id);
      setSelectedField(suggestionData.suggestedField.id);
      await loadActivitiesAndReturn(suggestionData.suggestedField.id);
      setSelectedActivity(data.id);

      // Apply other parsed data
      const parsedData = suggestionData.parsedData;
      if (parsedData.duration) {
        if (typeof parsedData.duration === "number") {
          const hours = Math.floor(parsedData.duration);
          const minutes = Math.floor((parsedData.duration - hours) * 60);
          const seconds = Math.floor(((parsedData.duration - hours) * 60 - minutes) * 60);
          const formattedDuration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          setDuration(formattedDuration);
        } else {
          setDuration(parsedData.duration);
        }
      }
      if (parsedData.description) setDescription(parsedData.description);
      if (parsedData.date) setDate(parsedData.date);
      if (parsedData.startTime) setStartTime(formatTimeString(parsedData.startTime));
      if (parsedData.endTime) setEndTime(formatTimeString(parsedData.endTime));

      // Show success message
      const successDiv = document.createElement("div");
      successDiv.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md";
      successDiv.innerHTML = `
        <div class="font-semibold mb-2">Neue Aktivität erfolgreich erstellt!</div>
        <div class="text-sm opacity-90">"${data.name}" wurde im Bereich "${suggestionData.suggestedArea.name}" > "${suggestionData.suggestedField.name}" erstellt.</div>
      `;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        successDiv.style.opacity = "0";
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 300);
      }, 4000);

    } catch (error) {
      console.error("Error creating new activity:", error);
      alert("Fehler beim Erstellen der neuen Aktivität: " + (error as Error).message);
    }
  };

  // Enhanced hierarchical selection handler with sequential state updates
  const handleHierarchicalSelection = async (parsed: any) => {
    console.log("Starting hierarchical selection with:", parsed);

    // Get current user ID for filtering
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error(
        "User not authenticated, cannot perform hierarchical selection",
      );
      return;
    }
    console.log("Performing hierarchical selection for user ID:", user.id);

    // PRIORITY 1: If we have an activity, ALWAYS try to infer area and field first
    // This is the main enhancement - try to infer hierarchy from activity regardless of whether area/field are provided
    if (parsed.activity) {
      console.log(
        "Attempting to infer area and field from activity:",
        parsed.activity,
      );
      const activityResult = await findFieldAndAreaByActivity(
        parsed.activity,
      );

      if (activityResult.areaId && activityResult.fieldId && activityResult.activityId) {
        console.log("Found activity with confidence:", activityResult.confidence);

        // Check confidence level and ask for confirmation if uncertain
        if ((activityResult.confidence ?? 0) < 0.8) {
          console.log("Low confidence match, asking for confirmation");
          showActivityConfirmationDialog(activityResult, parsed.activity, parsed);
          return; // Stop processing until user confirms
        }

        console.log("High confidence match, proceeding with hierarchy setup");
        
        // Set area first
        setSelectedArea(activityResult.areaId);
        console.log("Area set to ID:", activityResult.areaId);

        // Force a synchronous load of fields for this area
        const fieldsData = await loadFieldsAndReturn(activityResult.areaId);
        console.log("Loaded fields for inferred area:", fieldsData.length);

        // Wait for a longer time to ensure React has updated the DOM
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        // Set field
        setSelectedField(activityResult.fieldId);
        console.log("Field set to ID:", activityResult.fieldId);

        // Force a synchronous load of activities for this field
        const activitiesData = await loadActivitiesAndReturn(activityResult.fieldId);
        console.log(
          "Loaded activities for inferred field:",
          activitiesData.length,
        );

        // Wait for a longer time to ensure React has updated the DOM
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        // Set activity
        setSelectedActivity(activityResult.activityId);
        console.log("Activity set to ID:", activityResult.activityId);

        // Successfully set the complete hierarchy
        return;
      } else {
        console.log(
          "Could not find matching activity in user's database. Suggesting new activity creation.",
        );
        // Suggest creating a new activity
        await suggestNewActivity(parsed.activity, parsed);
        return; // Stop processing until user decides
      }
    }

    // If we already have a complete hierarchy selected, only update what's explicitly mentioned
    const hasCompleteHierarchy =
      selectedArea && selectedField && selectedActivity;

    if (hasCompleteHierarchy) {
      console.log(
        "Complete hierarchy already exists, only updating explicitly mentioned items",
      );

      // Only update area if explicitly mentioned
      if (parsed.area) {
        const area = findBestMatch(parsed.area, areas, "name");
        if (area) {
          console.log("Updating area to:", area.name);
          setSelectedArea(area.id);

          // Since area changed, we need to reset field and activity
          setSelectedField("");
          setSelectedActivity("");

          // Load fields for the new area
          const fieldsData = await loadFieldsAndReturn(area.id);
          console.log("Loaded fields for updated area:", fieldsData.length);

          // Continue with field selection if provided
          if (parsed.field) {
            await handleFieldSelection(
              parsed.field,
              fieldsData,
              parsed.activity,
            );
          }
        }
      }
      // Only update field if explicitly mentioned and area hasn't changed
      else if (parsed.field && !parsed.area) {
        const fieldsData = await loadFieldsAndReturn(selectedArea);
        await handleFieldSelection(parsed.field, fieldsData, parsed.activity);
      }
      // Only update activity if explicitly mentioned and area/field haven't changed
      else if (parsed.activity && !parsed.area && !parsed.field) {
        const activitiesData = await loadActivitiesAndReturn(selectedField);
        const activity = findBestMatch(parsed.activity, activitiesData, "name");
        if (activity) {
          console.log("Found matching activity:", activity.name);
          setSelectedActivity(activity.id);
          console.log(
            "Activity set to:",
            activity.name,
            "with ID:",
            activity.id,
          );
        } else if (activitiesData.length === 1) {
          // Auto-select if only one activity available
          console.log(
            "Auto-selecting single activity:",
            activitiesData[0].name,
          );
          setSelectedActivity(activitiesData[0].id);
          console.log("Activity auto-set to:", activitiesData[0].name);
        }
      }

      return;
    }

    // Step 1: Handle area selection
    if (parsed.area) {
      const area = findBestMatch(parsed.area, areas, "name");
      if (area) {
        console.log("Found matching area:", area.name);

        // Directly set the area ID
        setSelectedArea(area.id);
        console.log("Area set to:", area.name, "with ID:", area.id);

        // Force a synchronous load of fields for this area
        const fieldsData = await loadFieldsAndReturn(area.id);
        console.log("Loaded fields for area:", fieldsData.length);

        // Wait for a longer time to ensure React has updated the DOM
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        // Step 2: Handle field selection
        if (parsed.field && fieldsData.length > 0) {
          await handleFieldSelection(parsed.field, fieldsData, parsed.activity);
        } else if (fieldsData.length === 1) {
          // Auto-select if only one field available and no field specified
          console.log(
            "Auto-selecting single field (no field specified):",
            fieldsData[0].name,
          );

          // Directly set the field ID
          setSelectedField(fieldsData[0].id);
          console.log("Field auto-set to:", fieldsData[0].name);

          // Force a synchronous load of activities for this field
          const activitiesData = await loadActivitiesAndReturn(
            fieldsData[0].id,
          );
          console.log(
            "Loaded activities for auto-selected field:",
            activitiesData.length,
          );

          // Wait for a longer time to ensure React has updated the DOM
          await new Promise<void>((resolve) => setTimeout(resolve, 300));

          if (parsed.activity && activitiesData.length > 0) {
            const activity = findBestMatch(
              parsed.activity,
              activitiesData,
              "name",
            );
            if (activity) {
              console.log("Found matching activity:", activity.name);
              setSelectedActivity(activity.id);
              console.log(
                "Activity set to:",
                activity.name,
                "with ID:",
                activity.id,
              );
            } else if (activitiesData.length === 1) {
              // Auto-select if only one activity available
              console.log(
                "Auto-selecting single activity:",
                activitiesData[0].name,
              );
              setSelectedActivity(activitiesData[0].id);
              console.log("Activity auto-set to:", activitiesData[0].name);
            }
          } else if (activitiesData.length === 1) {
            // Auto-select if only one activity available and no activity specified
            console.log(
              "Auto-selecting single activity (no activity specified):",
              activitiesData[0].name,
            );
            setSelectedActivity(activitiesData[0].id);
            console.log("Activity auto-set to:", activitiesData[0].name);
          }
        }
      } else {
        console.log("No matching area found for:", parsed.area);
      }
    } else if (parsed.activity) {
      // If we have only activity but no area/field, try one more time with direct DB lookup
      console.log("Only activity provided, attempting direct DB lookup");
      const { fieldId, areaId, activityId } = await findFieldAndAreaByActivity(
        parsed.activity,
      );

      if (areaId && fieldId && activityId) {
        // Set the complete hierarchy in sequence
        setSelectedArea(areaId);
        await loadFieldsAndReturn(areaId);
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        setSelectedField(fieldId);
        await loadActivitiesAndReturn(fieldId);
        await new Promise<void>((resolve) => setTimeout(resolve, 300));

        setSelectedActivity(activityId);
        console.log("Set complete hierarchy from activity lookup");
      }
    }
  };

  // Helper function to handle field selection and subsequent activity selection
  const handleFieldSelection = async (
    fieldName: string,
    fieldsData: any[],
    activityName?: string,
  ) => {
    const field = findBestMatch(fieldName, fieldsData, "name");
    if (field) {
      console.log("Found matching field:", field.name);

      // Directly set the field ID
      setSelectedField(field.id);
      console.log("Field set to:", field.name, "with ID:", field.id);

      // Force a synchronous load of activities for this field
      const activitiesData = await loadActivitiesAndReturn(field.id);
      console.log("Loaded activities for field:", activitiesData.length);

      // Wait for a longer time to ensure React has updated the DOM
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      // Step 3: Handle activity selection
      if (activityName && activitiesData.length > 0) {
        const activity = findBestMatch(activityName, activitiesData, "name");
        if (activity) {
          console.log("Found matching activity:", activity.name);
          setSelectedActivity(activity.id);
          console.log(
            "Activity set to:",
            activity.name,
            "with ID:",
            activity.id,
          );
        } else if (activitiesData.length === 1) {
          // Auto-select if only one activity available
          console.log(
            "Auto-selecting single activity:",
            activitiesData[0].name,
          );
          setSelectedActivity(activitiesData[0].id);
          console.log("Activity auto-set to:", activitiesData[0].name);
        }
      } else if (activitiesData.length === 1) {
        // Auto-select if only one activity available and no activity specified
        console.log(
          "Auto-selecting single activity (no activity specified):",
          activitiesData[0].name,
        );
        setSelectedActivity(activitiesData[0].id);
        console.log("Activity auto-set to:", activitiesData[0].name);
      }
    } else if (fieldsData.length === 1) {
      // Auto-select if only one field available
      console.log("Auto-selecting single field:", fieldsData[0].name);

      // Directly set the field ID
      setSelectedField(fieldsData[0].id);
      console.log("Field auto-set to:", fieldsData[0].name);

      // Force a synchronous load of activities for this field
      const activitiesData = await loadActivitiesAndReturn(fieldsData[0].id);
      console.log(
        "Loaded activities for auto-selected field:",
        activitiesData.length,
      );

      // Wait for a longer time to ensure React has updated the DOM
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      if (activityName && activitiesData.length > 0) {
        const activity = findBestMatch(activityName, activitiesData, "name");
        if (activity) {
          console.log("Found matching activity:", activity.name);
          setSelectedActivity(activity.id);
          console.log("Activity set to:", activity.name);
        } else if (activitiesData.length === 1) {
          console.log(
            "Auto-selecting single activity:",
            activitiesData[0].name,
          );
          setSelectedActivity(activitiesData[0].id);
          console.log("Activity auto-set to:", activitiesData[0].name);
        }
      } else if (activitiesData.length === 1) {
        console.log(
          "Auto-selecting single activity (no activity specified):",
          activitiesData[0].name,
        );
        setSelectedActivity(activitiesData[0].id);
        console.log("Activity auto-set to:", activitiesData[0].name);
      }
    }
  };

  // Enhanced success notification with detailed feedback
  const showVoiceProcessingSuccess = (
    transcription: string,
    parsed: any,
    confidence: number,
    processingMethod: string,
  ) => {
    const confidenceText = confidence
      ? ` (Genauigkeit: ${(confidence * 100).toFixed(1)}%)`
      : "";
    const methodText =
      processingMethod === "ai" ? " (KI-gestützt)" : " (Regelbasiert)";

    // Create detailed list of recognized fields
    const recognizedFields = [];
    const matchedFields = [];
    const inferredFields = [];

    if (parsed.area) {
      recognizedFields.push(`Bereich: ${parsed.area}`);
      const matchedArea = areas.find((a) => a.id === selectedArea);
      if (matchedArea) {
        matchedFields.push(`✓ Bereich: ${matchedArea.name}`);
      }
    } else if (selectedArea) {
      // Area was inferred from activity
      const inferredArea = areas.find((a) => a.id === selectedArea);
      if (inferredArea) {
        inferredFields.push(
          `⚡ Bereich: ${inferredArea.name} (aus Nutzerdaten abgeleitet)`,
        );
      }
    }

    if (parsed.field) {
      recognizedFields.push(`Feld: ${parsed.field}`);
      const matchedField = fields.find((f) => f.id === selectedField);
      if (matchedField) {
        matchedFields.push(`✓ Feld: ${matchedField.name}`);
      }
    } else if (selectedField) {
      // Field was inferred from activity
      const inferredField = fields.find((f) => f.id === selectedField);
      if (inferredField) {
        inferredFields.push(
          `⚡ Feld: ${inferredField.name} (aus Nutzerdaten abgeleitet)`,
        );
      }
    }

    if (parsed.activity) {
      recognizedFields.push(`Aktivität: ${parsed.activity}`);
      const matchedActivity = activities.find((a) => a.id === selectedActivity);
      if (matchedActivity) {
        matchedFields.push(
          `✓ Aktivität: ${matchedActivity.name} (aus Ihren Daten)`,
        );
      }
    }

    if (parsed.startTime)
      recognizedFields.push(`Startzeit: ${parsed.startTime}`);
    if (parsed.endTime) recognizedFields.push(`Endzeit: ${parsed.endTime}`);
    if (parsed.duration)
      recognizedFields.push(
        `Dauer: ${typeof parsed.duration === "number" ? parsed.duration + "h" : parsed.duration}`,
      );
    if (parsed.date) recognizedFields.push(`Datum: ${parsed.date}`);
    if (parsed.description) {
      const desc =
        parsed.description.length > 40
          ? parsed.description.substring(0, 40) + "..."
          : parsed.description;
      recognizedFields.push(`Beschreibung: ${desc}`);
    }

    const recognizedFieldsHtml =
      recognizedFields.length > 0
        ? `<div class="text-xs mt-2 bg-green-600 p-2 rounded">
          <div class="font-semibold mb-1">Erkannte Informationen:</div>
          <ul class="list-disc pl-4">
            ${recognizedFields.map((field) => `<li>${field}</li>`).join("")}
          </ul>
        </div>`
        : "";

    const matchedFieldsHtml =
      matchedFields.length > 0
        ? `<div class="text-xs mt-2 bg-blue-600 p-2 rounded">
          <div class="font-semibold mb-1">Automatisch ausgewählt:</div>
          <ul class="list-disc pl-4">
            ${matchedFields.map((field) => `<li>${field}</li>`).join("")}
          </ul>
        </div>`
        : "";

    const inferredFieldsHtml =
      inferredFields.length > 0
        ? `<div class="text-xs mt-2 bg-purple-600 p-2 rounded">
          <div class="font-semibold mb-1">Automatisch abgeleitet:</div>
          <ul class="list-disc pl-4">
            ${inferredFields.map((field) => `<li>${field}</li>`).join("")}
          </ul>
        </div>`
        : "";

    // Add a special note if activity was used to infer hierarchy
    const hierarchyNote =
      parsed.activity &&
      !parsed.area &&
      !parsed.field &&
      inferredFields.length >= 2
        ? `<div class="text-xs mt-2 bg-blue-700 p-2 rounded">
          <div class="font-semibold">⚡ Hierarchie aus Ihren Daten für Aktivität "${parsed.activity}" abgeleitet</div>
        </div>`
        : "";

    const successDiv = document.createElement("div");
    successDiv.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md";
    successDiv.innerHTML = `
      <div class="font-semibold mb-2">Spracheingabe erfolgreich verarbeitet!${methodText}</div>
      <div class="text-sm opacity-90 mb-2">"${transcription}"${confidenceText}</div>
      ${recognizedFieldsHtml}
      ${matchedFieldsHtml}
      ${inferredFieldsHtml}
      ${hierarchyNote}
    `;
    document.body.appendChild(successDiv);

    // Remove success message after 7 seconds (longer due to more content)
    setTimeout(() => {
      successDiv.style.opacity = "0";
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 300);
    }, 7000);
  };

  // Enhanced time string formatting
  const formatTimeString = (timeStr: string): string => {
    if (!timeStr) return "";

    // Remove any non-numeric characters except colon
    const cleanedStr = timeStr.replace(/[^0-9:]/g, "");

    // If it's already in HH:MM or HH:MM:SS format, return it properly formatted
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanedStr)) {
      const parts = cleanedStr.split(":");
      const hours = parts[0].padStart(2, "0");
      const minutes = parts[1];
      const seconds = parts[2] || "00";
      return `${hours}:${minutes}:${seconds}`;
    }

    // If it's just a number (like "14"), assume it's hours and add minutes and seconds
    if (/^\d{1,2}$/.test(cleanedStr)) {
      return `${cleanedStr.padStart(2, "0")}:00:00`;
    }

    // Default fallback - try to parse as time
    const timeMatch = timeStr.match(/(\d{1,2})[:.](\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}:00`;
    }

    return timeStr;
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
      errorNotification.textContent = `Fehler beim Erstellen des Zeiteintrags: ${(error as Error).message || error}`;
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
      try {
        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("areas")
          .insert({
            name: newAreaName,
            user_id: user.id,
            is_active: true,
          })
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
        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("fields")
          .insert({
            area_id: selectedArea,
            name: newFieldName,
            user_id: user.id,
            is_active: true,
          })
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
        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("activities")
          .insert({
            field_id: selectedField,
            name: newActivityName,
            user_id: user.id,
            is_active: true,
          })
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
      <div className="bg-white p-4 sm:p-6">
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded-md"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
              <div className="h-10 bg-gray-200 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg">
        <div className="p-6 pb-0">
          <h3 className="text-gray-900 font-semibold text-base flex items-center gap-2">
            {isEditing ? (
              <Edit className="w-5 h-5 text-gray-900" />
            ) : (
              <Clock className="w-5 h-5 text-gray-900" />
            )}
            {isEditing ? "Zeiteintrag bearbeiten" : "Zeiteintrag"}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {isEditing
              ? "Bearbeiten Sie Ihren bestehenden Zeiteintrag"
              : "Erfassen Sie Ihre Arbeitszeit mit Spracheingabe oder manueller Eingabe"}
          </p>
        </div>
        <div className="p-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Timer and Voice Controls */}
            <div className="flex flex-col items-center space-y-4">
              {/* Timer Display */}
              {isTimerRunning && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 w-full max-w-md">
                  <div className="flex items-center justify-center gap-2 text-gray-900">
                    <Timer className="w-5 h-5 animate-pulse" />
                    <span className="text-2xl font-mono font-bold">
                      {formatElapsedTime(elapsedTime)}
                    </span>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-1">
                    Timer läuft... Drücken Sie Strg+Shift+S zum Stoppen und
                    Spracheingabe
                  </p>
                </div>
              )}

              {/* Control Buttons - stack vertically on mobile */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={handleVoiceToggle}
                  variant={isRecording ? "destructive" : "outline"}
                  size="lg"
                  className="flex items-center gap-2 h-12 border-gray-200 rounded-md"
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

                <Button
                  type="button"
                  onClick={isTimerRunning ? stopTimer : startTimer}
                  variant={isTimerRunning ? "destructive" : "default"}
                  size="lg"
                  className={`flex items-center gap-2 h-12 rounded-md ${!isTimerRunning ? "bg-gray-900 text-white hover:bg-gray-800" : ""}`}
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

                {isTimerRunning && (
                  <Button
                    type="button"
                    onClick={stopTimerAndStartVoice}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2 border-gray-200 rounded-md"
                  >
                    <Square className="w-4 h-4" />
                    <Mic className="w-4 h-4" />
                    Stoppen & Sprechen
                  </Button>
                )}
              </div>
            </div>

            {isRecording && (
              <div className="text-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-gray-900">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  Aufnahme läuft... Sprechen Sie Ihren Zeiteintrag natürlich
                </div>
              </div>
            )}

            {/* Cascading Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="area" className="text-gray-900">Bereich</Label>
                  <Dialog open={isAddingArea} onOpenChange={setIsAddingArea}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 border-gray-200 rounded-md"
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
                          className="border-gray-200 rounded-md"
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
                  <SelectTrigger className="border-gray-200 rounded-md">
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
                  <Label htmlFor="field" className="text-gray-900">Feld</Label>
                  <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 border-gray-200 rounded-md"
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
                          className="border-gray-200 rounded-md"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleAddField} className="bg-gray-900 text-white hover:bg-gray-800 rounded-md">Hinzufügen</Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingField(false)}
                            className="border-gray-200 rounded-md"
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
                  <SelectTrigger className="border-gray-200 rounded-md">
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
                  <Label htmlFor="activity" className="text-gray-900">Aktivität</Label>
                  <Dialog
                    open={isAddingActivity}
                    onOpenChange={setIsAddingActivity}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 border-gray-200 rounded-md"
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
                          className="border-gray-200 rounded-md"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleAddActivity} className="bg-gray-900 text-white hover:bg-gray-800 rounded-md">
                            Hinzufügen
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddingActivity(false)}
                            className="border-gray-200 rounded-md"
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
                  <SelectTrigger className="border-gray-200 rounded-md">
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
              {/* Date and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-900">Datum</Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="border-gray-200 rounded-md"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-gray-900">Dauer</Label>
                  <Input
                    id="duration"
                    type="text"
                    placeholder="Wird automatisch berechnet"
                    value={duration}
                    disabled={true}
                    className="bg-gray-50 text-gray-500 border-gray-200 rounded-md"
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
                </div>
              </div>

              {/* Start and End Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-gray-900">Startzeit</Label>
                  <Input
                    id="startTime"
                    type="time"
                    step="1"
                    value={startTime}
                    className="border-gray-200 rounded-md"
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
                  <Label htmlFor="endTime" className="text-gray-900">Endzeit</Label>
                  <Input
                    id="endTime"
                    type="time"
                    step="1"
                    value={endTime}
                    className="border-gray-200 rounded-md"
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
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-900">
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
              <Label htmlFor="description" className="text-gray-900">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Kurze Beschreibung der durchgeführten Arbeit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="border-gray-200 rounded-md"
              />
            </div>

            {/* Validation Info */}
            {(!selectedArea ||
              !selectedField ||
              !selectedActivity ||
              !duration) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-900">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Bitte vervollständigen Sie die Eingabe:
                  </span>
                </div>
                <ul className="mt-2 text-sm text-gray-500 space-y-1">
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

            {/* Activity Confirmation Dialog */}
            <Dialog open={showActivityConfirmation} onOpenChange={setShowActivityConfirmation}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Aktivität bestätigen</DialogTitle>
                  <DialogDescription>
                    Ich bin mir nicht ganz sicher, ob ich die richtige Aktivität erkannt habe.
                  </DialogDescription>
                </DialogHeader>
                {activityConfirmationData && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Sie haben gesagt:</strong> "{activityConfirmationData.originalInput}"
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Ich habe gefunden:</strong> "{activityConfirmationData.activityName}" 
                        im Bereich "{activityConfirmationData.areaName}" {'>'} "{activityConfirmationData.fieldName}"
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Übereinstimmung: {Math.round(activityConfirmationData.confidence * 100)}%
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-md"
                        onClick={async () => {
                          // User confirmed - proceed with the selection
                          setSelectedArea(activityConfirmationData.areaId);
                          await loadFieldsAndReturn(activityConfirmationData.areaId);
                          await new Promise<void>((resolve) => setTimeout(resolve, 300));
                          setSelectedField(activityConfirmationData.fieldId);
                          await loadActivitiesAndReturn(activityConfirmationData.fieldId);
                          await new Promise<void>((resolve) => setTimeout(resolve, 300));
                          setSelectedActivity(activityConfirmationData.activityId);
                          
                          // Apply other parsed data
                          const parsedData = activityConfirmationData.parsedData;
                          if (parsedData.duration) {
                            if (typeof parsedData.duration === "number") {
                              const hours = Math.floor(parsedData.duration);
                              const minutes = Math.floor((parsedData.duration - hours) * 60);
                              const seconds = Math.floor(((parsedData.duration - hours) * 60 - minutes) * 60);
                              const formattedDuration = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                              setDuration(formattedDuration);
                            } else {
                              setDuration(parsedData.duration);
                            }
                          }
                          if (parsedData.description) setDescription(parsedData.description);
                          if (parsedData.date) setDate(parsedData.date);
                          if (parsedData.startTime) setStartTime(formatTimeString(parsedData.startTime));
                          if (parsedData.endTime) setEndTime(formatTimeString(parsedData.endTime));
                          
                          setShowActivityConfirmation(false);
                          setActivityConfirmationData(null);
                        }}
                      >
                        Ja, das ist richtig
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-gray-200 rounded-md"
                        onClick={async () => {
                          // User rejected - suggest creating new activity
                          setShowActivityConfirmation(false);
                          await suggestNewActivity(activityConfirmationData.originalInput, activityConfirmationData.parsedData);
                          setActivityConfirmationData(null);
                        }}
                      >
                        Nein, neue Aktivität erstellen
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* New Activity Suggestion Dialog */}
            <Dialog open={showNewActivitySuggestion} onOpenChange={setShowNewActivitySuggestion}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Neue Aktivität erstellen</DialogTitle>
                  <DialogDescription>
                    Ich konnte keine passende Aktivität in Ihrer Datenbank finden.
                  </DialogDescription>
                </DialogHeader>
                {newActivitySuggestionData && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Soll ich eine neue Aktivität erstellen?</strong>
                      </p>
                      <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> "{newActivitySuggestionData.activityName}"</p>
                        <p><strong>Bereich:</strong> {newActivitySuggestionData.suggestedArea.name}</p>
                        <p><strong>Feld:</strong> {newActivitySuggestionData.suggestedField.name}</p>
                      </div>
                    </div>
                    
                    {/* Option to change area/field */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-900">Bereich ändern (optional)</Label>
                        <Select 
                          value={newActivitySuggestionData.suggestedArea.id}
                          onValueChange={async (value) => {
                            const selectedArea = newActivitySuggestionData.allAreas.find((a: any) => a.id === value);
                            if (selectedArea) {
                              // Load fields for the new area
                              const { data: fields } = await supabase
                                .from("fields")
                                .select("id, name")
                                .eq("area_id", value)
                                .eq("is_active", true)
                                .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
                                .order("name");
                              
                              setNewActivitySuggestionData((prev: any) => ({
                                ...prev,
                                suggestedArea: selectedArea,
                                suggestedField: fields?.[0] || prev.suggestedField,
                                allFields: fields || []
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="border-gray-200 rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {newActivitySuggestionData.allAreas.map((area: any) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-900">Feld ändern (optional)</Label>
                        <Select 
                          value={newActivitySuggestionData.suggestedField.id}
                          onValueChange={(value) => {
                            const selectedField = newActivitySuggestionData.allFields.find((f: any) => f.id === value);
                            if (selectedField) {
                              setNewActivitySuggestionData((prev: any) => ({
                                ...prev,
                                suggestedField: selectedField
                              }));
                            }
                          }}
                        >
                          <SelectTrigger className="border-gray-200 rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {newActivitySuggestionData.allFields.map((field: any) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-md"
                        onClick={async () => {
                          await createNewActivityFromVoice(newActivitySuggestionData);
                          setShowNewActivitySuggestion(false);
                          setNewActivitySuggestionData(null);
                        }}
                      >
                        Ja, Aktivität erstellen
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-gray-200 rounded-md"
                        onClick={() => {
                          setShowNewActivitySuggestion(false);
                          setNewActivitySuggestionData(null);
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-md"
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
                  className="border-gray-200 rounded-md"
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
        </div>
      </div>
    </div>
  );
}