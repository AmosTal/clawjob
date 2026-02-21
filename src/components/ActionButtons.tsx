"use client";

import { motion } from "framer-motion";

interface ActionButtonsProps {
  onSkip: () => void;
  onSave: () => void;
  onApply: () => void;
  onSwipeRight: () => void;
  dangerousMode?: boolean;
}

const bounceTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17,
  mass: 0.8,
};

export default function ActionButtons({
  onSkip,
  onSave,
  onApply,
  onSwipeRight,
  dangerousMode,
}: ActionButtonsProps) {
  return (
    <div className="flex items-end justify-center gap-5 py-3">
      {/* Skip button */}
      <div className="flex flex-col items-center gap-1.5">
        <motion.button
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/10 text-red-400 shadow-lg shadow-red-500/5 transition-colors hover:bg-red-500/20 active:bg-red-500/30 touch-manipulation"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          transition={bounceTransition}
          onClick={onSkip}
          aria-label="Skip this job"
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
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </motion.button>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400/70">
          Skip
        </span>
      </div>

      {/* Center (small) button -- secondary action */}
      {dangerousMode ? (
        /* Dangerous mode: center = Save (amber bookmark) */
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/5 transition-colors hover:bg-amber-500/20 active:bg-amber-500/30 touch-manipulation"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            transition={bounceTransition}
            onClick={onSave}
            aria-label="Save this job"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </motion.button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">
            Save
          </span>
        </div>
      ) : (
        /* Safe mode: center = Apply (emerald heart) */
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5 transition-colors hover:bg-emerald-500/20 active:bg-emerald-500/30 touch-manipulation"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            transition={bounceTransition}
            onClick={onApply}
            aria-label="Apply to this job"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
            Apply
          </span>
        </div>
      )}

      {/* Right (big) button -- primary right action */}
      {dangerousMode ? (
        /* Dangerous mode: right = Apply (emerald heart) */
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5 transition-colors hover:bg-emerald-500/20 active:bg-emerald-500/30 touch-manipulation"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            transition={bounceTransition}
            onClick={onSwipeRight}
            aria-label="Apply to this job"
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
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
            Apply
          </span>
        </div>
      ) : (
        /* Safe mode: right = Save (amber bookmark) */
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/5 transition-colors hover:bg-amber-500/20 active:bg-amber-500/30 touch-manipulation"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            transition={bounceTransition}
            onClick={onSwipeRight}
            aria-label="Save this job"
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
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </motion.button>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">
            Save
          </span>
        </div>
      )}
    </div>
  );
}
