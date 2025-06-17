import { createClient } from "../../../../supabase/server";
import { auth } from "@clerk/nextjs";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { verified } = await request.json();
    const supabase = await createClient();

    // Update the user's verification status in the database
    const { error } = await supabase
      .from("users")
      .update({ email_verified: verified })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating user verification status:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in update-user-verification:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
