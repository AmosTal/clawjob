"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ManagerAsset } from "@/lib/types";

function Initials({ name }: { name: string }) {
  const initials = (name || "HM")
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-5xl font-bold text-zinc-500">
      {initials}
    </div>
  );
}

function MediaSkeleton() {
  return (
    <div className="absolute inset-0 bg-zinc-800">
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]" />
    </div>
  );
}

interface ManagerHeroProps {
  manager: ManagerAsset;
  company?: string;
  companyLogo?: string;
  onTap?: () => void;
}

export default function ManagerHero({ manager, company, companyLogo, onTap }: ManagerHeroProps) {
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoReady = useCallback(() => {
    setVideoLoaded(true);
  }, []);

  const handleVideoError = useCallback(() => {
    setVideoFailed(true);
  }, []);

  const showVideo = manager.video && !videoFailed;

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.08]"
      style={{ height: "calc(100dvh - 340px)", minHeight: "200px", maxHeight: "400px", cursor: onTap ? "pointer" : undefined }}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.8 }}
      onClick={onTap}
      onKeyDown={onTap ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); } } : undefined}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      aria-label={onTap ? `View details for ${manager.name || "Hiring Manager"} at ${company || "company"}` : undefined}
    >
      {/* Skeleton loading state */}
      <AnimatePresence>
        {(showVideo ? !videoLoaded : !photoLoaded && !photoFailed) && (
          <motion.div
            key="skeleton"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[1]"
          >
            <MediaSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background: video or photo fallback */}
      {showVideo ? (
        <motion.video
          ref={videoRef}
          src={manager.video}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={manager.photo}
          onCanPlayThrough={handleVideoReady}
          onError={handleVideoError}
          initial={{ opacity: 0 }}
          animate={{ opacity: videoLoaded ? 1 : 0 }}
          transition={{ duration: 0.5 }}
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
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: photoLoaded ? 1 : 0, scale: photoLoaded ? 1 : 1.04 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={manager.photo}
                alt={manager.name}
                className="absolute inset-0 h-full w-full object-cover"
                onLoad={() => setPhotoLoaded(true)}
                onError={() => setPhotoFailed(true)}
              />
            </motion.div>
          )}
        </>
      )}

      {/* Gradient overlay — rich for text readability on varied photos */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/5" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Company badge — glass morphism */}
      {company && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.08] px-2.5 py-1 shadow-lg backdrop-blur-xl">
          {companyLogo && !logoFailed && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={companyLogo}
              alt={company}
              className="h-3.5 w-3.5 rounded-sm object-contain"
              onError={() => setLogoFailed(true)}
            />
          )}
          <span className="text-xs font-medium text-white/90">{company}</span>
        </div>
      )}

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 z-[2] p-5">
        <h2 className="text-2xl font-bold text-white drop-shadow-md">{manager.name || "Hiring Manager"}</h2>
        <p className="text-sm font-medium text-zinc-200 drop-shadow-sm">{manager.title || "Manager"}</p>
        {manager.tagline && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-300 italic drop-shadow-sm">
            &ldquo;{manager.tagline}&rdquo;
          </p>
        )}
        {/* Tap hint with pulse */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/50" />
          </span>
          <p className="text-[10px] font-medium tracking-wide text-white/60">Tap for details</p>
        </div>
      </div>
    </motion.div>
  );
}
