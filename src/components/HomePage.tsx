"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import RoleSelectScreen from "@/components/RoleSelectScreen";
import SwipeDeck from "@/components/SwipeDeck";
import AppShell from "@/components/AppShell";
import { auth } from "@/lib/firebase-client";
import type { JobCard, Application } from "@/lib/types";

export default function HomePage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

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

        const allJobs: JobCard[] = await jobsRes.json();
        const applications: Application[] = appsRes.ok
          ? await appsRes.json()
          : [];

        const appliedIds = new Set(applications.map((a) => a.jobId));
        const filtered = allJobs.filter((j) => !appliedIds.has(j.id));

        setJobs(filtered);
      } catch (err) {
        console.error("Failed to load jobs:", err);
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

          <SwipeDeck jobs={jobs} loading={loadingJobs} />
        </div>
      </div>
    </AppShell>
  );
}
