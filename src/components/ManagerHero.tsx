"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ManagerAsset } from "@/lib/types";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-5xl font-bold text-zinc-500">
      {initials}
    </div>
  );
}

interface ManagerHeroProps {
  manager: ManagerAsset;
  companyLogo?: string;
  onTap?: () => void;
}

export default function ManagerHero({ manager, companyLogo, onTap }: ManagerHeroProps) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl"
      style={{ height: "70vh", cursor: onTap ? "pointer" : undefined }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onTap}
    >
      {/* Background: video or photo fallback */}
      {manager.video ? (
        <video
          src={manager.video}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <>
          {/* Layer 1: Initials (always rendered behind) */}
          <Initials name={manager.name} />

          {/* Layer 2: Company logo fallback (shown when photo fails) */}
          {photoFailed && companyLogo && !logoFailed && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyLogo}
                alt={`${manager.name} - company logo`}
                className="h-32 w-32 rounded-2xl object-contain"
                onError={() => setLogoFailed(true)}
              />
            </div>
          )}

          {/* Layer 3: Manager photo (on top) */}
          {!photoFailed && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={manager.photo}
              alt={manager.name}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setPhotoFailed(true)}
            />
          )}
        </>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h2 className="text-2xl font-bold text-white">{manager.name}</h2>
        <p className="text-sm font-medium text-zinc-300">{manager.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400 italic">
          &ldquo;{manager.tagline}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}
