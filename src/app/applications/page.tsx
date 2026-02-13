"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase-client";
import type { Application } from "@/lib/types";
import ApplicationCard from "@/components/ApplicationCard";
import AppShell from "@/components/AppShell";
import SignInScreen from "@/components/SignInScreen";

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Application[] = await res.json();
      data.sort(
        (a, b) =>
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );
      setApplications(data);
    } catch {
      // silently fail — empty list shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user, fetchApplications]);

  const handleWithdraw = (id: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: "withdrawn" as const } : app
      )
    );
  };

  if (authLoading) {
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
          {/* Header */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-white">
              My Applications
            </h1>
            {!loading && applications.length > 0 && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                {applications.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="mb-2 h-4 w-2/3 rounded bg-zinc-800" />
                  <div className="mb-1 h-3 w-1/3 rounded bg-zinc-800" />
                  <div className="h-3 w-1/4 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <motion.div
              className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <svg
                className="h-16 w-16 text-zinc-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <p className="text-lg font-bold text-zinc-300">
                No applications yet.
              </p>
              <p className="text-sm text-zinc-500">Start swiping!</p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.map((app, i) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  index={i}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
