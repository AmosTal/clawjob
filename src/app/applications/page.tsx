"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase-client";
import type { Application } from "@/lib/types";
import ApplicationCard from "@/components/ApplicationCard";
import AppShell from "@/components/AppShell";
import SignInScreen from "@/components/SignInScreen";
import { useToast } from "@/components/Toast";

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
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
      showToast("Failed to load applications", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
              Activity
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
                  className="animate-pulse rounded-xl border border-zinc-700/40 bg-zinc-900 p-4"
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
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <p className="text-lg font-bold text-zinc-300">
                No applications yet
              </p>
              <p className="mx-auto max-w-[260px] text-sm leading-relaxed text-zinc-400">
                Your application timeline will appear here once you apply to jobs. Discover roles and start applying!
              </p>
              <motion.button
                onClick={() => router.push("/")}
                className="mt-2 flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20"
                whileTap={{ scale: 0.95 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
                Discover Jobs
              </motion.button>
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
