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
      setAreas(data || []);

      // Set initial area if provided
      if (initialArea && data) {
        const area = data.find(
          (a) => a.name.toLowerCase() === initialArea.toLowerCase(),
        );
        if (area) {
          setSelectedArea(area.id);
        }
      }
    } catch (error) {
      console.error("Error loading areas:", error);
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
      setFields(data || []);
    } catch (error) {
      console.error("Error loading fields:", error);
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
      setActivities(data || []);
    } catch (error) {
      console.error("Error loading activities:", error);
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

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop voice recording
    if (!isRecording) {
      // Simulate voice input after 2 seconds
      setTimeout(() => {
        setSelectedArea("development");
        setSelectedField("frontend");
        setSelectedActivity("react-dev");
        if (!duration) {
          setDuration("2,5");
        }
        setDescription("Arbeit am Zeiterfassungsformular-Komponenten");
        setIsRecording(false);
      }, 2000);
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

    await createTimeEntry(formData);

    // Reset form
    setSelectedArea("");
    setSelectedField("");
    setSelectedActivity("");
    setFields([]);
    setActivities([]);
    setDuration("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
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
