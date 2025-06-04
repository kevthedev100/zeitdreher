"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  RefreshCw,
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
  users: { full_name: string; email: string };
}

interface TimeEntriesTableProps {
  userRole?: "manager" | "employee";
}

export default function TimeEntriesTable({
  userRole = "employee",
}: TimeEntriesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [filterField, setFilterField] = useState("all");
  const [filterActivity, setFilterActivity] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    loadCurrentUser();
    loadAreas();
    loadTimeEntries();
  }, []);

  useEffect(() => {
    if (filterArea !== "all") {
      loadFieldsByArea(filterArea);
    } else {
      setFields([]);
      setFilterField("all");
    }
  }, [filterArea]);

  useEffect(() => {
    if (filterField !== "all") {
      loadActivitiesByField(filterField);
    } else {
      setActivities([]);
      setFilterActivity("all");
    }
  }, [filterField]);

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

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
    }
  };

  const loadFieldsByArea = async (areaId: string) => {
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

  const loadActivitiesByField = async (fieldId: string) => {
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

  const loadTimeEntries = async () => {
    try {
      setLoading(true);
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
      if (userRole === "employee" && currentUser) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error("Error loading time entries:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for fallback
  const mockTimeEntries: TimeEntry[] = [
    {
      id: "1",
      user_id: "user1",
      area_id: "area1",
      field_id: "field1",
      activity_id: "activity1",
      duration: 4.5,
      date: "2024-01-15",
      description:
        "Zeiterfassungsformular mit Spracheingabe-Funktionalität implementiert",
      created_at: "2024-01-15T10:00:00Z",
      areas: { name: "Entwicklung", color: "#3B82F6" },
      fields: { name: "Frontend" },
      activities: { name: "React Entwicklung" },
      users: { full_name: "Max Mustermann", email: "max@example.com" },
    },
    {
      id: "2",
      user_id: "user2",
      area_id: "area2",
      field_id: "field2",
      activity_id: "activity2",
      duration: 3.0,
      date: "2024-01-15",
      description: "Wireframes für Dashboard-Analytik-Bereich erstellt",
      created_at: "2024-01-15T11:00:00Z",
      areas: { name: "Design", color: "#8B5CF6" },
      fields: { name: "UI Design" },
      activities: { name: "Wireframing" },
      users: { full_name: "Anna Schmidt", email: "anna@example.com" },
    },
  ];

  const getAreaColorFromHex = (hexColor: string) => {
    // Convert hex color to appropriate Tailwind classes
    const colorMap: { [key: string]: string } = {
      "#3B82F6": "bg-blue-100 text-blue-800",
      "#8B5CF6": "bg-purple-100 text-purple-800",
      "#10B981": "bg-green-100 text-green-800",
      "#F59E0B": "bg-orange-100 text-orange-800",
      "#EF4444": "bg-red-100 text-red-800",
    };
    return colorMap[hexColor] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  const formatDuration = (hours: number) => {
    return `${hours.toFixed(2)}h`;
  };

  // Use real data if available, otherwise fallback to mock data
  const displayEntries = timeEntries.length > 0 ? timeEntries : mockTimeEntries;

  // Filter and sort entries
  const filteredEntries = displayEntries
    .filter((entry) => {
      const matchesSearch =
        entry.activities?.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.users?.full_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        entry.areas?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.fields?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesArea = filterArea === "all" || entry.area_id === filterArea;
      const matchesField =
        filterField === "all" || entry.field_id === filterField;
      const matchesActivity =
        filterActivity === "all" || entry.activity_id === filterActivity;

      return matchesSearch && matchesArea && matchesField && matchesActivity;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "date":
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case "duration":
          aValue = a.duration;
          bValue = b.duration;
          break;
        case "employee":
          aValue = a.users?.full_name || "";
          bValue = b.users?.full_name || "";
          break;
        case "area":
          aValue = a.areas?.name || "";
          bValue = b.areas?.name || "";
          break;
        default:
          aValue = a.activities?.name || "";
          bValue = b.activities?.name || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalHours = filteredEntries.reduce(
    (sum, entry) => sum + entry.duration,
    0,
  );

  const refreshData = () => {
    loadTimeEntries();
  };

  return (
    <div className="bg-white p-6">
      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Zeiteinträge Übersicht
                {loading && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
              </CardTitle>
              <CardDescription>
                {userRole === "manager"
                  ? "Alle Team-Zeiteinträge mit erweiterten Filter- und Sortierfunktionen"
                  : "Ihre Zeiteinträge mit erweiterten Filter- und Sortierfunktionen"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {totalHours.toFixed(1)}h gesamt
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Aktivitäten, Beschreibungen, Mitarbeiter oder Bereiche suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              <Select
                value={filterArea}
                onValueChange={(value) => {
                  setFilterArea(value);
                  setFilterField("all");
                  setFilterActivity("all");
                }}
              >
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Bereich" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Bereiche</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        ></div>
                        {area.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterField}
                onValueChange={(value) => {
                  setFilterField(value);
                  setFilterActivity("all");
                }}
                disabled={filterArea === "all"}
              >
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Feld" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Felder</SelectItem>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterActivity}
                onValueChange={setFilterActivity}
                disabled={filterField === "all"}
              >
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Aktivität" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Aktivitäten</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sortieren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Datum</SelectItem>
                  <SelectItem value="duration">Dauer</SelectItem>
                  <SelectItem value="activity">Aktivität</SelectItem>
                  <SelectItem value="area">Bereich</SelectItem>
                  {userRole === "manager" && (
                    <SelectItem value="employee">Mitarbeiter</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3"
                title={`Sortierung: ${sortOrder === "asc" ? "Aufsteigend" : "Absteigend"}`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>

              {/* Clear Filters Button */}
              {(filterArea !== "all" ||
                filterField !== "all" ||
                filterActivity !== "all" ||
                searchTerm) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilterArea("all");
                    setFilterField("all");
                    setFilterActivity("all");
                    setSearchTerm("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium">Aktivität</th>
                  <th className="text-left py-3 font-medium">Bereich</th>
                  {userRole === "manager" && (
                    <th className="text-left py-3 font-medium">Mitarbeiter</th>
                  )}
                  <th className="text-left py-3 font-medium">Dauer</th>
                  <th className="text-left py-3 font-medium">Datum</th>
                  <th className="text-left py-3 font-medium">Status</th>
                  <th className="text-left py-3 font-medium">Beschreibung</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-4">
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </td>
                        {userRole === "manager" && (
                          <td className="py-4">
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                          </td>
                        )}
                        <td className="py-4">
                          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="py-4">
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </td>
                        <td className="py-4">
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="py-4">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  : filteredEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4">
                          <div>
                            <div className="font-medium">
                              {entry.activities?.name || "Unbekannte Aktivität"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.fields?.name || "Unbekanntes Feld"}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge
                            variant="secondary"
                            className={getAreaColorFromHex(
                              entry.areas?.color || "#6B7280",
                            )}
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    entry.areas?.color || "#6B7280",
                                }}
                              ></div>
                              {entry.areas?.name || "Unbekannter Bereich"}
                            </div>
                          </Badge>
                        </td>
                        {userRole === "manager" && (
                          <td className="py-4">
                            <div className="font-medium">
                              {entry.users?.full_name || "Unbekannter Benutzer"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.users?.email}
                            </div>
                          </td>
                        )}
                        <td className="py-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">
                              {formatDuration(entry.duration)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(entry.date)}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Erfasst
                          </Badge>
                        </td>
                        <td className="py-4 max-w-xs">
                          <p
                            className="text-sm text-gray-600 truncate"
                            title={entry.description || "Keine Beschreibung"}
                          >
                            {entry.description || "Keine Beschreibung"}
                          </p>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                Keine Zeiteinträge gefunden, die Ihren Kriterien entsprechen.
              </p>
              {(filterArea !== "all" ||
                filterField !== "all" ||
                filterActivity !== "all" ||
                searchTerm) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterArea("all");
                    setFilterField("all");
                    setFilterActivity("all");
                    setSearchTerm("");
                  }}
                  className="mt-2"
                >
                  Alle Filter zurücksetzen
                </Button>
              )}
            </div>
          )}

          {/* Summary Statistics */}
          {!loading && filteredEntries.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredEntries.length}
                  </div>
                  <div className="text-sm text-gray-600">Einträge</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {totalHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-600">Gesamtstunden</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(totalHours / filteredEntries.length).toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-600">Ø pro Eintrag</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {new Set(filteredEntries.map((e) => e.areas?.name)).size}
                  </div>
                  <div className="text-sm text-gray-600">Bereiche</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
