"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { JobCard } from "@/lib/types";

interface CVPreviewModalProps {
  job: JobCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (job: JobCard, message: string) => void;
  resumeURL?: string;
  resumeFileName?: string;
}

export default function CVPreviewModal({
  job,
  isOpen,
  onClose,
  onSend,
  resumeURL,
  resumeFileName,
}: CVPreviewModalProps) {
  const [message, setMessage] = useState("");

  if (!job) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-2xl border-t border-zinc-700 bg-zinc-900 px-4 pb-8 pt-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div className="mb-4 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-zinc-600" />
            </div>

            {/* Job info header */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-white">{job.role}</h3>
              <p className="text-sm text-zinc-400">{job.company}</p>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Requirements
                </h4>
                <ul className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CV info */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Your CV
              </h4>
              {resumeURL && resumeFileName ? (
                <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2">
                  <svg className="h-5 w-5 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="truncate text-sm text-white">{resumeFileName}</span>
                  <a
                    href={resumeURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto shrink-0 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Preview
                  </a>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No CV uploaded. Upload one in your profile.</p>
              )}
            </div>

            {/* Cover note */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Cover Note <span className="normal-case text-zinc-600">(optional)</span>
              </h4>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a brief note to the hiring manager..."
                rows={3}
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSend(job, message);
                  setMessage("");
                }}
                disabled={!resumeURL}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                Send CV
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
