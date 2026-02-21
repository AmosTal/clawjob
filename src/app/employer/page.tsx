"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase-client";
import type { JobCard } from "@/lib/types";

interface Stats {
  totalJobs: number;
  totalApplications: number;
  newToday: number;
}

interface JobWithApps extends JobCard {
  applicationCount?: number;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/* ── Animated Number ─────────────────────────────────────────── */

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 800;
    const target = value;
    if (target === 0) return;

    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isInView]);

  return <span ref={ref}>{display}</span>;
}

/* ── Stat Card ───────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative overflow-hidden rounded-xl p-[1px]"
    >
      {/* gradient border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/30 via-emerald-600/10 to-transparent" />
      <div className="relative rounded-xl bg-gradient-to-b from-emerald-500/[0.06] to-transparent bg-zinc-900 p-3 text-center">
        {/* glow */}
        <div className="absolute -top-4 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-xl" />
        <div className="relative">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            {icon}
          </div>
          <p className="text-xl font-bold text-white">
            <AnimatedNumber value={value} />
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Icons ───────────────────────────────────────────────────── */

const BriefcaseIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const UsersIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ClockIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/* ── Loading Skeleton ────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="flex min-h-dvh justify-center bg-zinc-950">
      <div className="w-full max-w-[430px] px-4 py-6">
        {/* Header skeleton */}
        <div className="mb-6 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
          <div className="h-6 w-48 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-36 animate-pulse rounded bg-zinc-800" />
        </div>
        {/* Stats skeleton */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-zinc-800"
            />
          ))}
        </div>
        {/* Button skeleton */}
        <div className="mb-6 h-12 animate-pulse rounded-xl bg-zinc-800" />
        {/* Job cards skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-zinc-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────── */

function EmptyJobsState({ onPost }: { onPost: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-zinc-800/50 bg-zinc-900 p-8 text-center"
    >
      {/* Illustration */}
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5">
        <svg
          className="h-10 w-10 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-white">
        No jobs posted yet
      </h3>
      <p className="mb-5 text-xs text-zinc-400">
        Post your first job and start receiving applications from top talent.
      </p>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onPost}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 touch-manipulation min-h-[48px]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Post Your First Job
      </motion.button>
    </motion.div>
  );
}

/* ── Job Card ────────────────────────────────────────────────── */

function JobCardRow({
  job,
  index,
}: {
  job: JobWithApps;
  index: number;
}) {
  const maxApps = 20; // progress bar baseline
  const appPercent = Math.min(((job.applicationCount ?? 0) / maxApps) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.35 }}
      className="rounded-2xl border border-zinc-800/50 bg-zinc-900 p-4 transition-colors hover:border-zinc-700/60"
    >
      {/* Top row: logo + info */}
      <div className="flex gap-3">
        {/* Company logo */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-800">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-zinc-500">
              {job.company.charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white">
            {job.role}
          </h3>
          <p className="truncate text-xs text-zinc-400">{job.company}</p>
        </div>

        {/* Posted date */}
        {job.createdAt && (
          <span className="shrink-0 self-start text-[10px] text-zinc-500">
            {timeAgo(job.createdAt)}
          </span>
        )}
      </div>

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
              +{job.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Application count + progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">Applications</span>
          <span className="text-xs font-medium text-emerald-400">
            {job.applicationCount ?? 0}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${appPercent}%` }}
            transition={{ delay: 0.3 + index * 0.06, duration: 0.6 }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          />
        </div>
      </div>

      {/* Location + salary row */}
      <div className="mt-2.5 flex items-center gap-3 text-xs text-zinc-500 min-w-0">
        <span className="flex items-center gap-1 min-w-0 truncate">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{job.location}</span>
        </span>
        {job.salary && (
          <span className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            {job.salary}
          </span>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="mt-3 flex gap-2">
        <button className="flex-1 rounded-xl bg-emerald-500/10 px-3 py-2 text-[11px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 touch-manipulation min-h-[36px]" aria-label={`View applications for ${job.role}`}>
          View Apps
        </button>
        <button className="flex-1 rounded-xl bg-zinc-800 px-3 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-700 touch-manipulation min-h-[36px]" aria-label={`Edit ${job.role} listing`}>
          Edit
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────── */

export default function EmployerDashboard() {
  const { user, loading: authLoading, role, userProfile } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithApps[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    totalApplications: 0,
    newToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "employer") {
      router.replace("/");
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const jobsRes = await fetch("/api/employer/jobs", { headers });
        if (!jobsRes.ok) throw new Error("Failed to fetch jobs");
        const jobsList: JobCard[] = await jobsRes.json();

        if (cancelled) return;

        // Fetch application counts for each job
        const jobsWithApps: JobWithApps[] = await Promise.all(
          jobsList.map(async (job) => {
            try {
              const appsRes = await fetch(
                `/api/employer/jobs/${job.id}/applications`,
                { headers }
              );
              const apps = appsRes.ok ? await appsRes.json() : [];
              return { ...job, applicationCount: apps.length };
            } catch {
              return { ...job, applicationCount: 0 };
            }
          })
        );

        if (cancelled) return;

        const totalApplications = jobsWithApps.reduce(
          (sum, j) => sum + (j.applicationCount ?? 0),
          0
        );

        const todayStr = new Date().toISOString().slice(0, 10);
        let newToday = 0;
        for (const job of jobsWithApps) {
          try {
            const appsRes = await fetch(
              `/api/employer/jobs/${job.id}/applications`,
              { headers }
            );
            if (appsRes.ok) {
              const apps = await appsRes.json();
              newToday += apps.filter(
                (a: { appliedAt?: string }) =>
                  a.appliedAt?.startsWith(todayStr)
              ).length;
            }
          } catch {
            // skip
          }
        }

        setJobs(jobsWithApps);
        setStats({
          totalJobs: jobsWithApps.length,
          totalApplications,
          newToday,
        });
      } catch {
        // Error loading employer data — user sees empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user, role, authLoading, router]);

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  const firstName =
    userProfile?.name?.split(" ")[0] ||
    user?.displayName?.split(" ")[0] ||
    "there";

  return (
    <div className="flex min-h-dvh justify-center bg-zinc-950">
      <div className="w-full max-w-[430px] px-4 py-6 pb-24">
        {/* Logo */}
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center text-xl font-black tracking-tight text-white"
        >
          claw<span className="text-emerald-400">job</span>
        </motion.h1>

        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-xs font-medium text-emerald-400">
            {formatDate(new Date())}
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">
            Welcome back, {firstName}
          </h2>
          <p className="text-xs text-zinc-400">
            Here&apos;s your hiring overview
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard
            label="Total Jobs"
            value={stats.totalJobs}
            icon={BriefcaseIcon}
            delay={0.1}
          />
          <StatCard
            label="Applications"
            value={stats.totalApplications}
            icon={UsersIcon}
            delay={0.15}
          />
          <StatCard
            label="New Today"
            value={stats.newToday}
            icon={ClockIcon}
            delay={0.2}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mb-6 space-y-2"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/employer/post-job")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 touch-manipulation min-h-[48px]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Post New Job
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => router.push("/employer?tab=applications")}
              className="rounded-xl border border-zinc-700/40 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 touch-manipulation min-h-[44px]"
            >
              View All Applications
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="rounded-xl border border-zinc-700/40 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 touch-manipulation min-h-[44px]"
            >
              Manage Profile
            </button>
          </div>
        </motion.div>

        {/* Jobs List */}
        <div className="space-y-3">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm font-medium text-zinc-400"
          >
            Your Jobs
          </motion.h2>

          {jobs.length === 0 ? (
            <EmptyJobsState onPost={() => router.push("/employer/post-job")} />
          ) : (
            jobs.map((job, i) => (
              <JobCardRow key={job.id} job={job} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
