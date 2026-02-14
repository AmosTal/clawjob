"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import Link from "next/link";

interface Stats {
  totalJobs: number;
  totalUsers: number;
  totalApplications: number;
  activeEmployers: number;
}

interface RecentApp {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const token = await user!.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, appsRes] = await Promise.all([
          fetch("/api/admin/stats", { headers }),
          fetch("/api/admin/stats/recent", { headers }).catch(() => null),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }

        if (appsRes?.ok) {
          const data = await appsRes.json();
          setRecentApps(data.applications ?? []);
        }
      } catch {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const statCards = [
    {
      label: "Total Jobs",
      value: stats?.totalJobs ?? 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
      color: "emerald",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
      color: "blue",
    },
    {
      label: "Applications",
      value: stats?.totalApplications ?? 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      color: "violet",
    },
    {
      label: "Employers",
      value: stats?.activeEmployers ?? 0,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      color: "amber",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-zinc-800 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-900 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-zinc-900 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Overview of your platform&apos;s performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const c = colorMap[card.color];
          return (
            <motion.div
              key={card.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${c.bg}`}>
                  <span className={c.text}>{card.icon}</span>
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-zinc-100">
                {card.value.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 mt-0.5">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Middle row: Chart placeholder + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6"
        >
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">
            Application Trends
          </h2>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 mb-3">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p className="text-sm font-medium text-zinc-400">
              Analytics coming soon
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Trend data will appear here as usage grows
            </p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-zinc-300">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/jobs"
              className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New Job
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-750 hover:text-zinc-100 transition-colors text-sm font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              View All Users
            </Link>
            <Link
              href="/admin/jobs"
              className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-750 hover:text-zinc-100 transition-colors text-sm font-medium"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              View Analytics
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
      >
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">
          Recent Applications
        </h2>
        {recentApps.length > 0 ? (
          <div className="space-y-3">
            {recentApps.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {app.jobTitle}
                  </p>
                  <p className="text-xs text-zinc-500">{app.company}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                    {app.status}
                  </span>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">No recent applications</p>
            <p className="text-zinc-600 text-xs mt-1">
              Applications will appear here as they come in
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
