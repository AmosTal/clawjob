"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [adminCheck, setAdminCheck] = useState<
    "loading" | "granted" | "denied"
  >("loading");

  useEffect(() => {
    if (loading) return;

    async function verify() {
      if (!user) {
        setAdminCheck("denied");
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdminCheck(res.ok ? "granted" : "denied");
      } catch {
        setAdminCheck("denied");
      }
    }

    verify();
  }, [user, loading]);

  if (loading || adminCheck === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (adminCheck === "denied") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Access Denied</h1>
          <p className="text-zinc-400 max-w-sm">
            You don&apos;t have permission to access the admin dashboard.
            Contact an administrator for access.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <AdminSidebar />
      <main className="lg:pl-60">
        <div className="px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
