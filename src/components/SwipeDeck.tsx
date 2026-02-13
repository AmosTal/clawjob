"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { JobCard } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { auth } from "@/lib/firebase-client";
import ManagerHero from "./ManagerHero";
import ActionButtons from "./ActionButtons";
import HRFlipCard from "./HRFlipCard";
import SwipeOverlay from "./SwipeOverlay";
import ConfettiPop from "./ConfettiPop";
import EmptyState from "./EmptyState";

const SWIPE_THRESHOLD = 120;

export default function SwipeDeck({ jobs }: { jobs: JobCard[] }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(
    null
  );

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);

  const advance = useCallback(() => {
    setExitDirection(null);
    setCurrentIndex((i) => i + 1);
    x.set(0);
  }, [x]);

  const applyToJob = useCallback(
    async (job: JobCard) => {
      if (appliedIds.has(job.id) || applying) return true; // already applied, just advance

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

        // trigger confetti at center of viewport
        setConfetti({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });

        return true;
      } catch {
        showToast("Failed to apply. Try again.", "error");
        return false;
      } finally {
        setApplying(false);
      }
    },
    [appliedIds, applying, showToast]
  );

  const dismiss = useCallback(
    async (direction: "left" | "right") => {
      if (direction === "right") {
        const job = jobs[currentIndex];
        const success = await applyToJob(job);
        if (!success) {
          x.set(0);
          return;
        }
      }
      setExitDirection(direction);
    },
    [applyToJob, currentIndex, jobs, x]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        dismiss("right");
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        dismiss("left");
      } else {
        x.set(0);
      }
    },
    [dismiss, x]
  );

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

  return (
    <div className="flex flex-col gap-3">
      {/* Job header */}
      <div className="px-1 text-center">
        <p className="text-lg font-bold text-white">{job.role}</p>
        <p className="text-sm text-zinc-400">
          {job.company} &middot; {job.location}
        </p>
        {job.salary && (
          <p className="mt-0.5 text-xs font-medium text-emerald-400">
            {job.salary}
          </p>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {job.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Swipeable card */}
      <div className="relative">
        <motion.div
          key={job.id}
          className="touch-none"
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          onDragEnd={handleDragEnd}
          animate={
            exitDirection
              ? {
                  x: exitDirection === "right" ? 500 : -500,
                  rotate: exitDirection === "right" ? 20 : -20,
                  opacity: 0,
                }
              : {}
          }
          transition={exitDirection ? { duration: 0.35, ease: "easeIn" } : {}}
          onAnimationComplete={() => {
            if (exitDirection) advance();
          }}
        >
          <ManagerHero manager={job.manager} />
          <SwipeOverlay x={x} />
        </motion.div>
      </div>

      {/* Action buttons */}
      <ActionButtons
        onSkip={() => dismiss("left")}
        onApply={() => dismiss("right")}
      />

      {/* HR Flip Card */}
      <HRFlipCard hr={job.hr} />

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
