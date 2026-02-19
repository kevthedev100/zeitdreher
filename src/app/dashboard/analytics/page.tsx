"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/client";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import AnalyticsTab from "@/components/tabs/analytics-tab";

export default function DashboardAnalyticsPage() {
  const supabase = createClient();
  const [quickStats, setQuickStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"manager" | "employee">("employee");

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          redirect("/sign-in");
          return;
        }

        // Get user data from the users table
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setUserRole(data.role as "manager" | "employee");
        }

        await loadQuickData(user.id, data?.role || "employee");
      } catch (error) {
        console.error("Error in user initialization:", error);
        redirect("/sign-in");
      }
    };

    getUser();
  }, [supabase]);

  const loadQuickData = async (userId: string, role: string) => {
    try {
      setLoading(true);

      // Load time entries with related data
      let query = supabase
        .from("time_entries")
        .select(
          `
          *,
          areas(name, color),
          fields(name),
          activities(name),
          users(full_name, email)
        `,
        )
        .order("date", { ascending: false });

      // Always filter by user ID regardless of role for analytics page
      // This ensures users only see their own data in analytics
      query = query.eq("user_id", userId);

      const { data: entries, error } = await query;

      if (error) throw error;

      const timeEntryData = entries || [];

      if (timeEntryData.length === 0) {
        setQuickStats({
          todayHours: 0,
          weekHours: 0,
          monthHours: 0,
        });
        setRecentActivities([]);
        setLoading(false);
        return;
      }

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        .toISOString()
        .split("T")[0];

      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
      const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

      const normalizeDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00.000Z");
        return date.toISOString().split("T")[0];
      };

      // Calculate today's hours
      const todayEntries = timeEntryData.filter((entry) => {
        const entryDate = normalizeDate(entry.date);
        return entryDate === today;
      });
      const todayHours = todayEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );

      // Calculate this week's hours
      const thisWeekEntries = timeEntryData.filter((entry) => {
        const entryDate = normalizeDate(entry.date);
        return entryDate >= startOfWeekStr;
      });
      const weekHours = thisWeekEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );

      // Calculate this month's hours
      const thisMonthEntries = timeEntryData.filter((entry) => {
        const entryDate = normalizeDate(entry.date);
        return entryDate >= startOfMonthStr;
      });
      const monthHours = thisMonthEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0,
      );

      setQuickStats({
        todayHours,
        weekHours,
        monthHours,
      });

      // Get recent activities (last 3)
      const recent =
        timeEntryData.slice(0, 3).map((entry) => ({
          activity: entry.activities?.name || "Unbekannte Aktivität",
          duration: entry.duration,
          date: entry.date,
          area: entry.areas?.name || "Unbekannter Bereich",
          color: entry.areas?.color || "#6B7280",
        })) || [];

      setRecentActivities(recent);
    } catch (error) {
      console.error("Error loading quick data:", error);
      setQuickStats({
        todayHours: 0,
        weekHours: 0,
        monthHours: 0,
      });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubscriptionCheck>
      <AnalyticsTab
        userRole={userRole}
        quickStats={quickStats}
        recentActivities={recentActivities}
        loading={loading}
      />
    </SubscriptionCheck>
  );
}
