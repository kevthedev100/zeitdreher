"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Settings,
  Edit,
  Trash2,
  FolderPlus,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "../../supabase/client";
import {
  createArea,
  createField,
  createActivity,
  deleteArea,
  deleteField,
  deleteActivity,
} from "@/app/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Area {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface Field {
  id: string;
  area_id: string;
  name: string;
  description?: string;
}

interface Activity {
  id: string;
  field_id: string;
  name: string;
  description?: string;
}

export default function CategoryManagement() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      loadFields(selectedArea);
    } else {
      setFields([]);
      setSelectedField("");
    }
  }, [selectedArea]);

  useEffect(() => {
    if (selectedField) {
      loadActivities(selectedField);
    } else {
      setActivities([]);
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

  const handleCreateArea = async (formData: FormData) => {
    await createArea(formData);
    setIsAddingArea(false);
    loadAreas();
  };

  const handleCreateField = async (formData: FormData) => {
    formData.append("area_id", selectedArea);
    await createField(formData);
    setIsAddingField(false);
    loadFields(selectedArea);
  };

  const handleCreateActivity = async (formData: FormData) => {
    formData.append("field_id", selectedField);
    await createActivity(formData);
    setIsAddingActivity(false);
    loadActivities(selectedField);
  };

  const handleDeleteArea = async (areaId: string) => {
    setDeleteLoading(areaId);
    setDeleteError(null);

    try {
      const result = await deleteArea(areaId);

      if (result.success) {
        // Refresh areas list
        loadAreas();
        // Clear selections if deleted area was selected
        if (selectedArea === areaId) {
          setSelectedArea("");
          setSelectedField("");
          setFields([]);
          setActivities([]);
        }
      } else {
        setDeleteError(result.error || "Failed to delete area");
      }
    } catch (error: any) {
      setDeleteError(error.message || "Failed to delete area");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    setDeleteLoading(fieldId);
    setDeleteError(null);

    try {
      const result = await deleteField(fieldId);

      if (result.success) {
        // Refresh fields list
        loadFields(selectedArea);
        // Clear selections if deleted field was selected
        if (selectedField === fieldId) {
          setSelectedField("");
          setActivities([]);
        }
      } else {
        setDeleteError(result.error || "Failed to delete field");
      }
    } catch (error: any) {
      setDeleteError(error.message || "Failed to delete field");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    setDeleteLoading(activityId);
    setDeleteError(null);

    try {
      const result = await deleteActivity(activityId);

      if (result.success) {
        // Refresh activities list
        loadActivities(selectedField);
      } else {
        setDeleteError(result.error || "Failed to delete activity");
      }
    } catch (error: any) {
      setDeleteError(error.message || "Failed to delete activity");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Kategorie-Verwaltung
            </h1>
            <p className="text-gray-600 mt-1">
              Verwalten Sie Bereiche, Felder und Aktivitäten für die
              Zeiterfassung
            </p>
          </div>
        </div>

        {/* Error Message */}
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-medium">Fehler beim Löschen</p>
              <p className="text-sm">{deleteError}</p>
            </div>
            <button
              onClick={() => setDeleteError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Areas Column */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5" />
                  Bereiche
                </CardTitle>
                <Dialog open={isAddingArea} onOpenChange={setIsAddingArea}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Neuen Bereich hinzufügen</DialogTitle>
                      <DialogDescription>
                        Erstellen Sie einen neuen Arbeitsbereich für die
                        Zeiterfassung.
                      </DialogDescription>
                    </DialogHeader>
                    <form action={handleCreateArea} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="z.B. Entwicklung"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Kurze Beschreibung des Bereichs"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">Farbe</Label>
                        <Input
                          id="color"
                          name="color"
                          type="color"
                          defaultValue="#3B82F6"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Erstellen</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddingArea(false)}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                {areas.length} Bereiche verfügbar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedArea === area.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedArea(area.id);
                          setSelectedField("");
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        ></div>
                        <span className="font-medium">{area.name}</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteLoading === area.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bereich löschen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sind Sie sicher, dass Sie den Bereich "{area.name}
                              " löschen möchten? Diese Aktion kann nicht
                              rückgängig gemacht werden. Der Bereich muss leer
                              sein (keine Felder enthalten).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteArea(area.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {area.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {area.description}
                      </p>
                    )}
                  </div>
                ))}
                {areas.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Keine Bereiche vorhanden
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fields Column */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Felder
                </CardTitle>
                <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8" disabled={!selectedArea}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Neues Feld hinzufügen</DialogTitle>
                      <DialogDescription>
                        Erstellen Sie ein neues Feld für den ausgewählten
                        Bereich.
                      </DialogDescription>
                    </DialogHeader>
                    <form action={handleCreateField} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="field-name">Name</Label>
                        <Input
                          id="field-name"
                          name="name"
                          placeholder="z.B. Frontend"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field-description">Beschreibung</Label>
                        <Textarea
                          id="field-description"
                          name="description"
                          placeholder="Kurze Beschreibung des Feldes"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Erstellen</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddingField(false)}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                {selectedArea
                  ? `${fields.length} Felder im ausgewählten Bereich`
                  : "Wählen Sie einen Bereich aus"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedArea ? (
                  fields.length > 0 ? (
                    fields.map((field) => (
                      <div
                        key={field.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          selectedField === field.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => setSelectedField(field.id)}
                          >
                            <span className="font-medium">{field.name}</span>
                            {field.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {field.description}
                              </p>
                            )}
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteLoading === field.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Feld löschen
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sind Sie sicher, dass Sie das Feld "
                                  {field.name}" löschen möchten? Diese Aktion
                                  kann nicht rückgängig gemacht werden. Das Feld
                                  muss leer sein (keine Aktivitäten enthalten).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteField(field.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Keine Felder in diesem Bereich
                    </p>
                  )
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Wählen Sie zuerst einen Bereich aus
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activities Column */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Aktivitäten
                </CardTitle>
                <Dialog
                  open={isAddingActivity}
                  onOpenChange={setIsAddingActivity}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8" disabled={!selectedField}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Neue Aktivität hinzufügen</DialogTitle>
                      <DialogDescription>
                        Erstellen Sie eine neue Aktivität für das ausgewählte
                        Feld.
                      </DialogDescription>
                    </DialogHeader>
                    <form action={handleCreateActivity} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="activity-name">Name</Label>
                        <Input
                          id="activity-name"
                          name="name"
                          placeholder="z.B. React Development"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activity-description">
                          Beschreibung
                        </Label>
                        <Textarea
                          id="activity-description"
                          name="description"
                          placeholder="Kurze Beschreibung der Aktivität"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Erstellen</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddingActivity(false)}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                {selectedField
                  ? `${activities.length} Aktivitäten im ausgewählten Feld`
                  : "Wählen Sie ein Feld aus"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedField ? (
                  activities.length > 0 ? (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-medium">{activity.name}</span>
                            {activity.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteLoading === activity.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Aktivität löschen
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sind Sie sicher, dass Sie die Aktivität "
                                  {activity.name}" löschen möchten? Diese Aktion
                                  kann nicht rückgängig gemacht werden. Die
                                  Aktivität darf keine aktiven Zeiteinträge
                                  haben.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteActivity(activity.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Keine Aktivitäten in diesem Feld
                    </p>
                  )
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Wählen Sie zuerst ein Feld aus
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
