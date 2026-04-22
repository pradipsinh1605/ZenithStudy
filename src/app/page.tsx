"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import LandingPage from "@/components/landing/LandingPage";

export default function RootPage() {
  useEffect(() => {
    // If already logged in → go to dashboard
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = "/dashboard";
    });
  }, []);

  return <LandingPage />;
}
