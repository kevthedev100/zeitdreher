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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Users,
  UserPlus,
  Mail,
  Calendar,
  Clock,
  BarChart3,
  Trash2,
  RefreshCw,
  AlertCircle,
  Building,
} from "lucide-react";
import { createClient } from "../../../supabase/client";
import {
  getTeamMembers,
  getTeamInvitations,
  inviteTeamMember,
  removeTeamMember,
  checkUserManagementPermission,
  getUserOrganizations,
  changeUserRole,
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import CreateOrganizationDialog from "@/components/create-organization-dialog";
import OrganizationSelector from "@/components/organization-selector";

// Recent Activities Component
function RecentActivities({
  organizationId,
}: {
  organizationId: string | null;
}) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (organizationId) {
      loadActivities();
    } else {
      setActivities([]);
      setLoading(false);
    }
  }, [organizationId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("team_activities")
        .select(
          `
          *,
          user:user_id(full_name, email),
          created_by_user:created_by(full_name)
        `,
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading team activities:", error);
        setActivities([]);
      } else {
        setActivities(data || []);
      }
    } catch (error) {
      console.error("Error loading team activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `vor ${diffInMinutes} Min.`;
    } else if (diffInHours < 24) {
      return `vor ${Math.floor(diffInHours)} Std.`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `vor ${diffInDays} Tag${diffInDays > 1 ? "en" : ""}`;
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "member_joined":
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case "member_removed":
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case "role_changed":
        return <Users className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Keine aktuellen Aktivitäten</p>
        <p className="text-sm">Team-Aktivitäten werden hier angezeigt</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex-shrink-0 mt-1">
            {getActivityIcon(activity.activity_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {activity.description}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatActivityTime(activity.created_at)}
            </p>
            {activity.metadata && activity.metadata.user_email && (
              <p className="text-xs text-gray-400 mt-1">
                {activity.metadata.user_email}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TeamTabProps {
  userRole: "admin" | "manager" | "employee";
}

interface TeamMember {
  id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    avatar_url: string;
    created_at: string;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
}

export default function TeamTab({ userRole }: TeamTabProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    totalHoursThisWeek: 0,
    totalHoursThisMonth: 0,
    averageHoursPerMember: 0,
  });
  const [hasOrganization, setHasOrganization] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);

  const supabase = createClient();

  useEffect(() => {
    if (userRole === "admin") {
      checkOrganizationStatus();
    }
  }, [userRole]);

  const checkOrganizationStatus = async () => {
    try {
      const organizations = await getUserOrganizations() as any[];
      setHasOrganization(organizations.length > 0);
      if (organizations.length > 0) {
        setSelectedOrganizationId(organizations[0].organization.id);
        loadTeamData();
      }
    } catch (error) {
      console.error("Error checking organization status:", error);
    }
  };

  const loadTeamData = async () => {
    try {
      setLoading(true);

      // Load team members and invitations
      const [membersData, invitationsData] = await Promise.all([
        getTeamMembers(selectedOrganizationId || undefined),
        getTeamInvitations(),
      ]);

      setTeamMembers(membersData || []);
      setInvitations(invitationsData || []);

      // Calculate team statistics
      await calculateTeamStats(membersData || []);
    } catch (error) {
      console.error("Error loading team data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamStats = async (members: TeamMember[]) => {
    try {
      const memberIds = members.map((m) => m.user.user_id);

      if (memberIds.length === 0) {
        setTeamStats({
          totalMembers: 0,
          totalHoursThisWeek: 0,
          totalHoursThisMonth: 0,
          averageHoursPerMember: 0,
        });
        return;
      }

      // Get current date ranges
      const now = new Date();
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(now.getDate() - daysToMonday);
      const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

      // Query time entries for team members
      const { data: weekEntries } = await supabase
        .from("time_entries")
        .select("duration, user_id")
        .in("user_id", memberIds)
        .gte("date", startOfWeekStr)
        .eq("status", "active");

      const { data: monthEntries } = await supabase
        .from("time_entries")
        .select("duration, user_id")
        .in("user_id", memberIds)
        .gte("date", startOfMonthStr)
        .eq("status", "active");

      const totalHoursThisWeek = (weekEntries || []).reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );
      const totalHoursThisMonth = (monthEntries || []).reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );
      const averageHoursPerMember =
        members.length > 0 ? totalHoursThisMonth / members.length : 0;

      setTeamStats({
        totalMembers: members.length,
        totalHoursThisWeek,
        totalHoursThisMonth,
        averageHoursPerMember,
      });
    } catch (error) {
      console.error("Error calculating team stats:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newUserData.fullName.trim() ||
      !newUserData.email.trim() ||
      !newUserData.password.trim()
    ) {
      console.error("All fields are required");
      return;
    }
    if (!selectedOrganizationId) {
      console.error("No organization selected");
      return;
    }

    setAddUserLoading(true);
    try {
      const formData = new FormData();
      formData.append("full_name", newUserData.fullName);
      formData.append("email", newUserData.email);
      formData.append("password", newUserData.password);
      formData.append("role", "member"); // Default role for new users
      formData.append("organization_id", selectedOrganizationId);
      formData.append("admin_created", "true"); // Flag to indicate admin creation

      // Import the createUserAction from actions
      const { createUserAction } = await import("@/app/actions");
      const result = await createUserAction(formData);

      if (result.success) {
        // Refresh data and close dialog
        await loadTeamData();
        setNewUserData({ fullName: "", email: "", password: "" });
        setAddUserDialogOpen(false);
        console.log("User created successfully:", result.message);
      } else {
        console.error("Error creating user:", result.error);
        // You might want to show an error toast here
      }
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      // Check if current user has permission to remove this member
      const canManage = await checkUserManagementPermission(memberId);
      if (!canManage) {
        console.error("You don't have permission to remove this team member");
        return;
      }

      const result = await removeTeamMember(memberId);
      if (result.success) {
        await loadTeamData();
      } else {
        console.error("Error removing team member:", result.error);
      }
    } catch (error) {
      console.error("Error removing team member:", error);
    }
  };

  if (!["admin", "manager"].includes(userRole)) {
    return (
      <div className="bg-white p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            Only administrators and managers can access team management.
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
          {!hasOrganization && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-yellow-600" />
                  Organization Required
                </CardTitle>
                <CardDescription>
                  You need to create an organization before you can invite team
                  members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Organizations help you manage teams and track time entries
                  across your company. Create your first organization to get
                  started.
                </p>
                <CreateOrganizationDialog
                  onOrganizationCreated={checkOrganizationStatus}
                />
              </CardContent>
            </Card>
          )}

          {hasOrganization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Your Organizations
                </CardTitle>
                <CardDescription>
                  Select an organization to manage its team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationSelector
                  onOrganizationSelected={(orgId) => {
                    setSelectedOrganizationId(orgId);
                    loadTeamData();
                  }}
                />
              </CardContent>
            </Card>
          )}
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Team Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your team members and view team analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadTeamData}
                disabled={loading || !hasOrganization}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              {hasOrganization ? (
                <Dialog
                  open={addUserDialogOpen}
                  onOpenChange={setAddUserDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Nutzer Hinzufügen
                    </Button>
                  </DialogTrigger>
                </Dialog>
              ) : (
                <CreateOrganizationDialog
                  onOrganizationCreated={checkOrganizationStatus}
                />
              )}
              {hasOrganization && (
                <Dialog
                  open={addUserDialogOpen}
                  onOpenChange={setAddUserDialogOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Neuen Nutzer Hinzufügen</DialogTitle>
                      <DialogDescription>
                        Erstellen Sie einen neuen Nutzer für Ihre Organisation.
                        Der Nutzer wird automatisch als Mitglied hinzugefügt.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Vollständiger Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={newUserData.fullName}
                          onChange={(e) =>
                            setNewUserData((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          placeholder="Max Mustermann"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">E-Mail-Adresse</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserData.email}
                          onChange={(e) =>
                            setNewUserData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          placeholder="max.mustermann@example.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Passwort</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUserData.password}
                          onChange={(e) =>
                            setNewUserData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Mindestens 6 Zeichen"
                          minLength={6}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setAddUserDialogOpen(false);
                            setNewUserData({
                              fullName: "",
                              email: "",
                              password: "",
                            });
                          }}
                        >
                          Abbrechen
                        </Button>
                        <Button type="submit" disabled={addUserLoading}>
                          {addUserLoading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4 mr-2" />
                          )}
                          Nutzer Erstellen
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Team Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-2xl font-bold">
                  {teamStats.totalMembers}
                </div>
                <p className="text-xs text-muted-foreground">Active members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-2xl font-bold">
                  {teamStats.totalHoursThisWeek.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">Team total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2">
                <CardTitle className="text-sm font-medium">
                  This Month
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-2xl font-bold">
                  {teamStats.totalHoursThisMonth.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">Team total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 py-2">
                <CardTitle className="text-sm font-medium">Average</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-3 py-2">
                <div className="text-2xl font-bold">
                  {teamStats.averageHoursPerMember.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  Per member/month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members ({teamMembers.length})
                </CardTitle>
                <CardDescription>
                  Manage your active team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 3 }).map((_, i) => (
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
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {member.user.full_name?.charAt(0) ||
                                member.user.email.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {member.user.full_name || "No name"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.user.email}
                            </p>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Badge
                                    variant={
                                      member.role === "admin"
                                        ? "default"
                                        : member.role === "manager"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className="text-xs cursor-pointer hover:bg-gray-100"
                                  >
                                    {member.role}
                                  </Badge>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Change Member Role
                                    </DialogTitle>
                                    <DialogDescription>
                                      Update the role for{" "}
                                      {member.user.full_name ||
                                        member.user.email}
                                      . Different roles have different
                                      permissions in the system.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const formData = new FormData(
                                        e.currentTarget,
                                      );
                                      formData.append(
                                        "target_user_id",
                                        member.user.user_id,
                                      );
                                      formData.append(
                                        "organization_id",
                                        selectedOrganizationId || "",
                                      );
                                      changeUserRole(formData).then(
                                        (result) => {
                                          if (result.success) {
                                            loadTeamData();
                                          } else {
                                            console.error(
                                              "Error changing role:",
                                              result.error,
                                            );
                                          }
                                        },
                                      );
                                    }}
                                    className="space-y-4 mt-4"
                                  >
                                    <div className="space-y-2">
                                      <Label htmlFor="new_role">
                                        Select Role
                                      </Label>
                                      <select
                                        id="new_role"
                                        name="new_role"
                                        className="w-full p-2 border rounded-md"
                                        defaultValue={member.role}
                                      >
                                        {userRole === "admin" && (
                                          <option value="admin">Admin</option>
                                        )}
                                        <option value="manager">Manager</option>
                                        <option value="member">Member</option>
                                      </select>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Admin: Full access to all features
                                        <br />
                                        Manager: Can manage team members and
                                        view team data
                                        <br />
                                        Member: Basic access to time tracking
                                        features
                                      </p>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                          document
                                            .querySelector(
                                              '[data-state="open"]',
                                            )
                                            ?.dispatchEvent(new Event("close"))
                                        }
                                      >
                                        Cancel
                                      </Button>
                                      <Button type="submit">Update Role</Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <p className="text-xs text-gray-400">
                                Joined{" "}
                                {new Date(
                                  member.joined_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Team Member
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove{" "}
                                  {member.user.full_name || member.user.email}{" "}
                                  from your team? This action cannot be undone
                                  and they will lose access to team features.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRemoveMember(member.user.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove Member
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No team members yet</p>
                    <p className="text-sm">
                      Fügen Sie Ihren ersten Nutzer hinzu, um zu beginnen
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Letzte Aktivitäten
                </CardTitle>
                <CardDescription>
                  Übersicht der neuesten Team-Aktivitäten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivities organizationId={selectedOrganizationId} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
