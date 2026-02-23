"use client";

import { useState, useCallback, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  type PanInfo,
  AnimatePresence,
} from "framer-motion";
import type { JobCard } from "@/lib/types";
import { SWIPE_THRESHOLD } from "@/lib/constants";
import { useToast } from "@/components/Toast";
import { auth } from "@/lib/firebase-client";
import ManagerHero from "./ManagerHero";
import ActionButtons from "./ActionButtons";
import HRFlipCard from "./HRFlipCard";
import SwipeOverlay from "./SwipeOverlay";
import ConfettiPop from "./ConfettiPop";
import EmptyState from "./EmptyState";
import SkeletonCard from "./SkeletonCard";
import JobDetailSheet from "./JobDetailSheet";

interface SwipeDeckProps {
  jobs: JobCard[];
  loading?: boolean;
  quickApply?: boolean;
}

export default function SwipeDeck({ jobs, loading, quickApply }: SwipeDeckProps) {
  const { showToast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [externallyOpenedIds, setExternallyOpenedIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const isDragging = useRef(false);
  const inFlightApplies = useRef(new Set<string>());

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);

  // Spring-based side indicator transforms — critically damped for a responsive, physical feel
  const springConfig = { stiffness: 280, damping: 26, mass: 0.6 };

  const rawSkipOpacity = useTransform(x, [0, -60, -140], [0.25, 0.6, 1]);
  const rawSkipScale = useTransform(x, [0, -60, -140], [0.9, 1.05, 1.25]);
  const rawApplyOpacity = useTransform(x, [0, 60, 140], [0.25, 0.6, 1]);
  const rawApplyScale = useTransform(x, [0, 60, 140], [0.9, 1.05, 1.25]);

  const skipIndicatorOpacity = useSpring(rawSkipOpacity, springConfig);
  const skipIndicatorScale = useSpring(rawSkipScale, springConfig);
  const applyIndicatorOpacity = useSpring(rawApplyOpacity, springConfig);
  const applyIndicatorScale = useSpring(rawApplyScale, springConfig);

  const advance = useCallback(() => {
    setExitDirection(null);
    setCurrentIndex((i) => i + 1);
    x.set(0);
  }, [x]);

  const isExternalJob = useCallback((job: JobCard) => {
    return !job.employerId && !!(job.sourceUrl || job.applyUrl);
  }, []);

  const getExternalUrl = useCallback((job: JobCard) => {
    return job.applyUrl || job.sourceUrl || "";
  }, []);

  const openExternalJob = useCallback(
    (job: JobCard) => {
      const url = getExternalUrl(job);
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
      setExternallyOpenedIds((prev) => new Set(prev).add(job.id));
      showToast(`Opening ${job.sourceName || job.company}...`, "info");
    },
    [getExternalUrl, showToast]
  );

  const applyToJob = useCallback(
    async (job: JobCard) => {
      // External jobs: open URL instead of internal apply
      if (isExternalJob(job)) {
        openExternalJob(job);
        return true;
      }

      if (appliedIds.has(job.id) || applying) return true;

      setApplying(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId: job.id }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to apply");
        }

        setAppliedIds((prev) => new Set(prev).add(job.id));
        showToast(`Applied to ${job.company}!`, "success");

        setConfetti({
          x: window.innerWidth * 0.65,
          y: window.innerHeight * 0.55,
        });

        return true;
      } catch {
        showToast("Failed to apply. Try again.", "error");
        return false;
      } finally {
        setApplying(false);
      }
    },
    [appliedIds, applying, showToast, isExternalJob, openExternalJob]
  );

  const saveJob = useCallback(
    async (job: JobCard, skipExit?: boolean) => {
      if (saving) return true;

      setSaving(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId: job.id }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save");
        }

        showToast(`Saved ${job.role}`, "info");
        if (!skipExit) setExitDirection("left");
        return true;
      } catch {
        showToast("Failed to save. Try again.", "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [saving, showToast]
  );

  const dismiss = useCallback(
    async (direction: "left" | "right") => {
      if (direction === "right") {
        if (quickApply) {
          const job = jobs[currentIndex];
          const success = await applyToJob(job);
          if (!success) {
            x.set(0);
            return;
          }
        } else {
          const saved = await saveJob(jobs[currentIndex], true);
          if (!saved) {
            x.set(0);
            return;
          }
        }
      }
      setExitDirection(direction);
    },
    [applyToJob, saveJob, quickApply, currentIndex, jobs, x]
  );

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        dismiss("right");
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        dismiss("left");
      } else {
        x.set(0);
      }
      // Reset after a short delay so the subsequent click event is suppressed
      setTimeout(() => {
        isDragging.current = false;
      }, 100);
    },
    [dismiss, x]
  );

  if (loading) {
    return <SkeletonCard />;
  }

  if (jobs.length === 0) {
    return (
      <motion.div
        className="flex h-[70dvh] flex-col items-center justify-center gap-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80">
          <svg className="h-8 w-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-white">Fetching new jobs</p>
          <p className="mx-auto mt-1.5 max-w-[280px] text-sm leading-relaxed text-zinc-400">
            We&apos;re finding jobs from across the web — check back in a minute!
          </p>
        </div>
        <span className="mt-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </motion.div>
    );
  }

  if (currentIndex >= jobs.length) {
    return (
      <EmptyState
        onRefresh={() => {
          setCurrentIndex(0);
          setAppliedIds(new Set());
        }}
      />
    );
  }

  const job = jobs[currentIndex];

  const manager = job.manager ?? {
    name: "Hiring Manager",
    title: `Manager at ${job.company}`,
    tagline: `Join us at ${job.company}`,
    photo: `https://ui-avatars.com/api/?name=HM&background=4F46E5&color=fff&size=128`,
    isAIGenerated: false,
    enrichmentSource: "placeholder" as const,
  };

  const hr = job.hr ?? {
    name: `${job.company} Recruiting`,
    title: `Talent Acquisition at ${job.company}`,
    photo: `https://ui-avatars.com/api/?name=HR&background=10B981&color=fff&size=128`,
    email: `careers@${job.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    isAIGenerated: false,
    enrichmentSource: "placeholder" as const,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Job header */}
      <div className="px-1 text-center">
        <h1 className="truncate text-lg font-bold leading-tight text-white">
          {job.role}
        </h1>
        <p className="flex items-center justify-center gap-1.5 truncate text-sm text-zinc-400">
          {job.companyLogo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={job.companyLogo}
              alt={job.company}
              className="inline-block h-4 w-4 rounded-sm object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          {job.company} &middot; {job.location}
        </p>
      </div>

      {/* Swipeable card with side indicators */}
      <div className="flex items-center gap-1">
        {/* Left indicator -- Skip */}
        <motion.div
          className="flex w-10 shrink-0 flex-col items-center justify-center gap-1"
          style={{ opacity: skipIndicatorOpacity, scale: skipIndicatorScale }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">
            Skip
          </span>
        </motion.div>

        {/* Center -- Draggable card */}
        <div className="relative min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={job.id}
              className="touch-none"
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.9}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.88, opacity: 0, y: 12 }}
              animate={
                exitDirection
                  ? {
                      x: exitDirection === "right" ? 500 : -500,
                      rotate: exitDirection === "right" ? 18 : -18,
                      opacity: 0,
                    }
                  : { scale: 1, opacity: 1, y: 0 }
              }
              transition={
                exitDirection
                  ? { duration: 0.3, ease: [0.32, 0, 0.67, 0] }
                  : { type: "spring", stiffness: 350, damping: 28, mass: 0.8 }
              }
              onAnimationComplete={() => {
                if (exitDirection) advance();
              }}
            >
              <ManagerHero
                manager={manager}
                company={job.company}
                companyLogo={job.companyLogo}
                onTap={() => { if (!isDragging.current) setDetailOpen(true); }}
              />
              <SwipeOverlay x={x} quickApply={quickApply} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right indicator -- Save or Apply depending on mode */}
        <motion.div
          className="flex w-10 shrink-0 flex-col items-center justify-center gap-1"
          style={{ opacity: applyIndicatorOpacity, scale: applyIndicatorScale }}
        >
          {quickApply ? (
            <>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-500"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                Apply
              </span>
            </>
          ) : (
            <>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                Save
              </span>
            </>
          )}
        </motion.div>
      </div>

      {/* Action buttons */}
      <ActionButtons
        onSkip={() => dismiss("left")}
        onSave={() => saveJob(job)}
        onApply={async () => {
          const success = await applyToJob(job);
          if (success && !isExternalJob(job)) setExitDirection("right");
        }}
        onSwipeRight={() => dismiss("right")}
        quickApply={quickApply}
        isExternal={isExternalJob(job)}
        externalUrl={getExternalUrl(job)}
      />

      {/* HR Contact Bar */}
      <HRFlipCard hr={hr} companyLogo={job.companyLogo} />

      {/* Job Detail Sheet */}
      <JobDetailSheet
        job={job}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Confetti */}
      {confetti && (
        <ConfettiPop
          x={confetti.x}
          y={confetti.y}
          onComplete={() => setConfetti(null)}
        />
      )}
    </div>
  );
}
