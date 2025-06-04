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
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Edit,
  Save,
  X,
  CheckCircle,
  Calendar,
  Timer,
} from "lucide-react";
import { createClient } from "../../supabase/client";

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
}

interface RecentTimeEntryProps {
  entry: TimeEntry;
  onUpdate?: (updatedEntry: TimeEntry) => void;
  onExpire?: () => void;
}

export default function RecentTimeEntry({
  entry,
  onUpdate = () => {},
  onExpire = () => {},
}: RecentTimeEntryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDuration, setEditedDuration] = useState(
    entry.duration.toString(),
  );
  const [editedDescription, setEditedDescription] = useState(
    entry.description || "",
  );
  const [timeLeft, setTimeLeft] = useState(30);
  const [isVisible, setIsVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsVisible(false);
          setTimeout(() => onExpire(), 300); // Allow fade out animation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  const handleSave = async () => {
    if (!editedDuration || parseFloat(editedDuration) <= 0) {
      alert("Bitte geben Sie eine gültige Dauer ein.");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .update({
          duration: parseFloat(editedDuration),
          description: editedDescription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id)
        .select(
          `
          *,
          areas(name, color),
          fields(name),
          activities(name)
        `,
        )
        .single();

      if (error) {
        console.error("Error updating time entry:", error);
        alert("Fehler beim Aktualisieren des Eintrags.");
        return;
      }

      // Update the entry data
      onUpdate(data);
      setIsEditing(false);

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
      notification.textContent = "Eintrag erfolgreich aktualisiert!";
      document.body.appendChild(notification);

      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    } catch (error) {
      console.error("Error saving time entry:", error);
      alert("Fehler beim Speichern des Eintrags.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedDuration(entry.duration.toString());
    setEditedDescription(entry.description || "");
    setIsEditing(false);
  };

  const getAreaColorClasses = (hexColor: string) => {
    const colorMap: { [key: string]: string } = {
      "#3B82F6": "bg-blue-100 text-blue-800 border-blue-200",
      "#8B5CF6": "bg-purple-100 text-purple-800 border-purple-200",
      "#10B981": "bg-green-100 text-green-800 border-green-200",
      "#F59E0B": "bg-orange-100 text-orange-800 border-orange-200",
      "#EF4444": "bg-red-100 text-red-800 border-red-200",
    };
    return colorMap[hexColor] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <Card className="border-2 border-green-200 bg-green-50 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">
                Eintrag erfolgreich erstellt!
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Timer className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onExpire(), 300);
                }}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-green-700">
            Sie können diesen Eintrag noch {timeLeft} Sekunden lang bearbeiten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Entry Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Aktivität
                </label>
                <div className="mt-1">
                  <Badge
                    variant="secondary"
                    className={getAreaColorClasses(entry.areas.color)}
                  >
                    {entry.activities.name}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {entry.areas.name} → {entry.fields.name}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Dauer
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={editedDuration}
                    onChange={(e) => setEditedDuration(e.target.value)}
                    className="mt-1"
                    placeholder="Stunden"
                  />
                ) : (
                  <div className="mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">
                      {entry.duration.toFixed(2)}h
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Datum
                </label>
                <div className="mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date(entry.date).toLocaleDateString("de-DE")}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Beschreibung
              </label>
              {isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="mt-1"
                  placeholder="Beschreibung (optional)"
                  rows={2}
                />
              ) : (
                <div className="mt-1 text-sm text-gray-600">
                  {entry.description || "Keine Beschreibung"}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Speichern..." : "Speichern"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    size="sm"
                  >
                    Abbrechen
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Bearbeiten
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
