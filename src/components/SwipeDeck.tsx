"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { JobCard } from "@/lib/types";
import ManagerHero from "./ManagerHero";
import ActionButtons from "./ActionButtons";
import HRFlipCard from "./HRFlipCard";

const SWIPE_THRESHOLD = 120;

export default function SwipeDeck({ jobs }: { jobs: JobCard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
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

  const dismiss = useCallback(
    (direction: "left" | "right") => {
      setExitDirection(direction);
    },
    []
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
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-2xl font-bold text-zinc-300">No more jobs!</p>
        <p className="text-zinc-500">Check back later.</p>
      </div>
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
      </motion.div>

      {/* Action buttons */}
      <ActionButtons
        onSkip={() => dismiss("left")}
        onApply={() => dismiss("right")}
      />

      {/* HR Flip Card */}
      <HRFlipCard hr={job.hr} />
    </div>
  );
}
