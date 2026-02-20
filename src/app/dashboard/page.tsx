"use client";

import { createClient } from "../../../supabase/client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirect("/sign-in");
        return;
      }

      setLoading(false);
    };

    checkUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Wird geladen...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Weiterleitung zum Dashboard...</div>
    </div>
  );
}
