import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // SQL to fix the auth.set_last_sign_in_at function
    const { error } = await supabaseClient.rpc("exec_sql", {
      sql_query: `
        -- Fix the auth.set_last_sign_in_at function to handle UUID comparison correctly
        CREATE OR REPLACE FUNCTION auth.set_last_sign_in_at()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          UPDATE auth.users
          SET last_sign_in_at = now()
          WHERE id = NEW.user_id::uuid;
          RETURN NEW;
        END;
        $$;
      `,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Auth schema function updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
