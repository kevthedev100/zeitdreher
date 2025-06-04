"use client";

import { useState } from "react";
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
import { Mic, MicOff, Clock, Calendar, Plus, Edit } from "lucide-react";
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

  // Mock data for cascading dropdowns
  const [areas, setAreas] = useState([
    { id: "development", name: "Entwicklung" },
    { id: "design", name: "Design" },
    { id: "marketing", name: "Marketing" },
    { id: "management", name: "Management" },
  ]);

  const [fields, setFields] = useState({
    development: [
      { id: "frontend", name: "Frontend" },
      { id: "backend", name: "Backend" },
      { id: "testing", name: "Testing" },
    ],
    design: [
      { id: "ui-design", name: "UI Design" },
      { id: "ux-research", name: "UX Research" },
      { id: "prototyping", name: "Prototyping" },
    ],
    marketing: [
      { id: "content", name: "Content Creation" },
      { id: "social-media", name: "Social Media" },
      { id: "campaigns", name: "Campaigns" },
    ],
    management: [
      { id: "planning", name: "Planning" },
      { id: "meetings", name: "Meetings" },
      { id: "reporting", name: "Reporting" },
    ],
  });

  const [activities, setActivities] = useState({
    frontend: [
      { id: "react-dev", name: "React Development" },
      { id: "styling", name: "CSS/Styling" },
      { id: "optimization", name: "Performance Optimization" },
    ],
    backend: [
      { id: "api-dev", name: "API Development" },
      { id: "database", name: "Database Work" },
      { id: "deployment", name: "Deployment" },
    ],
    testing: [
      { id: "unit-tests", name: "Unit Testing" },
      { id: "integration", name: "Integration Testing" },
      { id: "bug-fixing", name: "Bug Fixing" },
    ],
  });

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop voice recording
    if (!isRecording) {
      // Simulate voice input after 2 seconds
      setTimeout(() => {
        setSelectedArea("development");
        setSelectedField("frontend");
        setSelectedActivity("react-dev");
        setDuration("2,5");
        setDescription("Arbeit am Zeiterfassungsformular-Komponenten");
        setIsRecording(false);
      }, 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = {
      area: selectedArea,
      field: selectedField,
      activity: selectedActivity,
      duration: parseFloat(duration),
      date,
      description,
    };
    onSubmit(formData);
  };

  const handleAddArea = () => {
    if (newAreaName.trim()) {
      const newId = newAreaName.toLowerCase().replace(/\s+/g, "-");
      setAreas([...areas, { id: newId, name: newAreaName }]);
      setFields({ ...fields, [newId]: [] });
      setNewAreaName("");
      setIsAddingArea(false);
    }
  };

  const handleAddField = () => {
    if (newFieldName.trim() && selectedArea) {
      const newId = newFieldName.toLowerCase().replace(/\s+/g, "-");
      const updatedFields = {
        ...fields,
        [selectedArea]: [
          ...(fields[selectedArea as keyof typeof fields] || []),
          { id: newId, name: newFieldName },
        ],
      };
      setFields(updatedFields);
      setActivities({ ...activities, [newId]: [] });
      setNewFieldName("");
      setIsAddingField(false);
    }
  };

  const handleAddActivity = () => {
    if (newActivityName.trim() && selectedField) {
      const newId = newActivityName.toLowerCase().replace(/\s+/g, "-");
      const updatedActivities = {
        ...activities,
        [selectedField]: [
          ...(activities[selectedField as keyof typeof activities] || []),
          { id: newId, name: newActivityName },
        ],
      };
      setActivities(updatedActivities);
      setNewActivityName("");
      setIsAddingActivity(false);
    }
  };

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
            {/* Voice Recording Button */}
            <div className="flex justify-center">
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
                    Spracheingabe starten
                  </>
                )}
              </Button>
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
                    setSelectedField("");
                    setSelectedActivity("");
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
                    setSelectedActivity("");
                  }}
                  disabled={!selectedArea}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Feld auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedArea &&
                      fields[selectedArea as keyof typeof fields]?.map(
                        (field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name}
                          </SelectItem>
                        ),
                      )}
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
                  disabled={!selectedField}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aktivität auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedField &&
                      activities[selectedField as keyof typeof activities]?.map(
                        (activity) => (
                          <SelectItem key={activity.id} value={activity.id}>
                            {activity.name}
                          </SelectItem>
                        ),
                      )}
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

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg">
              Zeiteintrag erfassen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
