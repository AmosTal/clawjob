"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { HRContact } from "@/lib/types";

function Initials({ name }: { name: string }) {
  const initials = (name || "HR")
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-400">
      {initials}
    </div>
  );
}

interface HRFlipCardProps {
  hr: HRContact;
  companyLogo?: string;
}

export default function HRFlipCard({ hr, companyLogo }: HRFlipCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div
      className="mx-auto w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden"
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Compact single-line bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <Initials name={hr.name} />

          {photoFailed && companyLogo && !logoFailed && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyLogo}
                alt={`${hr.name} - company logo`}
                className="h-5 w-5 rounded-sm object-contain"
                onError={() => setLogoFailed(true)}
              />
            </div>
          )}

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
            <span className="ml-2 font-normal text-zinc-500">
              {hr.title || "Talent Acquisition"}
            </span>
          </p>
        </div>

        {/* Hint */}
        <span className="shrink-0 text-xs text-zinc-600">
          {expanded ? "Tap to close" : "Tap for contact"}
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
          transition={{ duration: 0.2 }}
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
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 px-4 py-3">
              {hr.email && (
                <a
                  href={`mailto:${hr.email}`}
                  className="text-sm text-emerald-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {hr.email}
                </a>
              )}
              {hr.phone && (
                <a
                  href={`tel:${hr.phone}`}
                  className="text-sm text-emerald-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {hr.phone}
                </a>
              )}
              <button
                className="ml-auto rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
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
    </div>
  );
}
