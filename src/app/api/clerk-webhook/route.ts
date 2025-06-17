import { createClient } from "../../../../supabase/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  // Using the provided signing secret
  const WEBHOOK_SECRET = "whsec_hEQgdFkwZth3d8sHgFnFsmdrizSATDzH";
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with ID: ${id} and type: ${eventType}`);
  console.log("Webhook body:", body);

  // Create a Supabase client
  const supabase = await createClient();

  // Handle the different event types
  switch (eventType) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const fullName = `${first_name || ""} ${last_name || ""}`.trim();

      console.log("Creating user in Supabase:", { id, email, fullName });

      // Insert the user into the public.users table
      const { error } = await supabase.from("users").insert({
        id: crypto.randomUUID(), // Generate a UUID for the id field (internal primary key)
        user_id: id, // Clerk user ID as text
        email: email,
        full_name: fullName,
        name: fullName, // Add name field as well
        role: "employee", // Default role
        onboarded: false,
        token_identifier: Math.random().toString(36).substring(2, 15),
        is_active: true,
        email_verified: false,
      });

      if (error) {
        console.error("Error inserting user into Supabase:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      console.log("User successfully created in Supabase");
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const fullName = `${first_name || ""} ${last_name || ""}`.trim();

      console.log("Updating user in Supabase:", { id, email, fullName });

      // Update the user in the public.users table
      const { error } = await supabase
        .from("users")
        .update({
          email: email,
          full_name: fullName,
          name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", id);

      if (error) {
        console.error("Error updating user in Supabase:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      console.log("User successfully updated in Supabase");
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;

      // You might want to handle user deletion differently
      // For example, you might want to soft delete the user instead
      const { error } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("user_id", id);

      if (error) {
        console.error("Error soft-deleting user in Supabase:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }

      break;
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
  });
}
