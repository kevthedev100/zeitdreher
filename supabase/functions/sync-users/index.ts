import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get request body
    const { userId, syncAll } = await req.json();

    let results;

    if (syncAll === true) {
      // Sync all auth users to public users
      const { data, error } = await supabaseAdmin.rpc(
        "sync_all_auth_users_to_public",
      );

      if (error) {
        throw new Error(`Error syncing all users: ${error.message}`);
      }

      results = {
        message: "All users synced successfully",
        synced: data,
      };
    } else if (userId) {
      // Sync a specific user
      const { data, error } = await supabaseAdmin.rpc(
        "create_public_user_from_auth",
        { auth_user_id: userId },
      );

      if (error) {
        throw new Error(`Error syncing user ${userId}: ${error.message}`);
      }

      results = {
        message: `User ${userId} synced successfully`,
        success: data,
      };
    } else {
      throw new Error("Missing userId or syncAll parameter");
    }

    return new Response(JSON.stringify(results), {
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
