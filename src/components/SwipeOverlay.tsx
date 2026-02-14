"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

interface SwipeOverlayProps {
  x: MotionValue<number>;
  dangerousMode?: boolean;
}

export default function SwipeOverlay({ x, dangerousMode }: SwipeOverlayProps) {
  const applyOpacity = useTransform(x, [0, 80, 140], [0, 0.7, 1]);
  const skipOpacity = useTransform(x, [0, -80, -140], [0, 0.7, 1]);

  // Scale stamps up as swipe intensifies
  const applyScale = useTransform(x, [0, 80, 160], [0.5, 0.9, 1.1]);
  const skipScale = useTransform(x, [0, -80, -160], [0.5, 0.9, 1.1]);

  // Color wash overlays
  const rightTintOpacity = useTransform(x, [0, 100, 180], [0, 0.08, 0.18]);
  const leftTintOpacity = useTransform(x, [0, -100, -180], [0, 0.08, 0.18]);

  const rightLabel = dangerousMode ? "Apply" : "Save";
  const rightColor = dangerousMode ? "emerald" : "amber";

  return (
    <>
      {/* Right swipe color wash */}
      <motion.div
        className={`pointer-events-none absolute inset-0 z-[9] rounded-2xl ${
          dangerousMode ? "bg-emerald-500" : "bg-amber-500"
        }`}
        style={{ opacity: rightTintOpacity }}
      />

      {/* Left swipe color wash */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[9] rounded-2xl bg-red-500"
        style={{ opacity: leftTintOpacity }}
      />

      {/* Right swipe stamp */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: applyOpacity }}
      >
        <motion.span
          className={`rounded-xl border-4 px-5 py-2 text-3xl font-black uppercase tracking-widest ${
            rightColor === "emerald"
              ? "border-emerald-400 text-emerald-400"
              : "border-amber-400 text-amber-400"
          }`}
          style={{
            transform: "rotate(-12deg)",
            scale: applyScale,
            textShadow:
              rightColor === "emerald"
                ? "0 0 20px rgba(52,211,153,0.5), 0 0 40px rgba(52,211,153,0.2)"
                : "0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2)",
            boxShadow:
              rightColor === "emerald"
                ? "0 0 20px rgba(52,211,153,0.3), inset 0 0 20px rgba(52,211,153,0.1)"
                : "0 0 20px rgba(251,191,36,0.3), inset 0 0 20px rgba(251,191,36,0.1)",
          }}
        >
          {rightLabel}
        </motion.span>
      </motion.div>

      {/* SKIP stamp -- left swipe */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        style={{ opacity: skipOpacity }}
      >
        <motion.span
          className="rounded-xl border-4 border-red-500 px-5 py-2 text-3xl font-black uppercase tracking-widest text-red-500"
          style={{
            transform: "rotate(12deg)",
            scale: skipScale,
            textShadow:
              "0 0 20px rgba(239,68,68,0.5), 0 0 40px rgba(239,68,68,0.2)",
            boxShadow:
              "0 0 20px rgba(239,68,68,0.3), inset 0 0 20px rgba(239,68,68,0.1)",
          }}
        >
          Skip
        </motion.span>
      </motion.div>
    </>
  );
}
