"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HRContact } from "@/lib/types";

interface HRFlipCardProps {
  hr: HRContact;
  companyLogo?: string;
}

export default function HRFlipCard({ hr, companyLogo }: HRFlipCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <motion.div
      className="mx-auto w-full cursor-pointer overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900"
      onClick={() => setExpanded((e) => !e)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } }}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${hr.name || "Recruiter"} contact info, ${expanded ? "collapse" : "expand"}`}
      layout
    >
      {/* Compact single-line bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-700">
          {/* Layer 1: Initials fallback */}
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-zinc-400">
            {(hr.name || "HR")
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </div>

          {/* Layer 2: Company logo fallback (shown when photo fails) */}
          {photoFailed && companyLogo && !logoFailed && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyLogo}
                alt={`${hr.name} - company logo`}
                className="h-5 w-5 rounded-sm object-contain"
                onError={() => setLogoFailed(true)}
              />
            </div>
          )}

          {/* Layer 3: Photo on top */}
          {!photoFailed && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={hr.photo}
              alt={hr.name}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setPhotoFailed(true)}
            />
          )}
        </div>

        {/* Name + title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-white">
              {hr.name || "Recruiter"}
            </p>
            {hr.isAIGenerated && (
              <span className="shrink-0 rounded bg-zinc-700 px-1 py-px text-[9px] font-medium text-zinc-400">AI</span>
            )}
          </div>
          <p className="truncate text-xs text-zinc-400">
            {hr.title || "Talent Acquisition"}
          </p>
        </div>

        {/* LinkedIn link */}
        {hr.linkedinUrl && (
          <a
            href={hr.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
            onClick={(e) => e.stopPropagation()}
            aria-label={`${hr.name} LinkedIn profile`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        )}

        {/* Hint */}
        <span className="shrink-0 text-[11px] text-zinc-400">
          {expanded ? "Close" : "Contact"}
        </span>

        {/* Chevron */}
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-zinc-400"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 22, mass: 0.6 }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </div>

      {/* Expandable contact info */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] } }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.7 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-4 py-3 min-w-0">
              {hr.email && (
                <a
                  href={`mailto:${hr.email}`}
                  className="flex min-w-0 items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-emerald-400 transition-colors hover:bg-zinc-700 touch-manipulation min-h-[36px]"
                  onClick={(e) => e.stopPropagation()}
                >
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
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span className="truncate">{hr.email}</span>
                  {/^careers@/i.test(hr.email) && (
                    <span className="shrink-0 text-[10px] text-zinc-500">(estimated)</span>
                  )}
                </a>
              )}
              {hr.phone && (
                <a
                  href={`tel:${hr.phone}`}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-emerald-400 transition-colors hover:bg-zinc-700 touch-manipulation min-h-[36px]"
                  onClick={(e) => e.stopPropagation()}
                >
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {hr.phone}
                </a>
              )}
              <motion.button
                className="ml-auto rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-500 touch-manipulation min-h-[36px]"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (hr.email) window.open(`mailto:${hr.email}`);
                }}
              >
                Contact Recruiter
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
