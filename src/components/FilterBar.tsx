"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { JobCard } from "@/lib/types";

export interface Filters {
  remote: boolean;
  location: string | null;
  tags: string[];
}

interface FilterBarProps {
  jobs: JobCard[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

type DropdownKind = "location" | "tags" | null;

export default function FilterBar({
  jobs,
  filters,
  onFiltersChange,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownKind>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    function handleClick(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdown]);

  // Extract unique locations from jobs
  const locations = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      if (!j.location) continue;
      const loc = j.location.trim();
      if (loc) set.add(loc);
    }
    return Array.from(set).sort();
  }, [jobs]);

  // Extract top ~20 most common tags
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      for (const t of j.tags ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
  }, [jobs]);

  const hasActiveFilters =
    filters.remote || filters.location !== null || filters.tags.length > 0;

  function toggleRemote() {
    onFiltersChange({ ...filters, remote: !filters.remote });
  }

  function selectLocation(loc: string | null) {
    onFiltersChange({ ...filters, location: loc });
    setOpenDropdown(null);
  }

  function toggleTag(tag: string) {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: next });
  }

  function clearAll() {
    onFiltersChange({ remote: false, location: null, tags: [] });
    setOpenDropdown(null);
  }

  const chipBase =
    "rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200 whitespace-nowrap select-none cursor-pointer";
  const chipInactive =
    "bg-zinc-800/80 text-zinc-400 border-zinc-700/80 hover:border-zinc-500 hover:bg-zinc-800";
  const chipActive =
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10";

  const dropdownMotion = {
    initial: { opacity: 0, y: -8, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.95 },
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  };

  return (
    <div ref={barRef} className="relative mb-3">
      {/* Chip row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {/* Remote toggle */}
        <motion.button
          onClick={toggleRemote}
          className={`${chipBase} ${filters.remote ? chipActive : chipInactive}`}
          whileTap={{ scale: 0.95 }}
          layout
        >
          {filters.remote && (
            <svg
              className="-ml-0.5 mr-1 inline-block h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          Remote
        </motion.button>

        {/* Location dropdown trigger */}
        <motion.button
          onClick={() =>
            setOpenDropdown(openDropdown === "location" ? null : "location")
          }
          className={`${chipBase} ${filters.location ? chipActive : chipInactive}`}
          whileTap={{ scale: 0.95 }}
          layout
        >
          {filters.location ?? "Location"}
          <motion.svg
            className="ml-1 inline-block h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            animate={{ rotate: openDropdown === "location" ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </motion.svg>
        </motion.button>

        {/* Tags dropdown trigger */}
        <motion.button
          onClick={() =>
            setOpenDropdown(openDropdown === "tags" ? null : "tags")
          }
          className={`${chipBase} ${filters.tags.length > 0 ? chipActive : chipInactive}`}
          whileTap={{ scale: 0.95 }}
          layout
        >
          Skills{filters.tags.length > 0 ? ` (${filters.tags.length})` : ""}
          <motion.svg
            className="ml-1 inline-block h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            animate={{ rotate: openDropdown === "tags" ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </motion.svg>
        </motion.button>

        {/* Clear button */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              onClick={clearAll}
              className="rounded-full px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdowns */}
      <AnimatePresence>
        {openDropdown === "location" && (
          <motion.div
            key="location-dropdown"
            {...dropdownMotion}
            className="absolute left-0 top-full z-50 mt-2 max-h-60 w-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40"
          >
            {/* Clear location */}
            {filters.location && (
              <button
                onClick={() => selectLocation(null)}
                className="w-full px-3 py-2 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              >
                All locations
              </button>
            )}
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => selectLocation(loc)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800 ${
                  filters.location === loc
                    ? "text-emerald-400"
                    : "text-zinc-300"
                }`}
              >
                {filters.location === loc && (
                  <svg
                    className="-ml-0.5 mr-1.5 inline-block h-3 w-3 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {loc}
              </button>
            ))}
            {locations.length === 0 && (
              <div className="px-3 py-2 text-sm text-zinc-500">
                No locations available
              </div>
            )}
          </motion.div>
        )}

        {openDropdown === "tags" && (
          <motion.div
            key="tags-dropdown"
            {...dropdownMotion}
            className="absolute left-0 top-full z-50 mt-2 max-h-60 w-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40"
          >
            {topTags.map((tag) => {
              const selected = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                >
                  <motion.span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      selected
                        ? "border-emerald-500 bg-emerald-500/20"
                        : "border-zinc-600"
                    }`}
                    animate={selected ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    {selected && (
                      <svg
                        className="h-3 w-3 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </motion.span>
                  <span className={selected ? "text-emerald-400" : ""}>
                    {tag}
                  </span>
                </button>
              );
            })}
            {topTags.length === 0 && (
              <div className="px-3 py-2 text-sm text-zinc-500">
                No tags available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
