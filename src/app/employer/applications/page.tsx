"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase-client";
import type { Application, JobCard } from "@/lib/types";

interface JobWithApplications {
  job: JobCard;
  applications: Application[];
}

const statusColors: Record<string, string> = {
  applied: "bg-zinc-800 text-zinc-300",
  reviewing: "bg-amber-500/15 text-amber-300",
  interview: "bg-sky-500/15 text-sky-300",
  offer: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
  withdrawn: "bg-zinc-800 text-zinc-500",
};

export default function EmployerApplicationsPage() {
  const { user, loading: authLoading, role } = useAuth();
  const router = useRouter();
  const [jobApps, setJobApps] = useState<JobWithApplications[]>([]);
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
        const jobs: JobCard[] = await jobsRes.json();

        if (cancelled) return;

        const results: JobWithApplications[] = await Promise.all(
          jobs.map(async (job) => {
            try {
              const appsRes = await fetch(
                `/api/employer/jobs/${job.id}/applications`,
                { headers }
              );
              const applications = appsRes.ok ? await appsRes.json() : [];
              return { job, applications };
            } catch {
              return { job, applications: [] };
            }
          })
        );

        if (!cancelled) {
          setJobApps(results.filter((r) => r.applications.length > 0));
        }
      } catch {
        // Error loading applications — user sees empty state
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
        <h1 className="mb-6 text-center text-xl font-black tracking-tight text-white">
          claw<span className="text-emerald-400">job</span>
        </h1>

        <h2 className="mb-4 text-sm font-medium text-zinc-400">
          All Applicants
        </h2>

        {jobApps.length === 0 ? (
          <div className="rounded-xl border border-zinc-700/40 bg-zinc-900 p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
              <svg
                className="h-6 w-6 text-zinc-500"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm text-zinc-300">
              No applications yet. Post jobs to start receiving candidates.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {jobApps.map(({ job, applications }) => (
              <div key={job.id} className="min-w-0">
                <h3 className="mb-2 truncate text-xs font-semibold text-zinc-300">
                  {job.role}{" "}
                  <span className="font-normal text-zinc-500">
                    at {job.company}
                  </span>
                </h3>
                <div className="space-y-2">
                  {applications.map((app, i) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 transition-colors hover:bg-zinc-800/80"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">
                          {app.userId.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`ml-2 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusColors[app.status] ?? "bg-zinc-800 text-zinc-400"}`}
                      >
                        {app.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
