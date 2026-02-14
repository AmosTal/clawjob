"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    setShowDetails(false);
  }, [isOpen]);

  if (!job) return null;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const color = getCompanyColor(job.company);

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
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-zinc-900 shadow-2xl"
            style={{ maxHeight: "85vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            {/* Grab handle */}
            <div className="flex shrink-0 justify-center pt-3 pb-2">
              <div className="h-1.5 w-10 rounded-full bg-zinc-600" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-6 pb-10">
              {/* Company header */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <span className="text-base font-medium text-zinc-300">
                  {job.company}
                </span>
              </div>

              {/* Role title */}
              <h2 className="mb-4 text-2xl font-bold text-white">
                {job.role}
              </h2>

              {/* Info row */}
              <div className="mb-4 flex flex-wrap gap-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {job.location}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-1.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                    {job.salary}
                  </span>
                )}
                {job.teamSize && (
                  <span className="flex items-center gap-1.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    {job.teamSize}
                  </span>
                )}
              </div>

              {/* Hiring Manager card — prominent in stage 1 */}
              {job.manager && (
                <div className="mb-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Hiring Manager
                  </h3>
                  <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 p-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {(job.manager.name || "HM")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {job.manager.name || "Hiring Manager"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {job.manager.title || "Manager"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Culture tags */}
              {job.culture && job.culture.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {job.culture.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* View Full Description toggle */}
              {(job.description || (job.requirements && job.requirements.length > 0) || (job.benefits && job.benefits.length > 0)) && (
                <>
                  <button
                    onClick={() => setShowDetails((v) => !v)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                  >
                    {showDetails ? "Hide Description" : "View Full Description"}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Stage 2 — expandable details */}
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4">
                          {/* About this role */}
                          {job.description && (
                            <div className="mb-4">
                              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                About this role
                              </h3>
                              <p className="text-sm leading-relaxed text-zinc-300">
                                {job.description}
                              </p>
                            </div>
                          )}

                          {/* Requirements */}
                          {job.requirements && job.requirements.length > 0 && (
                            <div className="mb-4">
                              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Requirements
                              </h3>
                              <ul className="space-y-2">
                                {job.requirements.map((req) => (
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
                              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
