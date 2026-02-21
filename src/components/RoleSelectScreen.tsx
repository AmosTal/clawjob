"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase-client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function RoleSelectScreen() {
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState<"seeker" | "employer" | null>(null);
  const [error, setError] = useState("");

  async function selectRole(role: "seeker" | "employer") {
    setError("");
    setLoading(role);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) throw new Error("Failed to set role");
      await refreshProfile();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 px-4">
      {/* Background gradient */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative w-full max-w-[430px]"
      >
        {/* Logo */}
        <motion.div className="mb-8 text-center" variants={fadeUp} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-black tracking-tight text-white">
            claw<span className="text-emerald-400">job</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Choose how you want to get started
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="space-y-3">
          <motion.button
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => selectRole("seeker")}
            disabled={loading !== null}
            className="group w-full rounded-2xl border border-zinc-700/40 bg-zinc-900 p-6 text-left transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/80 disabled:opacity-60 touch-manipulation min-h-[48px]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
              <svg
                className="h-6 w-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">
              {loading === "seeker" ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Setting up...
                </span>
              ) : (
                "I'm looking for a job"
              )}
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              Browse and swipe on job opportunities from top companies
            </p>
          </motion.button>

          <motion.button
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => selectRole("employer")}
            disabled={loading !== null}
            className="group w-full rounded-2xl border border-zinc-700/40 bg-zinc-900 p-6 text-left transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/80 disabled:opacity-60 touch-manipulation min-h-[48px]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
              <svg
                className="h-6 w-6 text-emerald-400"
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
            <h2 className="text-lg font-semibold text-white">
              {loading === "employer" ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  Setting up...
                </span>
              ) : (
                "I'm hiring"
              )}
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              Post jobs and find great candidates for your team
            </p>
          </motion.button>
        </div>

        {/* Reassurance hint */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-4 text-center text-xs text-zinc-600"
        >
          You can switch roles anytime in your profile settings
        </motion.p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5"
            role="alert"
          >
            <svg className="h-4 w-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
  );
}
