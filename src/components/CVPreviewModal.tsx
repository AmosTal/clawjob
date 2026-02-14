"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { JobCard, CVVersion } from "@/lib/types";

interface CVPreviewModalProps {
  job: JobCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (job: JobCard, message: string, resumeVersionId?: string) => void;
  resumeURL?: string;
  resumeFileName?: string;
  cvVersions?: CVVersion[];
}

const MAX_NOTE_LENGTH = 500;

export default function CVPreviewModal({
  job,
  isOpen,
  onClose,
  onSend,
  resumeURL,
  resumeFileName,
  cvVersions = [],
}: CVPreviewModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);

  // Pre-select the default CV when modal opens
  useEffect(() => {
    if (isOpen && cvVersions.length > 0) {
      const defaultCv = cvVersions.find((cv) => cv.isDefault);
      setSelectedCvId(defaultCv?.id ?? cvVersions[0].id);
    } else {
      setSelectedCvId(null);
    }
  }, [isOpen, cvVersions]);

  if (!job) return null;

  const charCount = message.length;
  const charRatio = charCount / MAX_NOTE_LENGTH;
  const selectedCv = cvVersions.find((cv) => cv.id === selectedCvId);

  // Determine what CV info to show: selected version, or legacy single CV
  const displayUrl = selectedCv?.url ?? resumeURL;
  const displayName = selectedCv?.name ?? resumeFileName;
  const hasAnyCv = cvVersions.length > 0 || (resumeURL && resumeFileName);

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
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] rounded-t-2xl border-t border-zinc-700/50 bg-zinc-900 px-4 pb-8 pt-4"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div className="mb-5 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-zinc-600" />
            </div>

            {/* Job info header */}
            <div className="mb-5 flex items-center gap-3">
              {job.companyLogo && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800 p-1.5">
                  <img
                    src={job.companyLogo}
                    alt={job.company}
                    className="h-full w-full rounded-md object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-white">{job.role}</h3>
                <p className="truncate text-sm text-zinc-400">{job.company}</p>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="mb-5">
                <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Requirements
                </h4>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <ul className="flex flex-col gap-2">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* CV selector */}
            <div className="mb-5">
              <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Your CV
              </h4>

              {cvVersions.length > 1 ? (
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedCvId ?? ""}
                    onChange={(e) => setSelectedCvId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-zinc-700/50 bg-zinc-800 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                  >
                    {cvVersions.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.name}{cv.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                  {selectedCv && (
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800 px-4 py-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                        <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                        {selectedCv.fileName}
                      </span>
                      <a
                        href={selectedCv.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-md bg-zinc-700 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-zinc-600"
                      >
                        Preview
                      </a>
                    </div>
                  )}
                </div>
              ) : hasAnyCv ? (
                <div className="flex items-center gap-3 rounded-xl border border-zinc-700/50 bg-zinc-800 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{displayName}</span>
                  {displayUrl && (
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md bg-zinc-700 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-zinc-600"
                    >
                      Preview
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-800/50 px-4 py-3">
                  <svg className="h-5 w-5 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p className="text-sm text-zinc-500">No CV uploaded. Upload one in your profile.</p>
                </div>
              )}
            </div>

            {/* Cover note */}
            <div className="mb-5">
              <div className="mb-2.5 flex items-baseline justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Cover Note <span className="normal-case text-zinc-600">(optional)</span>
                </h4>
                <span
                  className={`text-xs tabular-nums ${
                    charRatio > 0.9 ? "text-red-400" : charRatio > 0.7 ? "text-amber-400" : "text-zinc-500"
                  }`}
                >
                  {charCount > 0 && `${charCount}/${MAX_NOTE_LENGTH}`}
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_NOTE_LENGTH) {
                    setMessage(e.target.value);
                  }
                }}
                placeholder="Add a brief note to the hiring manager..."
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-700/50 bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={sending}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                onClick={async () => {
                  setSending(true);
                  onSend(job, message, selectedCvId ?? undefined);
                  setMessage("");
                  setSending(false);
                }}
                disabled={sending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                whileTap={{ scale: 0.97 }}
              >
                {sending ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    {hasAnyCv ? "Apply Now" : "Apply without CV"}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
