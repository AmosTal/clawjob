"use client";

export default function SkeletonCard() {
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Hero skeleton */}
      <div className="w-full h-[70vh] rounded-2xl bg-zinc-800 animate-pulse" />

      {/* Action button skeletons */}
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-full bg-zinc-800 animate-pulse" />
        <div className="w-11 h-11 rounded-full bg-zinc-800 animate-pulse" />
        <div className="w-14 h-14 rounded-full bg-zinc-800 animate-pulse" />
      </div>

      {/* Card skeleton */}
      <div className="w-full max-w-sm h-32 rounded-xl bg-zinc-800 animate-pulse" />
    </div>
  );
}
