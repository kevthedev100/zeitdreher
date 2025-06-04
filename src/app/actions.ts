"use server";

import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
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
    return encodedRedirect("error", "/dashboard", "Area name is required");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("areas")
    .insert({ name, description, color });

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
  const { error } = await supabase
    .from("fields")
    .insert({ area_id: areaId, name, description });

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
  const { error } = await supabase
    .from("activities")
    .insert({ field_id: fieldId, name, description });

  if (error) {
    return encodedRedirect("error", "/dashboard", error.message);
  }

  return encodedRedirect(
    "success",
    "/dashboard",
    "Activity created successfully",
  );
};

export const createTimeEntry = async (formData: FormData) => {
  const areaId = formData.get("area_id")?.toString();
  const fieldId = formData.get("field_id")?.toString();
  const activityId = formData.get("activity_id")?.toString();
  const duration = parseFloat(formData.get("duration")?.toString() || "0");
  const date = formData.get("date")?.toString();
  const description = formData.get("description")?.toString();

  console.log("Creating time entry with data:", {
    areaId,
    fieldId,
    activityId,
    duration,
    date,
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

  // If using mock data, return a mock success response instead of trying to save to the database
  if (isMockId(areaId) || isMockId(fieldId) || isMockId(activityId)) {
    console.log("Using mock IDs, returning mock success response");
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        user_id: "mock-user-id",
        area_id: areaId,
        field_id: fieldId,
        activity_id: activityId,
        duration,
        date,
        description,
        status: "active",
        created_at: new Date().toISOString(),
        areas: { name: "Mock Area", color: "#3B82F6" },
        fields: { name: "Mock Field" },
        activities: { name: "Mock Activity" },
      },
      message: "Time entry created successfully (mock data)",
    };
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
