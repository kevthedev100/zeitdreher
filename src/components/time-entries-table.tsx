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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  RefreshCw,
  Edit,
  Trash2,
} from "lucide-react";
import { createClient } from "../../supabase/client";
import TimeEntryForm from "@/components/time-entry-form";

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
  start_time?: string | null;
  end_time?: string | null;
  status?: string;
  areas: { name: string; color: string };
  fields: { name: string };
  activities: { name: string };
  users: { full_name: string; email: string };
  entry_owner_id?: string;
  specificUserId?: string;
  [key: string]: any;
}

interface TimeEntriesTableProps {
  userRole?: "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer";
  isOnboarded?: boolean;
  userId?: string | null;
  selectedMemberId?: string | null;
}

export default function TimeEntriesTable({
  userRole = "member",
  isOnboarded = false,
  userId = null,
  selectedMemberId = null,
}: TimeEntriesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArea, setFilterArea] = useState("all");
  const [filterField, setFilterField] = useState("all");
  const [filterActivity, setFilterActivity] = useState("all");
  const [filterMember, setFilterMember] = useState(
    selectedMemberId || "current",
  );
  const [currentUserRecord, setCurrentUserRecord] = useState<any>(null);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadCurrentUser();
    loadAreas();
    if (userRole === "admin") {
      loadTeamMembers();
    }
    loadTimeEntries();
  }, []);

  // Listen for time entry updates
  useEffect(() => {
    const handleTimeEntryAdded = (event: CustomEvent) => {
      console.log(
        "Time entry added event received in entries table:",
        event.detail,
      );
      // Ensure we reload data with a slight delay to allow database updates to complete
      setTimeout(() => {
        loadTimeEntries();
      }, 500);
    };

    window.addEventListener(
      "timeEntryAdded",
      handleTimeEntryAdded as EventListener,
    );
    return () => {
      window.removeEventListener(
        "timeEntryAdded",
        handleTimeEntryAdded as EventListener,
      );
    };
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

  useEffect(() => {
    loadTimeEntries();
    // Reload areas when filter changes to show only relevant categories
    loadAreas();
  }, [filterMember, currentUserRecord]);

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      // Also get the user record from the users table
      const { data: userRecord } = await supabase
        .from("users")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (userRecord) {
        setCurrentUserRecord(userRecord);
      }
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  const loadAreas = async () => {
    try {
      let query = supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .order("name");

      // If filtering for current user only, filter areas by current user
      if (filterMember === "current" && currentUserRecord) {
        query = query.eq("user_id", currentUserRecord.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAreas(data || []);
    } catch (error) {
      console.error("Error loading areas:", error);
    }
  };

  const loadFieldsByArea = async (areaId: string) => {
    try {
      let query = supabase
        .from("fields")
        .select("*")
        .eq("area_id", areaId)
        .eq("is_active", true)
        .order("name");

      // If filtering for current user only, filter fields by current user
      if (filterMember === "current" && currentUserRecord) {
        query = query.eq("user_id", currentUserRecord.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error loading fields:", error);
    }
  };

  const loadActivitiesByField = async (fieldId: string) => {
    try {
      let query = supabase
        .from("activities")
        .select("*")
        .eq("field_id", fieldId)
        .eq("is_active", true)
        .order("name");

      // If filtering for current user only, filter activities by current user
      if (filterMember === "current" && currentUserRecord) {
        query = query.eq("user_id", currentUserRecord.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  const loadTimeEntries = async () => {
    try {
      setLoading(true);

      // Get current user info to determine access level
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get user role from database
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const currentUserRole = userData?.role || "member";
      console.log(
        "Current user role for time entries loading:",
        currentUserRole,
      );

      // Use explicit foreign key references to ensure correct joins
      let query = supabase
        .from("time_entries")
        .select(
          `
          id, user_id, area_id, field_id, activity_id, duration, date, description, created_at, start_time, end_time, status,
          areas:area_id(id, name, color),
          fields:field_id(id, name),
          activities:activity_id(id, name),
          users:user_id(full_name, email)
        `,
        )
        .order("date", { ascending: false });

      // Filter by selected member or current user
      if (filterMember === "current" || filterMember === null) {
        // Show only current user's entries - always use current user ID
        if (currentUser) {
          query = query.eq("user_id", currentUser.id);
          console.log("Filtering for current user entries:", currentUser.id);
        }
      } else if (
        filterMember === "all" &&
        currentUserRole === "admin"
      ) {
        // Show all entries for managers and admins
        // No filter needed - RLS policies will handle access control
        console.log("Loading all entries for manager/admin");
      } else if (
        filterMember &&
        filterMember !== "current" &&
        filterMember !== "all" &&
        currentUserRole === "admin"
      ) {
        // Show entries for specific team member
        query = query.eq("user_id", filterMember);
        console.log("Filtering for specific team member:", filterMember);
      } else {
        // Fallback to current user
        if (currentUser) {
          query = query.eq("user_id", currentUser.id);
          console.log("Fallback to current user entries:", currentUser.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database error loading time entries:", error);
        throw error;
      }

      // Use real data from the database
      setTimeEntries((data as any) || []);
      console.log(
        "Loaded time entries data:",
        data ? data.length : 0,
        "entries",
      );

      // Debug: Log the first entry to check structure
      if (data && data.length > 0) {
        console.log("Sample entry structure:", data[0]);
        // Check if categories are properly loaded
        const firstEntry = data[0];
        console.log("Categories check:", {
          area: firstEntry.areas,
          field: firstEntry.fields,
          activity: firstEntry.activities,
        });
      }
    } catch (error) {
      console.error("Error loading time entries:", error);
      // Show empty state on error
      setTimeEntries([]);
      console.log("Error loading time entries - showing empty state");
    } finally {
      setLoading(false);
    }
  };

  // No mock data generation - we only use real user data

  // No mock data - we only use real user data

  const getAreaColorFromHex = (hexColor: string) => {
    // Convert hex color to appropriate Tailwind classes
    const colorMap: { [key: string]: string } = {
      "#3B82F6": "bg-blue-50 text-blue-700 border border-blue-200",
      "#8B5CF6": "bg-purple-50 text-purple-700 border border-purple-200",
      "#10B981": "bg-green-50 text-green-700 border border-green-200",
      "#F59E0B": "bg-orange-50 text-orange-700 border border-orange-200",
      "#EF4444": "bg-red-50 text-red-700 border border-red-200",
    };
    return colorMap[hexColor] || "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  const formatDuration = (hours: number) => {
    return `${hours.toFixed(2)}h`;
  };

  // Only use real data, no mock data
  const displayEntries = timeEntries;

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

  const handleEditEntry = async (entryId: string) => {
    try {
      // Load the time entry data from database
      const { data: entry, error } = await supabase
        .from("time_entries")
        .select(
          `
          id, user_id, area_id, field_id, activity_id, duration, date, description, created_at, start_time, end_time, status,
          areas(id, name, color),
          fields(id, name),
          activities(id, name),
          users(full_name, email)
        `,
        )
        .eq("id", entryId)
        .single();

      if (error) throw error;

      if (entry) {
        console.log("Loaded entry for editing:", entry);

        // Get the user record ID for the entry owner
        const { data: entryOwnerData } = await supabase
          .from("users")
          .select("id")
          .eq("user_id", entry.user_id)
          .single();

        if (entryOwnerData) {
          // Pass the entry owner's user record ID to the form so it can load the correct categories
          (entry as any).entry_owner_id = entryOwnerData.id;
          console.log(
            "Set entry_owner_id to:",
            entryOwnerData.id,
            "for user_id:",
            entry.user_id,
          );
        } else {
          console.warn(
            "Could not find user record for user_id:",
            entry.user_id,
          );
        }

        setEditingEntry(entry as any);
        setIsEditDialogOpen(true);
      }
    } catch (error) {
      console.error("Error loading time entry for editing:", error);
      alert("Fehler beim Laden des Zeiteintrags zum Bearbeiten.");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (
      !confirm("Sind Sie sicher, dass Sie diesen Zeiteintrag löschen möchten?")
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300";
      notification.textContent = "Zeiteintrag erfolgreich gelöscht!";
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

      // Refresh the data
      loadTimeEntries();

      // Trigger custom event to refresh other components
      window.dispatchEvent(
        new CustomEvent("timeEntryDeleted", { detail: { entryId } }),
      );
    } catch (error) {
      console.error("Error deleting time entry:", error);

      // Show error notification
      const errorNotification = document.createElement("div");
      errorNotification.className =
        "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300";
      errorNotification.textContent = "Fehler beim Löschen des Zeiteintrags.";
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

  const handleEditSubmit = (data: any) => {
    // Close the dialog after submission
    setIsEditDialogOpen(false);
    setEditingEntry(null);

    // Refresh the data
    loadTimeEntries();

    // Dispatch the timeEntryUpdated event to refresh other components
    window.dispatchEvent(new CustomEvent("timeEntryUpdated", { detail: data }));
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingEntry(null);
  };

  return (
    <div className="bg-white p-6">
      <Card className="max-w-7xl mx-auto border border-gray-200 rounded-lg shadow-none bg-white">
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Clock className="w-5 h-5 text-gray-500" />
                Zeiteinträge Übersicht
                {loading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-gray-400" />}
              </CardTitle>
              <CardDescription className="text-gray-500 mt-1">
                {userRole === "admin"
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
                className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Badge variant="outline" className="text-sm px-3 py-1 border-gray-200 text-gray-700 font-medium">
                {totalHours.toFixed(1)}h gesamt
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {/* Filters and Search */}
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Aktivitäten, Beschreibungen, Mitarbeiter oder Bereiche suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 rounded-md focus-visible:ring-blue-600 focus-visible:ring-1"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-2">
              {/* Team Member Filter - First position and always visible for managers/admins */}
              {userRole === "admin" && (
                <Select
                  value={filterMember}
                  onValueChange={(value) => {
                    setFilterMember(value);
                    // Reset other filters when changing member filter
                    setFilterArea("all");
                    setFilterField("all");
                    setFilterActivity("all");
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48 h-9 text-sm border-gray-200 rounded-md">
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Teammitglied" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-sm rounded-md">
                    <SelectItem value="current">Nur meine Einträge</SelectItem>
                    <SelectItem value="all">Alle Teammitglieder</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={filterArea}
                onValueChange={(value) => {
                  setFilterArea(value);
                  setFilterField("all");
                  setFilterActivity("all");
                }}
              >
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm border-gray-200 rounded-md">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Bereich" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 shadow-sm rounded-md">
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
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm border-gray-200 rounded-md">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Feld" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 shadow-sm rounded-md">
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
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm border-gray-200 rounded-md">
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Aktivität" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 shadow-sm rounded-md">
                  <SelectItem value="all">Alle Aktivitäten</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm border-gray-200 rounded-md">
                  <ArrowUpDown className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Sortieren" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 shadow-sm rounded-md">
                  <SelectItem value="date">Datum</SelectItem>
                  <SelectItem value="duration">Dauer</SelectItem>
                  <SelectItem value="activity">Aktivität</SelectItem>
                  <SelectItem value="area">Bereich</SelectItem>
                  {userRole === "admin" && (
                    <SelectItem value="employee">Mitarbeiter</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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
                  className="text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                >
                  Filter zurücksetzen
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Aktivität
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Bereich
                  </th>
                  {userRole === "admin" && (
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                      Mitarbeiter
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Dauer
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Datum
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Aktionen
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Anfangszeit
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Endzeit
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider text-gray-500">
                    Beschreibung
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-4 px-4">
                          <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </td>
                        {userRole === "admin" && (
                          <td className="py-4 px-4">
                            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                          </td>
                        )}
                        <td className="py-4 px-4">
                          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  : filteredEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {entry.activities?.name || "Unbekannte Aktivität"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.fields?.name || "Unbekanntes Feld"}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
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
                        {userRole === "admin" && (
                          <td className="py-4 px-4">
                            <div className="font-medium">
                              {entry.users?.full_name || "Unbekannter Benutzer"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.users?.email}
                            </div>
                          </td>
                        )}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">
                              {formatDuration(entry.duration)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(entry.date)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Erfasst
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEntry(entry.id)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              title="Bearbeiten"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Löschen"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span className="text-sm font-mono text-blue-700">
                              {entry.start_time
                                ? entry.start_time.substring(0, 5)
                                : "--:--"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 bg-red-50/50 border border-red-100 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3 text-red-600" />
                            <span className="text-sm font-mono text-red-700">
                              {entry.end_time
                                ? entry.end_time.substring(0, 5)
                                : "--:--"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 max-w-xs">
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
            <div className="mt-6 p-6 rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {filteredEntries.length}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">Einträge</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {totalHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">Gesamtstunden</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {(totalHours / filteredEntries.length).toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">Ø pro Eintrag</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {new Set(filteredEntries.map((e) => e.areas?.name)).size}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">Bereiche</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zeiteintrag bearbeiten</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <TimeEntryForm
              onSubmit={handleEditSubmit}
              editingEntry={editingEntry}
              specificUserId={editingEntry.specificUserId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
