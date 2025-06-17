// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/examples/supabase-edge-functions

import { corsHeaders } from "../shared/cors.ts";

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, fullName, password } = await req.json();

    // Create user in Supabase Auth
    const supabaseAdminClient =
      Deno.env.get("SUPABASE_URL") && Deno.env.get("SUPABASE_SERVICE_KEY")
        ? createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_KEY")!,
          )
        : null;

    if (!supabaseAdminClient) {
      throw new Error("Supabase admin client could not be initialized");
    }

    // Create the user in Supabase Auth
    const { data: authUser, error: authError } =
      await supabaseAdminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (authError) {
      throw authError;
    }

    // Insert the user into the public.users table
    if (authUser.user) {
      const { error: insertError } = await supabaseAdminClient
        .from("users")
        .insert({
          id: crypto.randomUUID(), // Generate a UUID for the id field
          user_id: authUser.user.id,
          email: email,
          full_name: fullName,
          name: fullName,
          role: "employee",
          onboarded: false,
          token_identifier: Math.random().toString(36).substring(2, 15),
          is_active: true,
        });

      if (insertError) {
        console.error(
          "Error inserting user into public.users table:",
          insertError,
        );
        // Try to delete the auth user if we couldn't create the profile
        await supabaseAdminClient.auth.admin.deleteUser(authUser.user.id);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, user: authUser.user }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// Helper to create Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
