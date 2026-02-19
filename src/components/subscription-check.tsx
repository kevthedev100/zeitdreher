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
  const [trialStatus, setTrialStatus] = useState<{
    isActive: boolean;
    daysRemaining?: number;
  } | null>(null);
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

      // Check user role and trial status
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, trial_start, trial_end")
        .eq("user_id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        setLoading(false);
        return;
      }

      // Admin members get full access without subscription check
      if (userData?.role === "admin_member") {
        setLoading(false);
        return;
      }

      // Check if the user has an active subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        console.error("Error fetching subscription:", subscriptionError);
      }

      // If user has active subscription, they have full access
      if (subscription) {
        setTrialStatus({ isActive: true });
        setLoading(false);
        return;
      }

      // Check trial status using the database function
      const { data: isTrialActive, error: trialError } = await supabase.rpc(
        "is_trial_active",
        { user_uuid: user.id },
      );

      if (trialError) {
        console.error("Error checking trial status:", trialError);
        setLoading(false);
        return;
      }

      // Calculate days remaining in trial
      let daysRemaining = 0;
      if (userData?.trial_end) {
        const trialEnd = new Date(userData.trial_end);
        const now = new Date();
        const timeDiff = trialEnd.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      }

      setTrialStatus({
        isActive: isTrialActive,
        daysRemaining: daysRemaining,
      });

      // If trial has expired and user doesn't have subscription,
      // redirect to pricing page (except for the plan page itself)
      if (
        !isTrialActive &&
        redirectTo !== "/pricing" &&
        !window.location.pathname.includes("/plan") &&
        !window.location.pathname.includes("/pricing")
      ) {
        router.push(redirectTo);
        return;
      }

      setLoading(false);
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

  // Show trial status banner if user is in trial period
  const showTrialBanner =
    trialStatus &&
    trialStatus.isActive &&
    trialStatus.daysRemaining !== undefined;

  return (
    <>
      {showTrialBanner && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center">
              <div className="text-yellow-800">
                <span className="font-medium">
                  Testphase: {trialStatus.daysRemaining} Tage verbleibend
                </span>
                <span className="ml-2 text-sm">
                  Upgrade jetzt für unbegrenzten Zugang
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Jetzt upgraden
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
