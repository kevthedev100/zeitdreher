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
          const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (userData) {
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
        console.error("Error processing admin invitation:", error);
      }
    }
  }

  const redirectTo = redirect_to || "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}