"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role?: "seeker" | "employer";
  createdAt: string;
  bio?: string;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/users?limit=${limit}&offset=${page * limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(total / limit);

  const roleBadge = (role?: string) => {
    switch (role) {
      case "employer":
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
            Employer
          </span>
        );
      case "seeker":
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
            Seeker
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 font-medium">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Users</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage all users registered on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
        >
          <option value="all">All Roles</option>
          <option value="seeker">Seekers</option>
          <option value="employer">Employers</option>
        </select>
      </div>

      {/* User Cards / Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-zinc-800/50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-4 py-12 text-center text-zinc-500">
            No users found
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filteredUsers.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedUser(u)}
                className={`flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors ${
                  i % 2 === 0 ? "" : "bg-zinc-900/50"
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {u.photoURL ? (
                    <img
                      src={u.photoURL}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm font-medium">
                      {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {u.name || "Unnamed"}
                    </p>
                    {roleBadge(u.role)}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                </div>

                {/* Join Date */}
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-xs text-zinc-500">Joined</p>
                  <p className="text-xs text-zinc-400">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  className="text-zinc-600 shrink-0"
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </motion.div>
            ))}
          </div>
        )}

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
                className="px-3 py-1.5 text-xs rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-xs rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 space-y-5"
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-4">
              {selectedUser.photoURL ? (
                <img
                  src={selectedUser.photoURL}
                  alt={selectedUser.name}
                  className="w-16 h-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-xl font-medium">
                  {selectedUser.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-zinc-100">
                  {selectedUser.name || "Unnamed"}
                </h3>
                <p className="text-sm text-zinc-400">{selectedUser.email}</p>
                <div className="mt-1">{roleBadge(selectedUser.role)}</div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">User ID</span>
                <span className="text-zinc-300 font-mono text-xs">
                  {selectedUser.id}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Joined</span>
                <span className="text-zinc-300">
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "N/A"}
                </span>
              </div>
              {selectedUser.bio && (
                <div className="text-sm">
                  <span className="text-zinc-500 block mb-1">Bio</span>
                  <p className="text-zinc-300">{selectedUser.bio}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
