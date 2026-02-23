"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import RoleSelectScreen from "@/components/RoleSelectScreen";
import SwipeDeck from "@/components/SwipeDeck";
import AppShell from "@/components/AppShell";
import FilterBar from "@/components/FilterBar";
import type { Filters } from "@/components/FilterBar";
import { auth } from "@/lib/firebase-client";
import type { JobCard, Application } from "@/lib/types";

function HomeSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6">
      {/* Header skeleton */}
      <div className="h-6 w-28 animate-pulse rounded bg-zinc-800" />
      {/* Progress counter skeleton */}
      <div className="h-4 w-20 animate-pulse rounded-full bg-zinc-800" />
      {/* Title area */}
      <div className="space-y-2 text-center">
        <div className="mx-auto h-5 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-zinc-800" />
      </div>
      {/* Card skeleton */}
      <div className="h-[60vh] w-full animate-pulse rounded-2xl bg-zinc-800" />
      {/* Action buttons */}
      <div className="flex items-center gap-6">
        <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-800" />
        <div className="h-11 w-11 animate-pulse rounded-full bg-zinc-800" />
        <div className="h-14 w-14 animate-pulse rounded-full bg-zinc-800" />
      </div>
      {/* HR card skeleton */}
      <div className="h-28 w-full animate-pulse rounded-xl bg-zinc-800" />
    </div>
  );
}

export default function HomePage() {
  const { user, role, userProfile } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    remote: false,
    location: null,
    tags: [],
  });

  // Apply filters client-side
  const displayedJobs = useMemo(() => {
    let displayed = jobs;
    if (filters.remote)
      displayed = displayed.filter((j) =>
        j.location?.toLowerCase().includes("remote"),
      );
    if (filters.location)
      displayed = displayed.filter((j) =>
        j.location?.includes(filters.location!),
      );
    if (filters.tags.length)
      displayed = displayed.filter((j) =>
        (j.tags ?? []).some((t) => filters.tags.includes(t)),
      );
    return displayed;
  }, [jobs, filters]);

  // Count unique sources
  const sourceCount = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      if (j.sourceName) set.add(j.sourceName);
    }
    return set.size;
  }, [jobs]);

  // Stable key to force SwipeDeck remount when filters change
  const filterKey = `${filters.remote}-${filters.location}-${filters.tags.join(",")}`;

  useEffect(() => {
    if (user && role === "employer") {
      router.replace("/employer");
    }
  }, [user, role, router]);

  useEffect(() => {
    if (!user || role !== "seeker") return;

    let cancelled = false;

    async function fetchJobs() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [jobsRes, appsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/applications", { headers }),
        ]);

        if (cancelled) return;

        if (!jobsRes.ok) {
          setLoadingJobs(false);
          return;
        }

        const jobsData = await jobsRes.json();
        const allJobs: JobCard[] = Array.isArray(jobsData) ? jobsData : [];
        const applications: Application[] = appsRes.ok
          ? await appsRes.json()
          : [];

        const appliedIds = new Set(applications.map((a) => a.jobId));
        const filtered = allJobs.filter((j) => !appliedIds.has(j.id));

        setTotalJobs(allJobs.length);
        setJobs(filtered);
      } catch {
        // Job loading failed — user sees empty state
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    }

    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, [user, role]);

  if (!role) {
    return <RoleSelectScreen />;
  }

  if (role === "employer") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="flex min-h-dvh justify-center bg-zinc-950">
        <div className="w-full max-w-[430px] px-4 py-6">
          {/* Logo */}
          <h1 className="mb-4 text-center text-xl font-black tracking-tight text-white">
            claw<span className="text-emerald-400">job</span>
          </h1>

          {/* Progress counter */}
          {!loadingJobs && jobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 flex justify-center"
            >
              <span className="rounded-full bg-zinc-800/80 px-3 py-1 text-[11px] font-medium text-zinc-400">
                {displayedJobs.length} jobs available{sourceCount > 0 ? ` from ${sourceCount} source${sourceCount !== 1 ? "s" : ""}` : ""}
              </span>
            </motion.div>
          )}

          {/* Filter bar */}
          {!loadingJobs && jobs.length > 0 && (
            <FilterBar
              jobs={jobs}
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}

          <AnimatePresence mode="wait">
            {loadingJobs ? (
              <motion.div
                key="home-skeleton"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <HomeSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key={`deck-${filterKey}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <SwipeDeck jobs={displayedJobs} loading={false} quickApply={userProfile?.quickApply ?? false} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
