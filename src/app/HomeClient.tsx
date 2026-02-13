"use client";

import { useAuth } from "@/components/AuthProvider";
import LandingPage from "@/components/LandingPage";
import HomePage from "@/components/HomePage";

export default function HomeClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <HomePage />;
}
