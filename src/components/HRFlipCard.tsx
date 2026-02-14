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
      className="mx-auto w-full cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
      onClick={() => setExpanded((e) => !e)}
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
          <p className="truncate text-sm font-semibold text-white">
            {hr.name || "Recruiter"}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {hr.title || "Talent Acquisition"}
          </p>
        </div>

        {/* Hint */}
        <span className="shrink-0 text-[11px] text-zinc-600">
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
          className="shrink-0 text-zinc-600"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-4 py-3">
              {hr.email && (
                <a
                  href={`mailto:${hr.email}`}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-emerald-400 transition-colors hover:bg-zinc-700"
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
                  {hr.email}
                </a>
              )}
              {hr.phone && (
                <a
                  href={`tel:${hr.phone}`}
                  className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-emerald-400 transition-colors hover:bg-zinc-700"
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
              <button
                className="ml-auto rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-500"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hr.email) window.open(`mailto:${hr.email}`);
                }}
              >
                Contact Recruiter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
