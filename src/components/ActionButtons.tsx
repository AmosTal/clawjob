"use client";

import { motion } from "framer-motion";

interface ActionButtonsProps {
  onSkip: () => void;
  onApply: () => void;
}

export default function ActionButtons({ onSkip, onApply }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-8 py-4">
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

      {/* Apply button */}
      <motion.button
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-lg transition-colors hover:bg-emerald-500/20"
        whileTap={{ scale: 0.9 }}
        onClick={onApply}
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
    </div>
  );
}
