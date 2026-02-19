import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
  console.error("Missing required environment variables:", {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: !!RESEND_API_KEY,
  });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

// Email template for admin invitations
const createAdminInvitationEmailTemplate = (
  signUpLink: string,
  organizationName: string,
  inviterName: string,
  fullName: string,
) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TimeFocusAI - Account Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 TimeFocusAI</h1>
          <h2>Welcome to the Team!</h2>
        </div>
        <div class="content">
          <p>Hello ${fullName}!</p>
          <p><strong>${inviterName}</strong> has created an account for you at <strong>${organizationName}</strong> on TimeFocusAI.</p>
          
          <div class="highlight">
            <h3>🎉 Special Benefits</h3>
            <p>As a team member added by an administrator, you get:</p>
            <ul>
              <li>✅ <strong>Full license access</strong> - No trial limitations</li>
              <li>✅ <strong>All premium features</strong> included</li>
              <li>✅ <strong>Immediate access</strong> to team collaboration tools</li>
            </ul>
          </div>
          
          <p>To activate your account and set up your password, please click the button below:</p>
          <p style="text-align: center;">
            <a href="${signUpLink}" class="button">Activate Account & Set Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 4px; font-family: monospace;">${signUpLink}</p>
          <p><strong>This activation link will expire in 7 days.</strong></p>
          <p>TimeFocusAI is a modern time tracking platform that helps teams efficiently record and analyze work hours through both manual entry and voice recognition.</p>
          <p>If you did not expect this account creation, please contact your administrator or ignore this email.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br/>The TimeFocusAI Team</p>
          <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Welcome to TimeFocusAI - Account Created

Hello ${fullName}!

${inviterName} has created an account for you at ${organizationName} on TimeFocusAI.

Special Benefits:
As a team member added by an administrator, you get:
- Full license access - No trial limitations
- All premium features included
- Immediate access to team collaboration tools

To activate your account and set up your password, please visit:
${signUpLink}

This activation link will expire in 7 days.

TimeFocusAI is a modern time tracking platform that helps teams efficiently record and analyze work hours through both manual entry and voice recognition.

If you did not expect this account creation, please contact your administrator or ignore this email.

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
  console.log(`Sending admin invitation email to ${to}`);

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

    console.log("Admin invitation email sent successfully:", data);
    return { id: data.id };
  } catch (error) {
    console.error("Error sending admin invitation email:", error);
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
    // Validate environment variables at runtime
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({
          error: "Server configuration error - missing environment variables",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    let requestBody;
    try {
      requestBody = await req.json();
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
      fullName,
      organizationId,
      inviterUserId,
      organizationName,
      inviterName,
    } = requestBody;

    console.log("Received admin invitation request:", {
      email,
      fullName,
      organizationId,
      inviterUserId,
      organizationName,
      inviterName,
    });

    if (!email || !fullName || !organizationId || !inviterUserId) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: email, fullName, organizationId, inviterUserId",
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
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invitation already exists and is not expired
    const { data: existingInvitation, error: invitationCheckError } =
      await supabase
        .from("admin_invitations")
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
          error:
            "An active admin invitation already exists for this email address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate a secure random token for invitation tracking
    const token = crypto.randomUUID();

    // Set expiration to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store invitation in the database
    const { data: invitationData, error: inviteError } = await supabase
      .from("admin_invitations")
      .insert({
        email,
        full_name: fullName,
        organization_id: organizationId,
        invited_by: inviterUserId,
        token,
        expires_at: expiresAt.toISOString(),
        accepted: false,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error storing admin invitation:", inviteError);
      return new Response(
        JSON.stringify({
          error: "Failed to store admin invitation",
          details: inviteError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create signup link with invitation token
    const baseUrl = "https://bold-edison6-smedu.view-3.tempo-dev.app";

    const signUpLink = `${baseUrl}/sign-up?admin_invitation=${invitationData.id}&token=${token}&email=${encodeURIComponent(email)}&full_name=${encodeURIComponent(fullName)}&org=${organizationId}`;

    console.log("Generated admin signup link:", signUpLink);

    // Generate email content
    const { html, text } = createAdminInvitationEmailTemplate(
      signUpLink,
      organizationName || "Your Organization",
      inviterName || "Team Admin",
      fullName,
    );

    // Send invitation email
    try {
      const emailResult = await sendEmail(
        email,
        `Welcome to ${organizationName || "our team"} on TimeFocusAI - Account Created`,
        html,
        text,
      );

      console.log("Admin invitation email sent successfully:", emailResult);

      return new Response(
        JSON.stringify({
          message: "Admin invitation sent successfully",
          emailId: emailResult.id,
          invitation: {
            id: invitationData.id,
            email,
            full_name: fullName,
            expires_at: expiresAt.toISOString(),
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (emailError) {
      console.error("Failed to send admin invitation email:", emailError);

      // Clean up the invitation record since email failed
      await supabase
        .from("admin_invitations")
        .delete()
        .eq("id", invitationData.id);

      return new Response(
        JSON.stringify({
          error: "Failed to send admin invitation email",
          details: emailError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Error sending admin invitation:", {
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
