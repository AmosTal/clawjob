"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { HRContact } from "@/lib/types";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-700 text-lg font-bold text-zinc-400">
      {initials}
    </div>
  );
}

interface HRFlipCardProps {
  hr: HRContact;
  companyLogo?: string;
}

export default function HRFlipCard({ hr, companyLogo }: HRFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div
      className="mx-auto w-full cursor-pointer"
      style={{ perspective: "800px", height: "150px" }}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="shrink-0">
            <div className="relative h-14 w-14 overflow-hidden rounded-full">
              {/* Layer 1: Initials (always behind) */}
              <Initials name={hr.name} />

              {/* Layer 2: Company logo fallback */}
              {photoFailed && companyLogo && !logoFailed && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-700 rounded-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={companyLogo}
                    alt={`${hr.name} - company logo`}
                    className="h-8 w-8 rounded-sm object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                </div>
              )}

              {/* Layer 3: HR photo (on top) */}
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
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-white">{hr.name}</p>
            <p className="text-sm text-zinc-400">{hr.title}</p>
            <p className="mt-1 text-xs text-zinc-600">Tap to see contact info</p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-sm text-zinc-400">{hr.email}</p>
          {hr.phone && (
            <p className="text-sm text-zinc-400">{hr.phone}</p>
          )}
          <div className="mt-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
            Contact Recruiter
          </div>
        </div>
      </motion.div>
    </div>
  );
}
