import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");

  if (code) {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionData?.user) {
      const user = sessionData.user;

      try {
        // Ensure public.users record exists (trigger may have failed)
        let { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!userData) {
          const { data: created } = await supabase
            .from("users")
            .upsert(
              {
                id: user.id,
                user_id: user.id,
                email: user.email || "",
                full_name: user.user_metadata?.full_name || "",
                onboarded: false,
                role: "member",
                token_identifier: crypto.randomUUID(),
              },
              { onConflict: "id" },
            )
            .select("id")
            .single();
          userData = created;
        }

        if (userData) {
          // Process any pending admin invitation
          const { data: pendingInvitation } = await supabase
            .from("admin_invitations")
            .select("*")
            .eq("email", user.email!)
            .eq("accepted", false)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (pendingInvitation) {
            await supabase.from("organization_members").upsert(
              {
                organization_id: pendingInvitation.organization_id,
                user_id: userData.id,
                role: "member",
                invited_by: pendingInvitation.invited_by,
                joined_at: new Date().toISOString(),
                is_active: true,
              },
              { onConflict: "organization_id,user_id" },
            );

            await supabase
              .from("admin_invitations")
              .update({ accepted: true, accepted_at: new Date().toISOString() })
              .eq("id", pendingInvitation.id);

            await supabase
              .from("users")
              .update({ role: "member", onboarded: true })
              .eq("user_id", user.id);
          }
        }
      } catch (error) {
        console.error("Error processing auth callback:", error);
      }
    }
  }

  const redirectTo = redirect_to || "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}