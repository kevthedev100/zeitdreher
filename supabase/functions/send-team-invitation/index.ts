import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for handling cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const { email, role, organizationId, inviterUserId, redirectUrl } =
      await req.json();

    if (!email || !role || !organizationId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, role, organizationId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate role
    if (!["member", "admin", "manager"].includes(role)) {
      return new Response(
        JSON.stringify({
          error: "Invalid role. Must be member, admin, or manager",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Generate a secure random token for invitation tracking
    const token = crypto.randomUUID();

    // Set default expiration to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store invitation in the database
    const { error: inviteError } = await supabaseAdmin
      .from("team_invitations")
      .insert({
        email,
        invited_by: inviterUserId,
        expires_at: expiresAt.toISOString(),
        role: role,
      });

    if (inviteError) {
      console.error("Error storing invitation:", inviteError);
      return new Response(
        JSON.stringify({
          error: "Failed to store invitation",
          details: inviteError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Send invitation email using Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo:
          redirectUrl ||
          `${Deno.env.get("SITE_URL")}/sign-up?invitation=true&role=${role}&token=${token}`,
        data: {
          organization_id: organizationId,
          role: role,
          invitation_token: token,
          invited_by: inviterUserId,
        },
      },
    );

    if (error) {
      console.error("Supabase Auth error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to send invitation",
          details: error,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          email,
          token,
          expires_at: expiresAt.toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error sending team invitation:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
