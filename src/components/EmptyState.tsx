"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  onRefresh: () => void;
}

export default function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <motion.div
      className="flex h-[80vh] flex-col items-center justify-center gap-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated card stack icon */}
      <motion.div
        className="relative"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Back card */}
        <div className="absolute left-2 top-2 h-24 w-20 rounded-xl border border-zinc-700 bg-zinc-800" />
        {/* Middle card */}
        <div className="absolute left-1 top-1 h-24 w-20 rounded-xl border border-zinc-600 bg-zinc-800" />
        {/* Front card */}
        <div className="relative flex h-24 w-20 items-center justify-center rounded-xl border border-zinc-500 bg-zinc-800">
          <svg
            className="h-8 w-8 text-zinc-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </motion.div>

      <div className="mt-8">
        <p className="text-2xl font-bold text-white">No more jobs!</p>
        <p className="mt-2 text-sm text-zinc-400">
          Check back later for new opportunities
        </p>
      </div>

      <motion.button
        onClick={onRefresh}
        className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        Refresh
      </motion.button>
    </motion.div>
  );
}
