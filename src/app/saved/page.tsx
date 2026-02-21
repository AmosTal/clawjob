"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { fetchWithAuth } from "@/lib/firebase-client";
import type { JobCard, UserProfile, CVVersion, Application } from "@/lib/types";
import SavedJobCard from "@/components/SavedJobCard";
import AppShell from "@/components/AppShell";
import SignInScreen from "@/components/SignInScreen";
import { useToast } from "@/components/Toast";
import CVPreviewModal from "@/components/CVPreviewModal";

function SavedPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cvPreviewJob, setCvPreviewJob] = useState<JobCard | null>(null);
  const [cvVersions, setCvVersions] = useState<CVVersion[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [res, profileRes, cvsRes, appsRes] = await Promise.all([
        fetchWithAuth("/api/saved"),
        fetchWithAuth("/api/user"),
        fetchWithAuth("/api/user/cvs"),
        fetchWithAuth("/api/applications"),
      ]);
      if (profileRes.ok) {
        const profileData: UserProfile = await profileRes.json();
        setProfile(profileData);
      }
      if (cvsRes.ok) {
        const cvsData: CVVersion[] = await cvsRes.json();
        setCvVersions(cvsData);
      }
      if (appsRes.ok) {
        const appsData: Application[] = await appsRes.json();
        setAppliedJobIds(new Set(appsData.map((a) => a.jobId)));
      }
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
  }, [showToast]);

  useEffect(() => {
    if (user) fetchSavedJobs();
  }, [user, fetchSavedJobs]);

  const handleApply = (job: JobCard) => {
    setCvPreviewJob(job);
  };

  const handleRemove = async (jobId: string) => {
    try {
      const res = await fetchWithAuth(`/api/saved/${jobId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove");

      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      showToast("Removed from saved", "info");
    } catch {
      showToast("Failed to remove job", "error");
    }
  };

  const handleConfirmApply = async (job: JobCard, message: string, resumeVersionId?: string) => {
    setCvPreviewJob(null);
    try {
      const applyRes = await fetchWithAuth("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          message: message || undefined,
          resumeVersionId: resumeVersionId || undefined,
        }),
      });
      if (!applyRes.ok) throw new Error("Failed to apply");

      // Remove from saved
      await fetchWithAuth(`/api/saved/${job.id}`, {
        method: "DELETE",
      });

      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      showToast(`Applied to ${job.role}!`, "success");
    } catch {
      showToast("Failed to apply", "error");
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
                className="animate-pulse rounded-xl border border-zinc-700/40 bg-zinc-900 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-[60px] w-[60px] shrink-0 rounded-xl bg-zinc-800" />
                  <div className="flex-1">
                    <div className="mb-1.5 h-4 w-3/4 rounded bg-zinc-800" />
                    <div className="mb-1 h-3 w-1/2 rounded bg-zinc-800" />
                    <div className="mb-1 h-3 w-1/3 rounded bg-zinc-800" />
                    <div className="h-3 w-1/4 rounded bg-zinc-800" />
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="h-7 w-16 rounded-full bg-zinc-800" />
                    <div className="h-7 w-7 rounded-full bg-zinc-800" />
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
              No saved jobs yet
            </p>
            <p className="mx-auto max-w-[260px] text-sm leading-relaxed text-zinc-400">
              Swipe right on jobs you like to save them here for later. Review and apply when you are ready.
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
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-3">
              {jobs.length > 0 && (
                <p className="text-center text-[11px] text-zinc-500">
                  Swipe left on a card to remove it
                </p>
              )}
              {jobs.map((job, i) => (
                <SavedJobCard
                  key={job.id}
                  job={job}
                  index={i}
                  onApply={handleApply}
                  onRemove={handleRemove}
                  applied={appliedJobIds.has(job.id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        <CVPreviewModal
          job={cvPreviewJob}
          isOpen={!!cvPreviewJob}
          onClose={() => setCvPreviewJob(null)}
          onSend={handleConfirmApply}
          resumeURL={profile?.resumeURL}
          resumeFileName={profile?.resumeFileName}
          cvVersions={cvVersions}
          onCvUploaded={async () => {
            try {
              const [cvsRes, profileRes] = await Promise.all([
                fetchWithAuth("/api/user/cvs"),
                fetchWithAuth("/api/user"),
              ]);
              if (cvsRes.ok) {
                const data: CVVersion[] = await cvsRes.json();
                setCvVersions(data);
              }
              if (profileRes.ok) {
                const data: UserProfile = await profileRes.json();
                setProfile(data);
              }
            } catch {
              // silently fail — modal already has the local state
            }
          }}
        />
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
