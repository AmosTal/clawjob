"use client";

import { useAuth } from "@/components/AuthProvider";
import SignInScreen from "@/components/SignInScreen";
import SwipeDeck from "@/components/SwipeDeck";
import AppShell from "@/components/AppShell";
import { sampleJobs } from "@/lib/data";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return (
    <AppShell>
      <div className="flex min-h-dvh justify-center bg-zinc-950">
        <div className="w-full max-w-[430px] px-4 py-6">
          {/* Logo */}
          <h1 className="mb-4 text-center text-xl font-black tracking-tight text-white">
            claw<span className="text-emerald-400">job</span>
          </h1>

          <SwipeDeck jobs={sampleJobs} />
        </div>
      </div>
    </AppShell>
  );
}
