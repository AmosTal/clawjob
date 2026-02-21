"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import type { JobCard } from "@/lib/types";

interface JobDetailSheetProps {
  job: JobCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const companyColors: Record<string, string> = {
  N: "#6366f1",
  V: "#22c55e",
  C: "#3b82f6",
  F: "#f59e0b",
  S: "#ec4899",
};

function getCompanyColor(name: string) {
  const letter = name.charAt(0).toUpperCase();
  return companyColors[letter] || "#a1a1aa";
}

export default function JobDetailSheet({
  job,
  isOpen,
  onClose,
}: JobDetailSheetProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [fullJob, setFullJob] = useState<JobCard | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Fetch full job data when the sheet opens (listing endpoint returns partial data)
  useEffect(() => {
    setShowDetails(false);
    setLogoFailed(false);
    setFullJob(null);

    if (!isOpen || !job) return;

    // If the job already has description/requirements, no need to fetch
    if (job.description || (job.requirements && job.requirements.length > 0)) {
      setFullJob(job);
      return;
    }

    let cancelled = false;
    setLoadingFull(true);

    fetch(`/api/jobs/${job.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: JobCard | null) => {
        if (!cancelled && data) setFullJob(data);
      })
      .catch(() => {
        // Fall back to partial data if fetch fails
      })
      .finally(() => {
        if (!cancelled) setLoadingFull(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, job]);

  // Focus trap and Escape key handling for modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab" || !sheetRef.current) return;
    const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => sheetRef.current?.focus(), 100);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, handleKeyDown]);

  if (!job) return null;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const color = getCompanyColor(job.company);
  // Use full job data if available, otherwise fall back to listing data
  const detail = fullJob ?? job;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Job details: ${job.role} at ${job.company}`}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-zinc-900 shadow-2xl outline-none"
            style={{ maxHeight: "85vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.25, ease: [0.32, 0, 0.67, 0] } }}
            transition={{ type: "spring", damping: 32, stiffness: 340, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            {/* Grab handle — enlarged touch area for ergonomic drag */}
            <div className="flex shrink-0 justify-center pt-3 pb-3 touch-none cursor-grab active:cursor-grabbing">
              <div className="h-1.5 w-10 rounded-full bg-zinc-500" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto overscroll-contain px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
              {/* Source attribution chip for external jobs */}
              {!job.employerId && job.sourceName && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Via {job.sourceName}
                  </span>
                </div>
              )}

              {/* Company header */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {/* Colored initial fallback */}
                  {job.company.charAt(0).toUpperCase()}

                  {/* Company logo overlay */}
                  {job.companyLogo && !logoFailed && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="absolute inset-0 h-full w-full rounded-full object-cover"
                      onError={() => setLogoFailed(true)}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-zinc-300">
                    {job.company}
                  </span>
                  {job.location && (
                    <p className="truncate text-xs text-zinc-500">{job.location}</p>
                  )}
                </div>
              </div>

              {/* Role title */}
              <h2 className="mb-4 text-2xl font-bold text-white">
                {job.role}
              </h2>

              {/* Posted date for external jobs */}
              {detail.postedAt && (
                <p className="mb-3 text-xs text-zinc-500">
                  Posted {new Date(detail.postedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}

              {/* Key details */}
              <div className="mb-4 flex flex-wrap gap-2">
                {job.location && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 px-2.5 py-1 text-sm text-zinc-400">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-sm font-medium text-emerald-400">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                    {job.salary}
                  </span>
                )}
                {detail.teamSize && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 px-2.5 py-1 text-sm text-zinc-400">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    {detail.teamSize}
                  </span>
                )}
              </div>

              {/* Hiring Manager card */}
              {detail.manager && (
                <div className="mb-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Hiring Manager
                  </h3>
                  <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 p-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {(detail.manager.name || "HM")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {detail.manager.name || "Hiring Manager"}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {detail.manager.title || "Manager"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Culture tags */}
              {detail.culture && detail.culture.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Culture
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.culture.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading indicator for full job data */}
              {loadingFull && (
                <div className="flex items-center justify-center py-4">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                </div>
              )}

              {/* View Full Description toggle */}
              {(detail.description || (detail.requirements && detail.requirements.length > 0) || (detail.benefits && detail.benefits.length > 0)) && (
                <>
                  <motion.button
                    onClick={() => setShowDetails((v) => !v)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 py-3.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 touch-manipulation min-h-[48px]"
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    {showDetails ? "Hide Description" : "View Full Description"}
                    <motion.svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{ rotate: showDetails ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </motion.svg>
                  </motion.button>

                  {/* Stage 2 -- expandable details */}
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4">
                          {/* About this role */}
                          {detail.description && (
                            <div className="mb-4">
                              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                About this role
                              </h3>
                              <p className="text-sm leading-relaxed text-zinc-300">
                                {detail.description}
                              </p>
                            </div>
                          )}

                          {/* Requirements */}
                          {detail.requirements && detail.requirements.length > 0 && (
                            <div className="mb-4">
                              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Requirements
                              </h3>
                              <ul className="space-y-2">
                                {detail.requirements.map((req) => (
                                  <li
                                    key={req}
                                    className="flex items-start gap-2 text-sm text-zinc-300"
                                  >
                                    <svg
                                      className="mt-0.5 shrink-0 text-emerald-400"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden="true"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Benefits */}
                          {job.benefits && job.benefits.length > 0 && (
                            <div className="mb-4">
                              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Benefits
                              </h3>
                              <ul className="space-y-2">
                                {job.benefits.map((benefit) => (
                                  <li
                                    key={benefit}
                                    className="flex items-start gap-2 text-sm text-zinc-300"
                                  >
                                    <svg
                                      className="mt-0.5 shrink-0 text-amber-400"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      aria-hidden="true"
                                    >
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* External apply button for scraped jobs */}
              {!job.employerId && (job.sourceUrl || job.applyUrl) && (
                <motion.a
                  href={job.applyUrl || job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 touch-manipulation min-h-[48px]"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                >
                  Apply on {job.sourceName || job.company}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </motion.a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
