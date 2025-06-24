"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../supabase/client";
import { User } from "@supabase/supabase-js";

interface SubscriptionCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function SubscriptionCheck({
  children,
  redirectTo = "/pricing",
}: SubscriptionCheckProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      setUser(user);
      setLoading(false);

      // Check user role - admin_member users get full access without subscription
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
      }

      // Admin members get full access without subscription check
      if (userData?.role === "admin_member") {
        return; // Skip subscription check for admin members
      }

      // Check if the user has an active subscription or is in trial period
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        console.error("Error fetching subscription:", subscriptionError);
      }

      // If we're on a page that requires subscription and user doesn't have one,
      // redirect to pricing page (except for the plan page itself)
      if (
        redirectTo !== "/pricing" &&
        !subscription &&
        !window.location.pathname.includes("/plan")
      ) {
        router.push(redirectTo);
      }
    };

    checkUser();
  }, [supabase, router, redirectTo]);

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
