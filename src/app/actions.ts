"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { randomUUID } from "crypto";
import { headers } from "next/headers";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();

  console.log("Starting sign-up process for:", { email, fullName });

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  try {
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
      console.error("Auth signup error:", error);
      return encodedRedirect("error", "/sign-up", error.message);
    }

    console.log("User created in auth.users:", user?.id);

    // User data is automatically inserted into public.users table via database trigger
    // Double-check that the user was created in the public.users table
    if (user) {
      try {
        // First try direct insert with service role client
        const { error: directInsertError } = await supabase
          .from("users")
          .insert({
            id: randomUUID(), // Generate UUID for internal primary key
            user_id: user.id, // Supabase auth user ID as text
            email: email,
            full_name: fullName,
            name: fullName, // Also set the name field
            role: "employee", // Default role is employee
            onboarded: false,
            token_identifier: Math.random().toString(36).substring(2, 15),
            is_active: true,
            email_verified: false,
          });

        if (directInsertError) {
          console.log(
            "Direct insert failed, trying to check if user exists:",
            directInsertError,
          );

          // Check if user already exists
          const { data: publicUser, error: publicUserError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (publicUserError || !publicUser) {
            // If the user wasn't created in the public.users table, try RPC call
            console.log(
              "User not found in public.users table, trying RPC:",
              user.id,
            );

            // Use RPC call to bypass RLS policies
            const { error: rpcError } = await supabase.rpc(
              "create_user_profile",
              {
                p_user_id: user.id,
                p_full_name: fullName,
                p_name: fullName, // Also set the name field
                p_email: email,
                p_token_identifier: Math.random().toString(36).substring(2, 15),
                p_role: "employee", // Default role is employee
                p_onboarded: false,
              },
            );

            if (rpcError) {
              console.error("Error creating user profile via RPC:", rpcError);
              // Continue anyway, as the user might still be created by the auth webhook
            }
          } else {
            // Ensure onboarded is set to false for new users
            if (publicUser.onboarded !== false) {
              console.log(
                "Updating onboarded status to false for new user:",
                user.id,
              );
              await supabase
                .from("users")
                .update({ onboarded: false })
                .eq("user_id", user.id);
            }
          }
        } else {
          console.log("Successfully inserted user into public.users table");
        }

        // Sign in the user immediately after sign up
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error("Error signing in after signup:", signInError);
          return encodedRedirect(
            "error",
            "/sign-in",
            "Please sign in with your new account",
          );
        }

        return redirect("/dashboard/overview");
      } catch (err) {
        console.error("Error in user creation process:", err);
      }
    }
  } catch (err) {
    console.error("Unexpected error during signup:", err);
    return encodedRedirect(
      "error",
      "/sign-up",
      "An unexpected error occurred. Please try again.",
    );
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Check if user exists in public.users table
  if (data.user) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (userError || !userData) {
      // Create user in public.users table if it doesn't exist
      console.log(
        "Creating missing user in public.users table on sign-in:",
        data.user.id,
      );
      await supabase.rpc("create_user_profile", {
        p_user_id: data.user.id,
        p_full_name: data.user.user_metadata?.full_name || "",
        p_name: data.user.user_metadata?.full_name || "", // Also set the name field
        p_email: data.user.email || "",
        p_token_identifier: Math.random().toString(36).substring(2, 15),
        p_role: "employee", // Default role is employee
        p_onboarded: false,
      });
    }
  }

  return redirect("/dashboard/overview");
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
    return encodedRedirect("error", "/dashboard", "Area name is required");
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return encodedRedirect("error", "/dashboard", "User not authenticated");
  }

  const { error } = await supabase
    .from("areas")
    .insert({ name, description, color, user_id: user.id });

  if (error) {
    return encodedRedirect("error", "/dashboard", error.message);
  }

  return encodedRedirect("success", "/dashboard", "Area created successfully");
};

export const createField = async (formData: FormData) => {
  const areaId = formData.get("area_id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();

  if (!areaId || !name) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "Area and field name are required",
    );
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return encodedRedirect("error", "/dashboard", "User not authenticated");
  }

  const { error } = await supabase
    .from("fields")
    .insert({ area_id: areaId, name, description, user_id: user.id });

  if (error) {
    return encodedRedirect("error", "/dashboard", error.message);
  }

  return encodedRedirect("success", "/dashboard", "Field created successfully");
};

export const createActivity = async (formData: FormData) => {
  const fieldId = formData.get("field_id")?.toString();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();

  if (!fieldId || !name) {
    return encodedRedirect(
      "error",
      "/dashboard",
      "Field and activity name are required",
    );
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return encodedRedirect("error", "/dashboard", "User not authenticated");
  }

  const { error } = await supabase
    .from("activities")
    .insert({ field_id: fieldId, name, description, user_id: user.id });

  if (error) {
    return encodedRedirect("error", "/dashboard", error.message);
  }

  return encodedRedirect(
    "success",
    "/dashboard",
    "Activity created successfully",
  );
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
  try {
    // Validate headers
    const headersList = await headers();
    const origin = headersList.get("origin");
    const referer = headersList.get("referer");

    console.log(
      "Server action called with origin:",
      origin,
      "referer:",
      referer,
    );

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
      return {
        success: false,
        error: "All required fields must be filled",
      };
    }

    // Validate UUID format for IDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Check if the IDs are mock IDs (non-UUID format)
    const isMockId = (id: string) => !uuidRegex.test(id);

    // Don't allow mock IDs - return an error instead
    if (isMockId(areaId) || isMockId(fieldId) || isMockId(activityId)) {
      console.error("Invalid IDs detected in time entry creation");
      return {
        success: false,
        error:
          "Ungültige Kategorie-IDs. Bitte wählen Sie gültige Kategorien aus.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User authentication error:", userError);
      return {
        success: false,
        error: "Please sign in to create time entries",
      };
    }

    console.log("Creating time entry for user:", user.id);

    // Check if user exists in public.users table
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (userDataError || !userData) {
      console.log("User not found in public.users table");
      return {
        success: false,
        error: "Session error. Please sign out and sign in again.",
      };
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
      return {
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    console.log("Time entry created successfully:", data);

    return {
      success: true,
      data,
      message: "Time entry created successfully",
    };
  } catch (error) {
    console.error("Unexpected error in createTimeEntry:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
};
