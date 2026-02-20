"use client";

import { useState, useEffect } from "react";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
} from "lucide-react";
import { createClient } from "../../../supabase/client";
import {
  getTeamPerformanceData,
  getUserOrganizations,
  getTeamMembers,
} from "@/app/actions";

interface TeamPerformanceTabProps {
  userRole: "admin" | "geschaeftsfuehrer" | "member" | "einzelnutzer";
}

interface Organization {
  organization: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
  };
  role: string;
  joined_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

interface TimeEntry {
  id: string;
  user_id: string;
  date: string;
  duration: number;
  description?: string;
  areas?: { name: string; color: string };
  fields?: { name: string };
  activities?: { name: string };
  users?: { full_name: string; email: string };
}

export default function TeamPerformanceTab({
  userRole,
}: TeamPerformanceTabProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: getDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
    end: getDateString(new Date()),
  });
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    totalHoursSelected: 0,
    averageHoursPerDay: 0,
    mostActiveArea: "",
  });
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    if (userRole === "admin") {
      loadUserOrganizations();
    }
  }, [userRole]);

  // Load team members when organization is selected
  useEffect(() => {
    if (selectedOrganization) {
      loadTeamMembers(selectedOrganization);
      loadTeamPerformanceData(selectedOrganization);
    } else {
      setTeamMembers([]);
      setSelectedMembers([]);
      setPerformanceData([]);
    }
  }, [selectedOrganization]);

  // Refresh data when team members are loaded
  useEffect(() => {
    if (teamMembers.length > 0) {
      loadTimeEntries();
    }
  }, [teamMembers]);

  useEffect(() => {
    if (selectedMembers.length > 0) {
      loadTimeEntries();
    } else {
      setTimeEntries([]);
      setTeamStats({
        totalMembers: teamMembers.length,
        totalHoursSelected: 0,
        averageHoursPerDay: 0,
        mostActiveArea: "",
      });
    }
  }, [selectedMembers, dateRange]);

  const loadUserOrganizations = async () => {
    try {
      setOrganizationsLoading(true);
      const orgs = await getUserOrganizations();
      setOrganizations(orgs as any);

      // Auto-select the first organization if available
      if (orgs.length > 0) {
        setSelectedOrganization((orgs[0] as any).organization.id);
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
      setOrganizations([]);
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const loadTeamMembers = async (organizationId: string) => {
    try {
      setLoading(true);

      // Get team members based on user role and organization using updated function
      const teamMembersData = await getTeamMembers(organizationId);
      const formattedMembers = teamMembersData.map((member: any) => ({
        id: member.user.id,
        user_id: member.user.user_id,
        full_name: member.user.full_name,
        email: member.user.email,
        avatar_url: member.user.avatar_url,
        role: member.role,
      }));

      setTeamMembers(formattedMembers || []);
      setTeamStats((prev) => ({
        ...prev,
        totalMembers: formattedMembers?.length || 0,
      }));

      // Auto-select all team members for convenience
      setSelectedMembers(formattedMembers.map((member: any) => member.user_id));
    } catch (error) {
      console.error("Error loading team members:", error);
      // Set empty state on error
      setTeamMembers([]);
      setTeamStats((prev) => ({
        ...prev,
        totalMembers: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadTeamPerformanceData = async (organizationId: string) => {
    try {
      const performanceData = await getTeamPerformanceData(organizationId);
      setPerformanceData(performanceData);

      // Update stats based on performance data
      const totalHours = performanceData.reduce(
        (sum, member) => sum + (member.total_hours_this_month || 0),
        0,
      );
      const avgHoursPerDay = totalHours / 30; // Rough estimate for monthly average per day

      setTeamStats((prev) => ({
        ...prev,
        totalHoursSelected: totalHours,
        averageHoursPerDay: avgHoursPerDay,
      }));
    } catch (error) {
      console.error("Error loading team performance data:", error);
      setPerformanceData([]);
    }
  };

  const loadTimeEntries = async () => {
    if (selectedMembers.length === 0) return;

    try {
      setEntriesLoading(true);

      // Get time entries for selected members within date range with proper joins
      // Using explicit foreign key references to ensure correct joins
      const { data, error } = await supabase
        .from("time_entries")
        .select(
          `
          id, user_id, date, duration, description, area_id, field_id, activity_id,
          areas:area_id(name, color),
          fields:field_id(name),
          activities:activity_id(name)
        `,
        )
        .in("user_id", selectedMembers)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end)
        .order("date", { ascending: false });

      if (error) throw error;

      // Enrich with user data from our team members list
      const enrichedEntries = (data || []).map((entry) => {
        const member = teamMembers.find((m) => m.user_id === entry.user_id);
        return {
          ...entry,
          users: member
            ? {
                full_name: member.full_name,
                email: member.email,
              }
            : {
                full_name: "Unknown User",
                email: "unknown@example.com",
              },
        };
      });

      setTimeEntries(enrichedEntries as any);
      calculateStats(enrichedEntries as any);
    } catch (error) {
      console.error("Error loading time entries:", error);
      setTimeEntries([]);
      calculateStats([]);
    } finally {
      setEntriesLoading(false);
    }
  };

  const calculateStats = (entries: TimeEntry[]) => {
    if (entries.length === 0) {
      setTeamStats({
        totalMembers: teamMembers.length,
        totalHoursSelected: 0,
        averageHoursPerDay: 0,
        mostActiveArea: "",
      });
      return;
    }

    // Calculate total hours
    const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);

    // Calculate days in range
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const daysInRange =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Find most active area
    const areaCount: Record<string, { count: number; hours: number }> = {};
    entries.forEach((entry) => {
      const areaName = entry.areas?.name || "Unknown";
      if (!areaCount[areaName]) {
        areaCount[areaName] = { count: 0, hours: 0 };
      }
      areaCount[areaName].count += 1;
      areaCount[areaName].hours += entry.duration;
    });

    let mostActiveArea = "None";
    let maxHours = 0;

    Object.entries(areaCount).forEach(([area, data]) => {
      if (data.hours > maxHours) {
        mostActiveArea = area;
        maxHours = data.hours;
      }
    });

    setTeamStats({
      totalMembers: teamMembers.length,
      totalHoursSelected: totalHours,
      averageHoursPerDay: daysInRange > 0 ? totalHours / daysInRange : 0,
      mostActiveArea,
    });
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const selectAllMembers = () => {
    setSelectedMembers(teamMembers.map((member) => member.user_id));
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  function getDateString(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  const getAreaColorClasses = (hexColor: string) => {
    const colorMap: { [key: string]: string } = {
      "#3B82F6": "bg-blue-50 text-blue-600",
      "#8B5CF6": "bg-purple-50 text-purple-600",
      "#10B981": "bg-green-50 text-green-600",
      "#F59E0B": "bg-orange-50 text-orange-600",
      "#EF4444": "bg-red-50 text-red-600",
    };
    return colorMap[hexColor] || "bg-gray-50 text-gray-600";
  };

  if (userRole === "member" || userRole === "einzelnutzer") {
    return (
      <div className="bg-white p-6 border border-gray-200 rounded-lg">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Zugriff verweigert
          </h3>
          <p className="text-gray-500">
            Nur Administratoren und Geschäftsführer haben Zugriff auf Team-Performance-Daten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      }
    >
      <div className="bg-white p-1 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Team Performance
                </h1>
                <p className="text-gray-500 mt-1">
                  View and analyze time entries across your team
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 hover:bg-gray-50"
                  onClick={loadUserOrganizations}
                  disabled={organizationsLoading}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${organizationsLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Organization Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-6 border border-gray-200 rounded-lg bg-white">
              <div className="flex-shrink-0">
                <Label htmlFor="organization-select" className="font-medium">
                  Organization:
                </Label>
              </div>
              <div className="flex-grow w-full sm:w-auto">
                <select
                  id="organization-select"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                  disabled={organizationsLoading || organizations.length === 0}
                >
                  {organizations.length === 0 ? (
                    <option value="">No organizations available</option>
                  ) : (
                    <>
                      <option value="">Select an organization</option>
                      {organizations.map((org) => (
                        <option
                          key={org.organization.id}
                          value={org.organization.id}
                        >
                          {org.organization.name} ({org.role})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              {organizationsLoading && (
                <div className="flex items-center">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">
                    Loading organizations...
                  </span>
                </div>
              )}
              {!organizationsLoading && organizations.length === 0 && (
                <div className="text-sm text-amber-600">
                  No organizations found. Please create or join an organization
                  first.
                </div>
              )}
            </div>
          </div>

          {/* Team Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
            <Card className="bg-white border border-gray-200 shadow-none rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-gray-900">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-2xl font-bold text-gray-900">
                  {teamStats.totalMembers}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedMembers.length} selected
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-none rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-gray-900">
                  Total Hours
                </CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-2xl font-bold text-gray-900">
                  {teamStats.totalHoursSelected.toFixed(1)}h
                </div>
                <p className="text-xs text-gray-500">
                  Selected members
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-none rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-gray-900">
                  Daily Average
                </CardTitle>
                <Calendar className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-2xl font-bold text-gray-900">
                  {teamStats.averageHoursPerDay.toFixed(1)}h
                </div>
                <p className="text-xs text-gray-500">
                  Per day in range
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-none rounded-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <CardTitle className="text-sm font-medium text-gray-900">Top Area</CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="text-lg font-bold truncate text-gray-900">
                  {teamStats.mostActiveArea}
                </div>
                <p className="text-xs text-gray-500">
                  Most active area
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Team Performance Summary */}
          {performanceData.length > 0 && (
            <Card className="mb-6 bg-white border border-gray-200 shadow-none rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Team Performance Summary
                </CardTitle>
                <CardDescription>
                  Monthly performance overview for team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {performanceData.map((member, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-900">
                          {member.member_name}
                        </h4>
                        <Badge variant="outline" className="text-xs border-gray-200 text-gray-700">
                          {member.entries_this_month} entries
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Hours:</span>
                          <span className="font-medium">
                            {(member.total_hours_this_month || 0).toFixed(1)}h
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Avg per Entry:</span>
                          <span className="font-medium">
                            {(member.avg_hours_per_entry || 0).toFixed(1)}h
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Manager: {member.manager_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Team Member Selection */}
            <Card className="lg:col-span-1 bg-white border border-gray-200 shadow-none rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Select members to view their time entries
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllMembers}
                    className="text-xs border-gray-200 hover:bg-gray-50"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs border-gray-200 hover:bg-gray-50"
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : teamMembers.length > 0 ? (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(member.user_id) ? "bg-gray-50 border-gray-200" : "border-gray-200 hover:bg-gray-50/50"}`}
                        onClick={() => toggleMemberSelection(member.user_id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                            <span className="text-gray-700 font-medium text-sm">
                              {member.full_name?.charAt(0) ||
                                member.email.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.full_name || "No name"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        {selectedMembers.includes(member.user_id) && (
                          <CheckCircle className="w-5 h-5 text-gray-700" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No team members found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Entries */}
            <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-none rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Time Entries
                </CardTitle>
                <CardDescription>
                  {selectedMembers.length > 0
                    ? `Showing entries for ${selectedMembers.length} selected member${selectedMembers.length > 1 ? "s" : ""}`
                    : "Select team members to view their time entries"}
                </CardDescription>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="start-date" className="text-xs">
                      From:
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }))
                      }
                      className="w-auto h-8 text-xs border-gray-200 rounded-md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="end-date" className="text-xs">
                      To:
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }))
                      }
                      className="w-auto h-8 text-xs border-gray-200 rounded-md"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadTimeEntries}
                    disabled={selectedMembers.length === 0 || entriesLoading}
                    className="ml-auto text-xs border-gray-200 hover:bg-gray-50"
                  >
                    {entriesLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Filter className="w-3 h-3 mr-1" />
                        Apply Filter
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {entriesLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedMembers.length > 0 ? (
                  timeEntries.length > 0 ? (
                    <div className="space-y-2">
                      {timeEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`px-2 py-1 rounded-md border border-gray-200 ${getAreaColorClasses(entry.areas?.color || "#3B82F6")}`}
                              >
                                {entry.areas?.name || "Unknown Area"}
                              </div>
                              <span className="text-sm text-gray-500">
                                {entry.fields?.name || "Unknown Field"} &gt;{" "}
                                {entry.activities?.name || "Unknown Activity"}
                              </span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {entry.duration.toFixed(1)}h
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm">
                                {entry.description || "No description"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs border-gray-200 text-gray-700">
                                  {formatDate(entry.date)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {entry.users?.full_name || "Unknown User"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No time entries found for the selected period</p>
                      <p className="text-sm">Try adjusting your date range</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Select team members to view their time entries</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
