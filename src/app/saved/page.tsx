"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase-client";
import type { JobCard } from "@/lib/types";
import SavedJobCard from "@/components/SavedJobCard";
import AppShell from "@/components/AppShell";
import SignInScreen from "@/components/SignInScreen";
import { useToast } from "@/components/Toast";

function SavedPageContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(async () => {
    return await auth.currentUser?.getIdToken();
  }, []);

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/saved", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch saved jobs");
      const savedIds: string[] = await res.json();

      if (savedIds.length === 0) {
        setJobs([]);
        return;
      }

      const jobResults = await Promise.all(
        savedIds.map(async (id) => {
          try {
            const jobRes = await fetch(`/api/jobs/${id}`);
            if (!jobRes.ok) return null;
            return (await jobRes.json()) as JobCard;
          } catch {
            return null;
          }
        })
      );

      setJobs(jobResults.filter((j): j is JobCard => j !== null));
    } catch {
      showToast("Failed to load saved jobs", "error");
    } finally {
      setLoading(false);
    }
  }, [getToken, showToast]);

  useEffect(() => {
    if (user) fetchSavedJobs();
  }, [user, fetchSavedJobs]);

  const handleApply = async (job: JobCard) => {
    try {
      const token = await getToken();

      // Apply for the job
      const applyRes = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (!applyRes.ok) throw new Error("Failed to apply");

      // Remove from saved
      await fetch(`/api/saved/${job.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      showToast(`Applied to ${job.role}!`, "success");
    } catch {
      showToast("Failed to apply", "error");
    }
  };

  const handleRemove = async (jobId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/saved/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to remove");

      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      showToast("Removed from saved", "info");
    } catch {
      showToast("Failed to remove job", "error");
    }
  };

  return (
    <div className="flex min-h-dvh justify-center bg-zinc-950">
      <div className="w-full max-w-[430px] px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <h1 className="text-xl font-black tracking-tight text-white">
            Saved Jobs
          </h1>
          {!loading && jobs.length > 0 && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
              {jobs.length}
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
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
                  <div className="flex-1">
                    <div className="mb-1.5 h-4 w-2/3 rounded bg-zinc-800" />
                    <div className="mb-1 h-3 w-1/3 rounded bg-zinc-800" />
                    <div className="h-3 w-1/4 rounded bg-zinc-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
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
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-lg font-bold text-zinc-300">
              No saved jobs yet.
            </p>
            <p className="text-sm text-zinc-500">
              Swipe up on a job card to save it!
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-3">
              {jobs.map((job) => (
                <SavedJobCard
                  key={job.id}
                  job={job}
                  onApply={handleApply}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();

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
      <SavedPageContent />
    </AppShell>
  );
}
