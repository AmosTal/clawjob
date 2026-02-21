"use client";

import { motion } from "framer-motion";

export default function SkeletonCard() {
  return (
    <motion.div
      className="flex flex-col gap-3"
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      {/* Job header skeleton */}
      <div className="flex flex-col items-center gap-1.5 px-1">
        <div className="h-5 w-48 rounded-md bg-zinc-800 animate-pulse" />
        <div className="h-4 w-36 rounded-md bg-zinc-800/60 animate-pulse" />
      </div>

      {/* Card area with side indicators */}
      <div className="flex items-center gap-1">
        {/* Left indicator skeleton */}
        <div className="flex w-10 shrink-0 flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full bg-zinc-800/40 animate-pulse" />
          <div className="h-2 w-6 rounded bg-zinc-800/40 animate-pulse" />
        </div>

        {/* Hero card skeleton */}
        <div
          className="min-w-0 flex-1 rounded-2xl bg-zinc-800 animate-pulse"
          style={{ height: "calc(100dvh - 340px)", minHeight: "200px", maxHeight: "400px" }}
        />

        {/* Right indicator skeleton */}
        <div className="flex w-10 shrink-0 flex-col items-center gap-1">
          <div className="h-6 w-6 rounded-full bg-zinc-800/40 animate-pulse" />
          <div className="h-2 w-6 rounded bg-zinc-800/40 animate-pulse" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex items-end justify-center gap-5 py-3">
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-14 w-14 rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-2 w-8 rounded bg-zinc-800/40 animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-11 w-11 rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-2 w-8 rounded bg-zinc-800/40 animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-14 w-14 rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-2 w-8 rounded bg-zinc-800/40 animate-pulse" />
        </div>
      </div>

      {/* HR bar skeleton */}
      <div className="mx-auto w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 rounded bg-zinc-800 animate-pulse" />
          </div>
          <div className="h-3 w-16 rounded bg-zinc-800/40 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
