"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";

interface AdminJob {
  id: string;
  company: string;
  role: string;
  location: string;
  salary?: string;
  tags: string[];
  createdAt?: string;
  employerId?: string;
}

export default function AdminJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const limit = 20;

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/jobs?limit=${limit}&offset=${page * limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? data);
        setTotal(data.total ?? data.length ?? 0);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/admin/jobs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      // Silently handle
    }
    setDeleteId(null);
  };

  const handleToggleStatus = async (id: string, currentlyActive: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/admin/jobs/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: currentlyActive ? "inactive" : "active",
        }),
      });
      fetchJobs();
    } catch {
      // Silently handle
    }
  };

  const filteredJobs = search
    ? jobs.filter(
        (j) =>
          j.role.toLowerCase().includes(search.toLowerCase()) ||
          j.company.toLowerCase().includes(search.toLowerCase()) ||
          j.location.toLowerCase().includes(search.toLowerCase())
      )
    : jobs;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Jobs</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage all job listings on the platform
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 self-start">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Job
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search jobs by title, company, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-700/50 bg-zinc-800 pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden sm:table-cell">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">
                  Location
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden lg:table-cell">
                  Salary
                </th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden lg:table-cell">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="px-4 py-3" colSpan={6}>
                      <div className="h-5 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    No jobs found
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, i) => (
                  <motion.tr
                    key={job.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                      i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-200">{job.role}</p>
                      <p className="text-xs text-zinc-500 sm:hidden">
                        {job.company}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                      {job.company}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">
                      {job.location}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden lg:table-cell">
                      {job.salary ?? "N/A"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">
                      {job.createdAt
                        ? new Date(job.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(job.id, true)}
                          className="p-1.5 rounded text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          title="Toggle status"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(job.id)}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete job"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Showing {page * limit + 1}-
              {Math.min((page + 1) * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 max-w-sm w-full mx-4 space-y-4"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-zinc-100">
                Delete Job?
              </h3>
              <p className="text-sm text-zinc-400 mt-1">
                This will deactivate the job listing. This action cannot be
                easily undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
