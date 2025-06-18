"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const isInvitation = formData.get("invitation")?.toString() === "true";
  const invitationRole = formData.get("role")?.toString() || "member";
  const invitationToken = formData.get("token")?.toString();
  const supabase = await createClient();

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  }

  // User data is automatically inserted into public.users table via database trigger
  // Double-check that the user was created in the public.users table
  if (user) {
    const { data: publicUser, error: publicUserError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (publicUserError || !publicUser) {
      // If the user wasn't created in the public.users table, create it manually
      // Set role based on invitation or default to admin for non-invited users
      const userRole = isInvitation ? invitationRole : "admin";

      await supabase.from("users").upsert({
        user_id: user.id,
        full_name: fullName,
        email: email,
        token_identifier: Math.random().toString(36).substring(2, 15),
        role: userRole,
        onboarded: false,
      });
    } else if (isInvitation) {
      // Update existing user role if they were invited
      await supabase
        .from("users")
        .update({ role: invitationRole })
        .eq("user_id", user.id);
    }

    // If this is an invitation signup, check for pending invitations and process them
    if (isInvitation) {
      // If we have a token, use it to find the invitation
      const query = supabase
        .from("team_invitations")
        .select("*")
        .eq("email", email)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      // If we have a token, add it to the query
      const { data: pendingInvitation } = await query.single();

      if (pendingInvitation) {
        // Get the inviter's organization
        const { data: inviterData } = await supabase
          .from("organization_hierarchy")
          .select("organization_id, user_id")
          .eq("user_id", pendingInvitation.invited_by)
          .single();

        if (inviterData) {
          // Add user to the organization
          const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (userData) {
            await supabase.from("organization_members").insert({
              organization_id: inviterData.organization_id,
              user_id: userData.id,
              role: invitationRole,
              invited_by: inviterData.user_id,
              joined_at: new Date().toISOString(),
            });

            // Mark invitation as used (delete it)
            await supabase
              .from("team_invitations")
              .delete()
              .eq("id", pendingInvitation.id);
          }
        }
      }
    }
  }

  const successMessage = isInvitation
    ? "Welcome to the team! Please check your email for a verification link."
    : "Thanks for signing up! Please check your email for a verification link.";

  return encodedRedirect("success", "/sign-up", successMessage);
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard/reset-password",
    "Password updated",
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    return false;
  }

  return !!subscription;
};

// Time tracking actions
export const getAreas = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("areas")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data;
};

export const getFieldsByArea = async (areaId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fields")
    .select("*")
    .eq("area_id", areaId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data;
};

export const getActivitiesByField = async (fieldId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("field_id", fieldId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data;
};

export const createArea = async (formData: FormData) => {
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const color = formData.get("color")?.toString() || "#3B82F6";

  if (!name) {
    return { success: false, error: "Area name is required" };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data, error } = await supabase
    .from("areas")
    .insert({ name, description, color, user_id: user.id })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

export const createField = async (formData: FormData) => {
  const areaId = formData.get("area_id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();

  if (!areaId || !name) {
    return { success: false, error: "Area and field name are required" };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data, error } = await supabase
    .from("fields")
    .insert({ area_id: areaId, name, description, user_id: user.id })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

export const createActivity = async (formData: FormData) => {
  const fieldId = formData.get("field_id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();

  if (!fieldId || !name) {
    return { success: false, error: "Field and activity name are required" };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({ field_id: fieldId, name, description, user_id: user.id })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

// Delete functions for categories
export const deleteArea = async (areaId: string) => {
  const supabase = await createClient();

  // Check if area has fields
  const { data: fields, error: fieldsError } = await supabase
    .from("fields")
    .select("id")
    .eq("area_id", areaId)
    .eq("is_active", true);

  if (fieldsError) {
    return { success: false, error: fieldsError.message };
  }

  if (fields && fields.length > 0) {
    return {
      success: false,
      error:
        "Cannot delete area with existing fields. Please delete all fields first.",
    };
  }

  // Soft delete the area
  const { error } = await supabase
    .from("areas")
    .update({ is_active: false })
    .eq("id", areaId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const deleteField = async (fieldId: string) => {
  const supabase = await createClient();

  // Check if field has activities
  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select("id")
    .eq("field_id", fieldId)
    .eq("is_active", true);

  if (activitiesError) {
    return { success: false, error: activitiesError.message };
  }

  if (activities && activities.length > 0) {
    return {
      success: false,
      error:
        "Cannot delete field with existing activities. Please delete all activities first.",
    };
  }

  // Soft delete the field
  const { error } = await supabase
    .from("fields")
    .update({ is_active: false })
    .eq("id", fieldId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const deleteActivity = async (activityId: string) => {
  const supabase = await createClient();

  // Check if activity has time entries
  const { data: timeEntries, error: timeEntriesError } = await supabase
    .from("time_entries")
    .select("id")
    .eq("activity_id", activityId)
    .eq("status", "active");

  if (timeEntriesError) {
    return { success: false, error: timeEntriesError.message };
  }

  if (timeEntries && timeEntries.length > 0) {
    return {
      success: false,
      error:
        "Cannot delete activity with existing time entries. Please archive or delete time entries first.",
    };
  }

  // Soft delete the activity
  const { error } = await supabase
    .from("activities")
    .update({ is_active: false })
    .eq("id", activityId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

export const createTimeEntry = async (formData: FormData) => {
  const areaId = formData.get("area_id")?.toString();
  const fieldId = formData.get("field_id")?.toString();
  const activityId = formData.get("activity_id")?.toString();
  const duration = parseFloat(formData.get("duration")?.toString() || "0");
  const date = formData.get("date")?.toString();
  const startTime = formData.get("start_time")?.toString();
  const endTime = formData.get("end_time")?.toString();
  const description = formData.get("description")?.toString();

  console.log("Creating time entry with data:", {
    areaId,
    fieldId,
    activityId,
    duration,
    date,
    startTime,
    endTime,
    description,
  });

  if (!areaId || !fieldId || !activityId || !duration || !date) {
    console.error("Missing required fields for time entry creation");
    return encodedRedirect(
      "error",
      "/dashboard",
      "All required fields must be filled",
    );
  }

  // Validate UUID format for IDs
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Check if the IDs are mock IDs (non-UUID format)
  const isMockId = (id: string) => !uuidRegex.test(id);

  // Don't allow mock IDs - return an error instead
  if (isMockId(areaId) || isMockId(fieldId) || isMockId(activityId)) {
    console.error("Invalid IDs detected in time entry creation");
    return encodedRedirect(
      "error",
      "/dashboard",
      "Ungültige Kategorie-IDs. Bitte wählen Sie gültige Kategorien aus.",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User authentication error:", userError);
    return encodedRedirect(
      "error",
      "/sign-in",
      "Please sign in to create time entries",
    );
  }

  console.log("Creating time entry for user:", user.id);

  // Instead of manually inserting users, we'll rely on the handle_new_user trigger
  // that automatically creates entries in public.users when auth.users are created
  // If the user doesn't exist in public.users, we should redirect them to re-authenticate
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (userDataError || !userData) {
    console.log("User not found in public.users table");
    return encodedRedirect(
      "error",
      "/sign-in",
      "Session error. Please sign out and sign in again.",
    );
  }

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: user.id,
      area_id: areaId,
      field_id: fieldId,
      activity_id: activityId,
      duration,
      date,
      start_time: startTime,
      end_time: endTime,
      description,
      status: "active",
    })
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
    console.error("Database error creating time entry:", error);
    return encodedRedirect(
      "error",
      "/dashboard",
      `Database error: ${error.message}`,
    );
  }

  console.log("Time entry created successfully:", data);

  return {
    success: true,
    data,
    message: "Time entry created successfully",
  };
};

export const getTeamMembers = async (organizationId?: string) => {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Get user's role and organization from the organization_hierarchy view
  const { data: userHierarchy } = await supabase
    .from("organization_hierarchy")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!userHierarchy) return [];

  // Make sure userHierarchy is defined with a fallback
  const userHierarchyData = userHierarchy || {
    organization_id: null,
    user_role: "member",
  };
  const orgId = organizationId || userHierarchyData.organization_id;
  if (!orgId) return [];

  // Get team members based on user role using helper functions
  if (userHierarchy.user_role === "admin") {
    // Admins can see all organization members
    const { data, error } = await supabase
      .from("organization_hierarchy")
      .select("*")
      .eq("organization_id", orgId);

    if (error) {
      console.error("Error fetching team members for admin:", error);
      return [];
    }

    return (
      data?.map((member) => ({
        id: member.user_id,
        role: member.user_role,
        joined_at: new Date().toISOString(), // Placeholder since view doesn't have this
        user: {
          id: member.user_id,
          user_id: member.user_id,
          full_name: member.user_name,
          email: member.user_email,
          avatar_url: null,
          created_at: new Date().toISOString(),
        },
      })) || []
    );
  } else if (userHierarchy.user_role === "manager") {
    // Managers can see their team members using the helper function
    const { data, error } = await supabase.rpc("get_user_team_members", {
      user_uuid: user.id,
      org_id: orgId,
    });

    if (error) {
      console.error("Error fetching team members for manager:", error);
      return [];
    }

    return (
      data?.map((member) => ({
        id: member.member_id,
        role: "member", // Team members are typically members
        joined_at: member.joined_at,
        user: {
          id: member.member_id,
          user_id: member.member_id,
          full_name: member.member_name,
          email: member.member_email,
          avatar_url: null,
          created_at: member.joined_at,
        },
      })) || []
    );
  }

  return [];
};

export const getTeamInvitations = async () => {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Get pending invitations
  const { data, error } = await supabase
    .from("team_invitations")
    .select("*")
    .gt("expires_at", new Date().toISOString()); // Only get non-expired invitations

  if (error) {
    console.error("Error fetching team invitations:", error);
    return [];
  }

  return data;
};

export const removeTeamMember = async (memberId: string) => {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Check if the user is an admin
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (userError || !userData || userData.role !== "admin") {
    return { success: false, error: "Only admins can remove team members" };
  }

  // Remove the team member
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("member_id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Organization management actions
export const createOrganization = async (formData: FormData) => {
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();

  if (!name) {
    return { success: false, error: "Organization name is required" };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User data not found" };
  }

  try {
    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name,
        description,
        created_by: userData.id,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Error creating organization:", orgError);
      return { success: false, error: orgError.message };
    }

    // Add creator as admin
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: userData.id,
        role: "admin",
        invited_by: userData.id,
        joined_at: new Date().toISOString(),
        is_active: true,
      });

    if (memberError) {
      console.error("Error adding creator as admin:", memberError);
      return { success: false, error: memberError.message };
    }

    console.log("Organization created successfully:", org);
    return { success: true, data: org };
  } catch (error) {
    console.error("Unexpected error creating organization:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

export const getUserOrganizations = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  try {
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!userData) {
      console.log("User data not found in users table");
      return [];
    }

    const { data, error } = await supabase
      .from("organization_members")
      .select(
        `
        role,
        joined_at,
        organization:organization_id(
          id,
          name,
          description,
          created_at
        )
      `,
      )
      .eq("user_id", userData.id)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching organizations:", error);
      return [];
    }

    console.log(`Found ${data?.length || 0} organizations for user`);
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching organizations:", error);
    return [];
  }
};

export const changeUserRole = async (formData: FormData) => {
  const targetUserId = formData.get("target_user_id")?.toString();
  const newRole = formData.get("new_role")?.toString();
  const organizationId = formData.get("organization_id")?.toString();

  if (!targetUserId || !newRole || !organizationId) {
    return { success: false, error: "Missing required parameters" };
  }

  if (!["admin", "manager", "member"].includes(newRole)) {
    return { success: false, error: "Invalid role" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Use the database function to change role with proper authorization
    const { data, error } = await supabase.rpc("change_user_role", {
      target_user_id: targetUserId,
      new_role: newRole,
      org_id: organizationId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to change user role",
    };
  }
};

export const assignManagerToMember = async (formData: FormData) => {
  const managerId = formData.get("manager_id")?.toString();
  const memberId = formData.get("member_id")?.toString();
  const organizationId = formData.get("organization_id")?.toString();

  if (!managerId || !memberId || !organizationId) {
    return { success: false, error: "Missing required parameters" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Get current user data
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!userData) {
    return { success: false, error: "User data not found" };
  }

  // Create team hierarchy relationship
  const { error } = await supabase.from("team_hierarchies").insert({
    organization_id: organizationId,
    manager_id: managerId,
    member_id: memberId,
    created_by: userData.id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Get team performance data using the new database view
export const getTeamPerformanceData = async (organizationId?: string) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Get user's role and organization
  const { data: userHierarchy } = await supabase
    .from("organization_hierarchy")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!userHierarchy) return [];

  const orgId = organizationId || userHierarchy.organization_id;
  if (!orgId) return [];

  // Get team performance data based on user role
  let query = supabase
    .from("manager_team_performance")
    .select("*")
    .eq("organization_id", orgId);

  // If user is a manager, only show their team's performance
  if (userHierarchy.user_role === "manager") {
    query = query.eq("manager_id", userHierarchy.user_id);
  }
  // Admins see all team performance data (no additional filter)

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching team performance data:", error);
    return [];
  }

  return data || [];
};

// Check if user can manage another user using the database function
export const checkUserManagementPermission = async (
  targetUserId: string,
  organizationId?: string,
) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  // Get user's organization if not provided
  let orgId = organizationId;
  if (!orgId) {
    const { data: userHierarchy } = await supabase
      .from("organization_hierarchy")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    orgId = userHierarchy?.organization_id;
  }

  if (!orgId) return false;

  // Use the database function to check permissions
  const { data, error } = await supabase.rpc("can_user_manage", {
    manager_uuid: user.id,
    target_user_id: targetUserId,
    org_id: orgId,
  });

  if (error) {
    console.error("Error checking user management permission:", error);
    return false;
  }

  return data || false;
};

export const inviteTeamMember = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const role = formData.get("role")?.toString() || "member";
  const organizationId = formData.get("organization_id")?.toString();

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  if (!organizationId) {
    return { success: false, error: "Organization ID is required" };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    // Get user data first
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (!userData || userDataError) {
      console.error("Failed to retrieve user data:", userDataError);
      return {
        success: false,
        error:
          "User data not found. Please try signing out and signing in again.",
      };
    }

    // Get organization membership to check permissions
    const { data: orgMember, error: orgMemberError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userData.id)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .single();

    if (!orgMember || orgMemberError) {
      console.error(
        "Failed to retrieve organization membership:",
        orgMemberError,
      );
      return {
        success: false,
        error:
          "You don't appear to be a member of this organization or don't have permission to invite members.",
      };
    }

    // Check if user has permission to invite (admin or manager)
    if (!["admin", "manager"].includes(orgMember.role)) {
      return {
        success: false,
        error: "Only admins and managers can invite members",
      };
    }

    // Validate role
    if (!["admin", "manager", "member"].includes(role)) {
      return { success: false, error: "Invalid role specified" };
    }

    // Managers can only invite members, not admins or other managers
    if (orgMember.role === "manager" && role !== "member") {
      return { success: false, error: "Managers can only invite members" };
    }

    // Check if the email is already registered
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, user_id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      // Check if user is already in the organization
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", existingUser.id)
        .single();

      if (existingMember) {
        return {
          success: false,
          error: "User is already a member of this organization",
        };
      }

      // Add user to organization
      const { error: orgError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: existingUser.id,
          role: role,
          invited_by: userData.id,
          joined_at: new Date().toISOString(),
          is_active: true,
        });

      if (orgError) {
        return {
          success: false,
          error: `Error adding organization member: ${orgError.message}`,
        };
      }

      // If inviting as a manager, create team hierarchy relationship
      if (orgMember.role === "manager" && role === "member") {
        const { error: hierarchyError } = await supabase
          .from("team_hierarchies")
          .insert({
            organization_id: organizationId,
            manager_id: userData.id,
            member_id: existingUser.id,
            created_by: userData.id,
            is_active: true,
          });

        if (hierarchyError) {
          console.error("Error creating team hierarchy:", hierarchyError);
          // Don't fail the invitation, just log the error
        }
      }

      return { success: true, message: "Team member added successfully" };
    }

    // Call the Edge Function to send invitation via Supabase Auth
    const response = await supabase.functions.invoke(
      "supabase-functions-send-team-invitation",
      {
        body: {
          email,
          role: role,
          organizationId: organizationId,
          inviterUserId: userData.id,
          redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/sign-up?invitation=true&role=${role}`,
        },
      },
    );

    if (response.error) {
      console.error("Edge function error:", response.error);
      return {
        success: false,
        error: `Failed to send invitation: ${response.error.message}`,
      };
    }

    // Store invitation in our database for tracking
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { error: inviteError } = await supabase
      .from("team_invitations")
      .insert({
        email,
        invited_by: userData.id,
        expires_at: expiresAt.toISOString(),
        role: role,
      });

    if (inviteError) {
      console.error("Error storing invitation:", inviteError);
      // Don't fail the invitation since the email was sent
    }

    return { success: true, message: "Invitation sent successfully" };
  } catch (error) {
    console.error("Error sending invitation:", error);
    return { success: false, error: "Failed to send invitation" };
  }
};
