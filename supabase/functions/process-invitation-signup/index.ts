import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const { invitationId, userEmail, userId } = await req.json();

    console.log("Processing invitation signup:", {
      invitationId,
      userEmail,
      userId,
    });

    if (!invitationId || !userEmail || !userId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: invitationId, userEmail, userId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Get the invitation details
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("team_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("email", userEmail)
      .eq("accepted", false)
      .single();

    if (invitationError || !invitation) {
      console.error("Invitation not found:", invitationError);
      return new Response(
        JSON.stringify({
          error: "Invalid or expired invitation",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({
          error: "Invitation has expired",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create or update user record with the invited role
    const { error: userError } = await supabaseAdmin.from("users").upsert(
      {
        user_id: userId,
        email: userEmail,
        role: invitation.role,
        onboarded: false,
        is_active: true,
      },
      {
        onConflict: "user_id",
      },
    );

    if (userError) {
      console.error("Error creating/updating user:", userError);
      return new Response(
        JSON.stringify({
          error: "Failed to create user record",
          details: userError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Mark invitation as accepted
    const { error: acceptError } = await supabaseAdmin
      .from("team_invitations")
      .update({
        accepted: true,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (acceptError) {
      console.error("Error accepting invitation:", acceptError);
      return new Response(
        JSON.stringify({
          error: "Failed to accept invitation",
          details: acceptError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Invitation processed successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: userEmail,
          role: invitation.role,
        },
        invitation: {
          id: invitationId,
          accepted: true,
          role: invitation.role,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing invitation signup:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
