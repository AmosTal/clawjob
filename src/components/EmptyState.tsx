"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  onRefresh: () => void;
}

export default function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <motion.div
      className="flex h-[70dvh] flex-col items-center justify-center gap-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated card stack */}
      <div className="relative h-32 w-24">
        {/* Back card */}
        <motion.div
          className="absolute left-3 top-3 h-28 w-20 rounded-2xl border border-zinc-700/60 bg-zinc-800/60"
          animate={{ rotate: [6, 8, 6], y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Middle card */}
        <motion.div
          className="absolute left-1.5 top-1.5 h-28 w-20 rounded-2xl border border-zinc-600/60 bg-zinc-800/80"
          animate={{ rotate: [-3, -5, -3], y: [0, -5, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.15,
          }}
        />
        {/* Front card */}
        <motion.div
          className="relative flex h-28 w-20 items-center justify-center rounded-2xl border border-zinc-500/60 bg-zinc-800 shadow-xl"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        >
          <svg
            className="h-8 w-8 text-zinc-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </motion.div>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-white">You&apos;re all caught up</p>
        <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-zinc-400">
          You&apos;ve seen all available jobs. New opportunities are added regularly.
        </p>
      </div>

      <motion.button
        onClick={onRefresh}
        className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        aria-label="Refresh job listings"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        Refresh
      </motion.button>
    </motion.div>
  );
}
