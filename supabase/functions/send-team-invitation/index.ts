import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);
const allowedRoles = ["admin", "manager", "member"];

// CORS headers for handling cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// Email template for invitations
const createInvitationEmailTemplate = (
  signUpLink: string,
  organizationName: string,
  inviterName: string,
  role: string,
) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation - TimeFocusAI</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 TimeFocusAI</h1>
          <h2>Team Invitation</h2>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on TimeFocusAI as a <strong>${role}</strong>.</p>
          <p>TimeFocusAI is a modern time tracking platform that helps teams efficiently record and analyze work hours through both manual entry and voice recognition.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <p style="text-align: center;">
            <a href="${signUpLink}" class="button">Accept Invitation & Sign Up</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 4px; font-family: monospace;">${signUpLink}</p>
          <p><strong>This invitation will expire in 7 days.</strong></p>
          <p>If you did not expect this invitation, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br/>The TimeFocusAI Team</p>
          <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Team Invitation - TimeFocusAI

Hello!

${inviterName} has invited you to join ${organizationName} on TimeFocusAI as a ${role}.

TimeFocusAI is a modern time tracking platform that helps teams efficiently record and analyze work hours through both manual entry and voice recognition.

To accept the invitation and create your account, please visit:
${signUpLink}

This invitation will expire in 7 days.

If you did not expect this invitation, please ignore this email.

Best regards,
The TimeFocusAI Team
  `;

  return { html: htmlContent, text: textContent };
};

// Function to send email using Resend SDK
const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text: string,
) => {
  console.log(`Sending email to ${to} with subject: ${subject}`);

  try {
    const { data, error } = await resend.emails.send({
      from: "Team TimeFocusAI <team@timefocusai.de>",
      to: [to],
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.error("Resend SDK error:", error);
      throw new Error(`Resend SDK error: ${JSON.stringify(error)}`);
    }

    console.log("Email sent successfully via Resend SDK:", data);
    return { id: data.id };
  } catch (error) {
    console.error("Error sending email via Resend SDK:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body with error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      email,
      role,
      organizationId,
      inviterUserId,
      organizationName,
      inviterName,
    } = requestData;

    console.log("Received invitation request:", {
      email,
      role,
      organizationId,
      inviterUserId,
      organizationName,
      inviterName,
    });

    if (!email || !role || !organizationId || !inviterUserId) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: email, role, organizationId, inviterUserId",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Invalid email format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate role
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({
          error: `Invalid role. Allowed roles are: ${allowedRoles.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check if invitation already exists and is not expired
    const { data: existingInvitation, error: invitationCheckError } =
      await supabase
        .from("team_invitations")
        .select("*")
        .eq("email", email)
        .eq("accepted", false)
        .gt("expires_at", new Date().toISOString())
        .single();

    if (invitationCheckError && invitationCheckError.code !== "PGRST116") {
      console.error(
        "Error checking existing invitation:",
        invitationCheckError,
      );
      return new Response(
        JSON.stringify({
          error: "Database error while checking existing invitation",
          details: invitationCheckError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (existingInvitation) {
      return new Response(
        JSON.stringify({
          error: "An active invitation already exists for this email address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate a secure random token for invitation tracking
    const token = crypto.randomUUID();

    // Set default expiration to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store invitation in the database
    const { data: invitationData, error: inviteError } = await supabase
      .from("team_invitations")
      .insert({
        email,
        invited_by: inviterUserId,
        expires_at: expiresAt.toISOString(),
        role: role,
        accepted: false,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error storing invitation:", inviteError);
      return new Response(
        JSON.stringify({
          error: "Failed to store invitation",
          details: inviteError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create signup link with invitation token
    let baseUrl;
    try {
      // Try to get from request URL first
      const requestUrl = new URL(req.url);
      baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    } catch (urlError) {
      // Fallback to environment variable or default
      baseUrl =
        Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")?.replace("/supabase", "") ||
        "https://bold-edison6-smedu.view-3.tempo-dev.app";
    }

    const signUpLink = `${baseUrl}/sign-up?invitation=${invitationData.id}&token=${token}&email=${encodeURIComponent(email)}&role=${role}&org=${organizationId}`;

    console.log("Generated signup link:", signUpLink);

    // Generate email content using simple template
    const { html, text } = createInvitationEmailTemplate(
      signUpLink,
      organizationName || "Your Organization",
      inviterName || "Team Admin",
      role,
    );

    // Send invitation email
    try {
      const emailResult = await sendEmail(
        email,
        `You're invited to join ${organizationName || "our team"} on TimeFocusAI`,
        html,
        text,
      );

      console.log("Email sent successfully:", emailResult);

      return new Response(
        JSON.stringify({
          message: "Invitation sent successfully",
          emailId: emailResult.id,
          invitation: {
            id: invitationData.id,
            email,
            role,
            expires_at: expiresAt.toISOString(),
            signup_link: signUpLink,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (emailError) {
      console.error("Failed to send email:", {
        message: emailError.message,
        stack: emailError.stack,
        name: emailError.name,
      });

      // Clean up the invitation record since email failed
      await supabase
        .from("team_invitations")
        .delete()
        .eq("id", invitationData.id);

      return new Response(
        JSON.stringify({
          error: "Failed to send invitation email",
          details: emailError.message,
          debug: {
            emailTo: email,
            subject: `You're invited to join ${organizationName || "our team"} on TimeFocusAI`,
            resendApiKey: RESEND_API_KEY ? "Present" : "Missing",
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Error sending team invitation:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        debug: {
          resendApiKey: RESEND_API_KEY ? "Present" : "Missing",
          supabaseUrl: SUPABASE_URL ? "Present" : "Missing",
          supabaseServiceKey: SUPABASE_SERVICE_ROLE_KEY ? "Present" : "Missing",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
