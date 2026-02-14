"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import type { JobCard } from "@/lib/types";

interface SavedJobCardProps {
  job: JobCard;
  index: number;
  onApply: (job: JobCard) => void;
  onRemove: (jobId: string) => void;
}

export default function SavedJobCard({
  job,
  index,
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
  const bg = useTransform(
    x,
    [-120, -60, 0],
    ["rgba(239,68,68,0.15)", "rgba(239,68,68,0.08)", "rgba(0,0,0,0)"]
  );
  const removeOpacity = useTransform(x, [-120, -60, 0], [1, 0.6, 0]);

  // Determine thumbnail: manager photo > company logo > initials
  const thumbnailPhoto = job.manager?.photo;
  const thumbnailLogo = job.companyLogo;

  return (
    <motion.div
      layout
      layoutId={`saved-${job.id}`}
      className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
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
        className="relative bg-zinc-900 px-3 py-3"
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
          {/* Manager photo thumbnail */}
          <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl">
            {thumbnailPhoto ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbnailPhoto})` }}
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/10" />
              </>
            ) : thumbnailLogo ? (
              <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                <img
                  src={thumbnailLogo}
                  alt={job.company}
                  className="h-8 w-8 object-contain"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-700">
                <span className="text-sm font-bold text-white">{initials}</span>
              </div>
            )}
          </div>

          {/* Job info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-white">
              {job.role}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              {job.companyLogo && (
                <img
                  src={job.companyLogo}
                  alt=""
                  className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain"
                />
              )}
              <p className="truncate text-xs text-zinc-400">{job.company}</p>
            </div>
            {job.location && (
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {job.location}
              </p>
            )}
            {job.salary && (
              <p className="mt-0.5 text-xs font-medium text-emerald-400">
                {job.salary}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <motion.button
              onClick={() => onApply(job)}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
              whileTap={{ scale: 0.93 }}
            >
              Apply
            </motion.button>
            <motion.button
              onClick={() => onRemove(job.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              whileTap={{ scale: 0.9 }}
            >
              <svg
                className="h-3.5 w-3.5"
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
