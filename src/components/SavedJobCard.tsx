"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import type { JobCard } from "@/lib/types";

interface SavedJobCardProps {
  job: JobCard;
  index: number;
  onApply: (job: JobCard) => void;
  onRemove: (jobId: string) => void;
  applied?: boolean;
}

export default function SavedJobCard({
  job,
  index,
  onApply,
  onRemove,
  applied,
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
      className="relative overflow-hidden rounded-xl border border-zinc-700/40 bg-zinc-900 transition-colors hover:border-zinc-600/60"
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
        className="relative touch-pan-x bg-zinc-900 px-3 py-3"
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
            {applied && (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                Applied
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            {applied ? (
              <span className="rounded-full bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-500 min-h-[36px] flex items-center">
                Applied
              </span>
            ) : !job.employerId && (job.sourceUrl || job.applyUrl) ? (
              <motion.a
                href={job.applyUrl || job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 touch-manipulation min-h-[36px]"
                whileTap={{ scale: 0.93 }}
                aria-label={`View ${job.role} on ${job.sourceName || job.company}`}
              >
                View
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </motion.a>
            ) : (
              <motion.button
                onClick={() => onApply(job)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 touch-manipulation min-h-[36px]"
                whileTap={{ scale: 0.93 }}
                aria-label={`Apply to ${job.role} at ${job.company}`}
              >
                Apply
              </motion.button>
            )}
            <motion.button
              onClick={() => onRemove(job.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 touch-manipulation"
              whileTap={{ scale: 0.9 }}
              aria-label={`Remove ${job.role} from saved jobs`}
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
