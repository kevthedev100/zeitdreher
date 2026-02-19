"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "../../supabase/client";
import {
  FolderPlus,
  Plus,
  Check,
  RefreshCw,
  ChevronRight,
  Layers,
  Trash2,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CategorySetupWizardProps {
  onComplete?: () => void;
}

export default function CategorySetupWizard({
  onComplete,
}: CategorySetupWizardProps = {}) {
  const [step, setStep] = useState<
    "areas" | "fields" | "activities" | "complete"
  >("areas");
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaColor, setNewAreaColor] = useState("#3B82F6");
  const [selectedArea, setSelectedArea] = useState("");

  const [newFieldName, setNewFieldName] = useState("");
  const [selectedField, setSelectedField] = useState("");

  const [newActivityName, setNewActivityName] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createClient();

  // Load areas from database
  const loadAreas = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .eq("user_id", user.id) // Filter by current user
        .order("name");

      if (error) throw error;
      setAreas(data || []);
    } catch (error) {
      console.error("Error loading areas:", error);
      setErrorMessage("Fehler beim Laden der Bereiche");
    } finally {
      setLoading(false);
    }
  };

  // Load fields for a specific area
  const loadFields = async (areaId: string) => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("fields")
        .select("*")
        .eq("area_id", areaId)
        .eq("is_active", true)
        .eq("user_id", user.id) // Filter by current user
        .order("name");

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error loading fields:", error);
      setErrorMessage("Fehler beim Laden der Felder");
    } finally {
      setLoading(false);
    }
  };

  // Load activities for a specific field
  const loadActivities = async (fieldId: string) => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("field_id", fieldId)
        .eq("is_active", true)
        .eq("user_id", user.id) // Filter by current user
        .order("name");

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error loading activities:", error);
      setErrorMessage("Fehler beim Laden der Aktivitäten");
    } finally {
      setLoading(false);
    }
  };

  // Add a new area
  const handleAddArea = async () => {
    if (!newAreaName.trim()) {
      setErrorMessage("Bitte geben Sie einen Namen für den Bereich ein");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("areas")
        .insert({
          name: newAreaName,
          color: newAreaColor,
          is_active: true,
          user_id: user.id, // Associate with current user
        })
        .select()
        .single();

      if (error) throw error;

      setAreas([...areas, data]);
      setNewAreaName("");
      setSuccessMessage(`Bereich "${data.name}" erfolgreich erstellt`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error adding area:", error);
      setErrorMessage(error.message || "Fehler beim Erstellen des Bereichs");
    } finally {
      setLoading(false);
    }
  };

  // Add a new field
  const handleAddField = async () => {
    if (!newFieldName.trim()) {
      setErrorMessage("Bitte geben Sie einen Namen für das Feld ein");
      return;
    }

    if (!selectedArea) {
      setErrorMessage("Bitte wählen Sie einen Bereich aus");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("fields")
        .insert({
          name: newFieldName,
          area_id: selectedArea,
          is_active: true,
          user_id: user.id, // Associate with current user
        })
        .select()
        .single();

      if (error) throw error;

      setFields([...fields, data]);
      setNewFieldName("");
      setSuccessMessage(`Feld "${data.name}" erfolgreich erstellt`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error adding field:", error);
      setErrorMessage(error.message || "Fehler beim Erstellen des Feldes");
    } finally {
      setLoading(false);
    }
  };

  // Add a new activity
  const handleAddActivity = async () => {
    if (!newActivityName.trim()) {
      setErrorMessage("Bitte geben Sie einen Namen für die Aktivität ein");
      return;
    }

    if (!selectedField) {
      setErrorMessage("Bitte wählen Sie ein Feld aus");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("activities")
        .insert({
          name: newActivityName,
          field_id: selectedField,
          is_active: true,
          user_id: user.id, // Associate with current user
        })
        .select()
        .single();

      if (error) throw error;

      setActivities([...activities, data]);
      setNewActivityName("");
      setSuccessMessage(`Aktivität "${data.name}" erfolgreich erstellt`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      console.error("Error adding activity:", error);
      setErrorMessage(error.message || "Fehler beim Erstellen der Aktivität");
    } finally {
      setLoading(false);
    }
  };

  // Handle area selection
  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    setSelectedField("");
    loadFields(areaId);
  };

  // Handle field selection
  const handleFieldChange = (fieldId: string) => {
    setSelectedField(fieldId);
    loadActivities(fieldId);
  };

  // Navigate to next step
  const nextStep = () => {
    if (step === "areas") {
      setStep("fields");
      loadAreas(); // Refresh areas list before moving to fields
    } else if (step === "fields") {
      setStep("activities");
    } else if (step === "activities") {
      setStep("complete");
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (step === "fields") {
      setStep("areas");
    } else if (step === "activities") {
      setStep("fields");
    } else if (step === "complete") {
      setStep("activities");
    }
  };

  // Initialize component
  useEffect(() => {
    loadAreas();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Kategorien einrichten
        </CardTitle>
        <CardDescription>
          Erstellen Sie Ihre Zeiterfassungsstruktur mit Bereichen, Feldern und
          Aktivitäten
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between">
            <div
              className={`flex flex-col items-center ${step === "areas" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "areas" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                1
              </div>
              <span className="text-xs mt-1">Bereiche</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="h-0.5 w-full bg-gray-200"></div>
            </div>
            <div
              className={`flex flex-col items-center ${step === "fields" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "fields" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                2
              </div>
              <span className="text-xs mt-1">Felder</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="h-0.5 w-full bg-gray-200"></div>
            </div>
            <div
              className={`flex flex-col items-center ${step === "activities" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "activities" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                3
              </div>
              <span className="text-xs mt-1">Aktivitäten</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="h-0.5 w-full bg-gray-200"></div>
            </div>
            <div
              className={`flex flex-col items-center ${step === "complete" ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "complete" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                <Check className="w-4 h-4" />
              </div>
              <span className="text-xs mt-1">Fertig</span>
            </div>
          </div>
        </div>

        {/* Error and success messages */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md mb-4 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* Step 1: Areas */}
        {step === "areas" && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">
                Bereiche erstellen
              </h3>
              <p className="text-blue-700 text-sm">
                Bereiche sind die oberste Ebene Ihrer Zeiterfassungsstruktur.
                Beispiele könnten sein: Entwicklung, Design, Marketing,
                Management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaName">Bereichsname</Label>
                <Input
                  id="areaName"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="z.B. Entwicklung"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="areaColor">Farbe</Label>
                <div className="flex gap-2">
                  <Input
                    id="areaColor"
                    type="color"
                    value={newAreaColor}
                    onChange={(e) => setNewAreaColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={newAreaColor}
                    onChange={(e) => setNewAreaColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleAddArea}
              disabled={loading || !newAreaName.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Bereich
                  erstellen...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Bereich hinzufügen
                </>
              )}
            </Button>

            {/* List of existing areas */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Vorhandene Bereiche
              </h3>
              {areas.length > 0 ? (
                <div className="space-y-2">
                  {areas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: area.color }}
                        ></div>
                        <span>{area.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          if (
                            confirm(
                              `Möchten Sie den Bereich "${area.name}" wirklich löschen?`,
                            )
                          ) {
                            try {
                              setLoading(true);
                              const { error } = await supabase
                                .from("areas")
                                .update({ is_active: false })
                                .eq("id", area.id);

                              if (error) throw error;

                              // Refresh areas list
                              loadAreas();
                              setSuccessMessage(
                                `Bereich "${area.name}" erfolgreich gelöscht`,
                              );
                              setTimeout(() => setSuccessMessage(""), 3000);
                            } catch (error) {
                              console.error("Error deleting area:", error);
                              setErrorMessage(
                                "Fehler beim Löschen des Bereichs",
                              );
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>
                    Keine Bereiche vorhanden. Erstellen Sie Ihren ersten
                    Bereich.
                  </p>
                </div>
              )}
            </div>

            {/* Example areas */}
            <div className="mt-6 mb-4 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-700">
                  Beispiele für Bereiche
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: "#3B82F6" }}
                    ></div>
                    <span>Entwicklung</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: "#8B5CF6" }}
                    ></div>
                    <span>Design</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: "#10B981" }}
                    ></div>
                    <span>Marketing</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Fields */}
        {step === "fields" && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">
                Felder erstellen
              </h3>
              <p className="text-blue-700 text-sm">
                Felder sind Unterkategorien von Bereichen. Beispiele für den
                Bereich "Entwicklung" könnten sein: Frontend, Backend, Testing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaSelect">Bereich auswählen</Label>
                <Select value={selectedArea} onValueChange={handleAreaChange}>
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
                <Label htmlFor="fieldName">Feldname</Label>
                <Input
                  id="fieldName"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="z.B. Frontend"
                  disabled={!selectedArea}
                />
              </div>
            </div>

            <Button
              onClick={handleAddField}
              disabled={loading || !newFieldName.trim() || !selectedArea}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Feld
                  erstellen...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Feld hinzufügen
                </>
              )}
            </Button>

            {/* List of existing fields */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Vorhandene Felder
              </h3>
              {selectedArea ? (
                fields.length > 0 ? (
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span>{field.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            if (
                              confirm(
                                `Möchten Sie das Feld "${field.name}" wirklich löschen?`,
                              )
                            ) {
                              try {
                                setLoading(true);
                                const { error } = await supabase
                                  .from("fields")
                                  .update({ is_active: false })
                                  .eq("id", field.id);

                                if (error) throw error;

                                // Refresh fields list
                                loadFields(selectedArea);
                                setSuccessMessage(
                                  `Feld "${field.name}" erfolgreich gelöscht`,
                                );
                                setTimeout(() => setSuccessMessage(""), 3000);
                              } catch (error) {
                                console.error("Error deleting field:", error);
                                setErrorMessage(
                                  "Fehler beim Löschen des Feldes",
                                );
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>
                      Keine Felder für diesen Bereich vorhanden. Erstellen Sie
                      Ihr erstes Feld.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  <p>Bitte wählen Sie zuerst einen Bereich aus.</p>
                </div>
              )}
            </div>

            {/* Example fields */}
            <div className="mt-6 mb-4 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-700">
                  Beispiele für Felder
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <span>Frontend</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel für Entwicklung
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <span>UI Design</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel für Design
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <span>Content Creation</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel für Marketing
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Activities */}
        {step === "activities" && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">
                Aktivitäten erstellen
              </h3>
              <p className="text-blue-700 text-sm">
                Aktivitäten sind spezifische Aufgaben innerhalb eines Feldes.
                Beispiele für das Feld "Frontend" könnten sein: React
                Development, CSS Styling, UI Testing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaSelect">Bereich</Label>
                <Select value={selectedArea} onValueChange={handleAreaChange}>
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
                <Label htmlFor="fieldSelect">Feld</Label>
                <Select
                  value={selectedField}
                  onValueChange={handleFieldChange}
                  disabled={!selectedArea}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedArea
                          ? "Feld auswählen"
                          : "Zuerst Bereich auswählen"
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
                <Label htmlFor="activityName">Aktivitätsname</Label>
                <Input
                  id="activityName"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  placeholder="z.B. React Development"
                  disabled={!selectedField}
                />
              </div>
            </div>

            <Button
              onClick={handleAddActivity}
              disabled={loading || !newActivityName.trim() || !selectedField}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Aktivität
                  erstellen...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Aktivität hinzufügen
                </>
              )}
            </Button>

            {/* List of existing activities */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Vorhandene Aktivitäten
              </h3>
              {selectedField ? (
                activities.length > 0 ? (
                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span>{activity.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            if (
                              confirm(
                                `Möchten Sie die Aktivität "${activity.name}" wirklich löschen?`,
                              )
                            ) {
                              try {
                                setLoading(true);
                                const { error } = await supabase
                                  .from("activities")
                                  .update({ is_active: false })
                                  .eq("id", activity.id);

                                if (error) throw error;

                                // Refresh activities list
                                loadActivities(selectedField);
                                setSuccessMessage(
                                  `Aktivität "${activity.name}" erfolgreich gelöscht`,
                                );
                                setTimeout(() => setSuccessMessage(""), 3000);
                              } catch (error) {
                                console.error(
                                  "Error deleting activity:",
                                  error,
                                );
                                setErrorMessage(
                                  "Fehler beim Löschen der Aktivität",
                                );
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>
                      Keine Aktivitäten für dieses Feld vorhanden. Erstellen Sie
                      Ihre erste Aktivität.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  <p>Bitte wählen Sie zuerst ein Feld aus.</p>
                </div>
              )}
            </div>

            {/* Example activities */}
            <div className="mt-6 mb-4 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-700">
                  Beispiele für Aktivitäten
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <span>React Development</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel für Frontend
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <span>Wireframing</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel für UI Design
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <span>Blog Writing</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Beispiel für Content Creation
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              Einrichtung abgeschlossen!
            </h3>
            <p className="text-gray-600 mb-6">
              Sie haben erfolgreich Ihre Zeiterfassungsstruktur eingerichtet.
              Sie können nun mit der Zeiterfassung beginnen.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  if (onComplete) {
                    onComplete();
                  } else {
                    window.location.href = "/dashboard";
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Zum Dashboard
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === "areas"}
        >
          Zurück
        </Button>
        <Button
          onClick={nextStep}
          disabled={
            step === "complete" ||
            (step === "areas" && areas.length === 0) ||
            (step === "fields" && fields.length === 0) ||
            (step === "activities" && activities.length === 0)
          }
        >
          {step === "activities" ? "Abschließen" : "Weiter"}{" "}
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
