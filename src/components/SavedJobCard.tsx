"use client";

import { motion } from "framer-motion";
import type { JobCard } from "@/lib/types";

interface SavedJobCardProps {
  job: JobCard;
  onApply: (job: JobCard) => void;
  onRemove: (jobId: string) => void;
}

export default function SavedJobCard({
  job,
  onApply,
  onRemove,
}: SavedJobCardProps) {
  const initials = job.manager.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      layout
      layoutId={`saved-${job.id}`}
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-3">
        {/* Manager avatar */}
        {job.manager.photo ? (
          <img
            src={job.manager.photo}
            alt={job.manager.name}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
            {initials}
          </div>
        )}

        {/* Job info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{job.role}</p>
          <p className="truncate text-xs text-zinc-400">{job.company}</p>
          <div className="mt-0.5 flex items-center gap-2">
            {job.salary && (
              <span className="text-xs text-emerald-400">{job.salary}</span>
            )}
            <span className="text-xs text-zinc-500">{job.location}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <motion.button
            onClick={() => onApply(job)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
            whileTap={{ scale: 0.95 }}
          >
            Apply
          </motion.button>
          <motion.button
            onClick={() => onRemove(job.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700 text-zinc-300"
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
