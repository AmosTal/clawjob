"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

interface SwipeOverlayProps {
  x: MotionValue<number>;
}

export default function SwipeOverlay({ x }: SwipeOverlayProps) {
  const applyOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [0, -100], [0, 1]);

  return (
    <>
      {/* APPLY stamp — right swipe */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: applyOpacity }}
      >
        <span
          className="rounded-lg border-4 border-emerald-400 px-4 py-1.5 text-2xl font-extrabold uppercase tracking-widest text-emerald-400"
          style={{ transform: "rotate(-12deg)" }}
        >
          Apply
        </span>
      </motion.div>

      {/* SKIP stamp — left swipe */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: skipOpacity }}
      >
        <span
          className="rounded-lg border-4 border-red-500 px-4 py-1.5 text-2xl font-extrabold uppercase tracking-widest text-red-500"
          style={{ transform: "rotate(12deg)" }}
        >
          Skip
        </span>
      </motion.div>
    </>
  );
}
