"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

export default function EmployerDashboard() {
  const { user, loading: authLoading, role } = useAuth();
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
      } catch (err) {
        console.error("Failed to load employer data:", err);
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
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh justify-center bg-zinc-950">
      <div className="w-full max-w-[430px] px-4 py-6">
        {/* Header */}
        <h1 className="mb-6 text-center text-xl font-black tracking-tight text-white">
          claw<span className="text-emerald-400">job</span>
        </h1>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard label="Total Jobs" value={stats.totalJobs} />
          <StatCard label="Applications" value={stats.totalApplications} />
          <StatCard label="New Today" value={stats.newToday} />
        </div>

        {/* Post Job Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/employer/post-job")}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Post New Job
        </motion.button>

        {/* Jobs List */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-400">Your Jobs</h2>

          {jobs.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
                <svg
                  className="h-6 w-6 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-400">
                No jobs posted yet. Create your first listing!
              </p>
            </div>
          ) : (
            jobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="rounded-2xl bg-zinc-900 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">
                      {job.role}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {job.company}
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                    {job.applicationCount ?? 0} apps
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {job.location}
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
                      >
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      {job.salary}
                    </span>
                  )}
                  {job.createdAt && (
                    <span>
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-zinc-900 p-3 text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[10px] text-zinc-400">{label}</p>
    </div>
  );
}
