import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Add proper headers to avoid 406 errors

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      },
    );

    // Get all auth users
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      throw new Error(`Error fetching auth users: ${authError.message}`);
    }

    const results = [];

    // For each auth user, ensure they have a corresponding public.users record
    for (const user of authUsers.users) {
      // Check if user exists in public.users table
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) {
        results.push({
          user_id: user.id,
          status: "error",
          message: `Error checking user: ${checkError.message}`,
        });
        continue;
      }

      if (!existingUser) {
        // Create user in public.users table
        const { error: insertError } = await supabaseAdmin
          .from("users")
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || "",
            email: user.email || "",
            onboarded: false,
            role: "employee",
          });

        if (insertError) {
          results.push({
            user_id: user.id,
            status: "error",
            message: `Error creating user: ${insertError.message}`,
          });
        } else {
          results.push({
            user_id: user.id,
            status: "created",
            message: "User created successfully",
          });
        }
      } else {
        results.push({
          user_id: user.id,
          status: "exists",
          message: "User already exists",
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
