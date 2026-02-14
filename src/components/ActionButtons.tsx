"use client";

import { motion } from "framer-motion";

interface ActionButtonsProps {
  onSkip: () => void;
  onSave: () => void;
  onApply: () => void;
  onSwipeRight: () => void;
  dangerousMode?: boolean;
}

export default function ActionButtons({
  onSkip,
  onSave,
  onApply,
  onSwipeRight,
  dangerousMode,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      {/* Skip button */}
      <motion.button
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/10 text-red-400 shadow-lg transition-colors hover:bg-red-500/20"
        whileTap={{ scale: 0.9 }}
        onClick={onSkip}
        aria-label="Skip"
      >
        <svg
          width="28"
          height="28"
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

      {/* Center (small) button — secondary action */}
      {dangerousMode ? (
        /* Dangerous mode: center = Save (amber bookmark) */
        <motion.button
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-lg transition-colors hover:bg-amber-500/20"
          whileTap={{ scale: 0.9 }}
          onClick={onSave}
          aria-label="Save"
        >
          <svg
            width="22"
            height="22"
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
      ) : (
        /* Safe mode: center = Apply (emerald heart) */
        <motion.button
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-lg transition-colors hover:bg-emerald-500/20"
          whileTap={{ scale: 0.9 }}
          onClick={onApply}
          aria-label="Apply"
        >
          <svg
            width="22"
            height="22"
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
      )}

      {/* Right (big) button — primary right action */}
      {dangerousMode ? (
        /* Dangerous mode: right = Apply (emerald heart) */
        <motion.button
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-lg transition-colors hover:bg-emerald-500/20"
          whileTap={{ scale: 0.9 }}
          onClick={onSwipeRight}
          aria-label="Apply"
        >
          <svg
            width="28"
            height="28"
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
      ) : (
        /* Safe mode: right = Save (amber bookmark) */
        <motion.button
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-lg transition-colors hover:bg-amber-500/20"
          whileTap={{ scale: 0.9 }}
          onClick={onSwipeRight}
          aria-label="Save"
        >
          <svg
            width="28"
            height="28"
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
      )}
    </div>
  );
}
