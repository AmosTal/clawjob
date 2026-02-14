"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
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
  const initials = (job.manager?.name ?? job.company)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const x = useMotionValue(0);
  const bg = useTransform(x, [-120, -60, 0], ["rgba(239,68,68,0.15)", "rgba(239,68,68,0.08)", "rgba(0,0,0,0)"]);
  const removeOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);

  return (
    <motion.div
      layout
      layoutId={`saved-${job.id}`}
      className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, transition: { duration: 0.25 } }}
      transition={{ duration: 0.25 }}
    >
      {/* Swipe-to-remove background */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end px-5"
        style={{ backgroundColor: bg }}
      >
        <motion.span
          className="text-xs font-semibold text-red-400"
          style={{ opacity: removeOpacity }}
        >
          Remove
        </motion.span>
      </motion.div>

      <motion.div
        className="relative bg-zinc-900 p-4"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={(_, info) => {
          if (info.offset.x < -100) {
            onRemove(job.id);
          }
        }}
      >
        <div className="flex items-center gap-3">
          {/* Company logo + manager avatar */}
          <div className="relative shrink-0">
            {job.companyLogo ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800 p-1.5">
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="h-full w-full rounded-md object-contain"
                />
              </div>
            ) : job.manager?.photo ? (
              <img
                src={job.manager.photo}
                alt={job.manager.name}
                className="h-11 w-11 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">
                {initials}
              </div>
            )}
            {/* Small manager avatar overlay when company logo is present */}
            {job.companyLogo && job.manager?.photo && (
              <img
                src={job.manager.photo}
                alt={job.manager.name}
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-zinc-900 object-cover"
              />
            )}
          </div>

          {/* Job info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{job.role}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {job.company}
              {job.location && (
                <span className="text-zinc-600"> &middot; {job.location}</span>
              )}
            </p>
            {job.salary && (
              <p className="mt-0.5 text-xs font-medium text-emerald-400">
                {job.salary}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <motion.button
              onClick={() => onApply(job)}
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
              whileTap={{ scale: 0.93 }}
            >
              Apply
            </motion.button>
            <motion.button
              onClick={() => onRemove(job.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
              whileTap={{ scale: 0.9 }}
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
    </motion.div>
  );
}
