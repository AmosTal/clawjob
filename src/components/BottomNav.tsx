"use client";

import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  {
    id: "swipe",
    label: "Discover",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    id: "saved",
    label: "Saved",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "applications",
    label: "Activity",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-700/50 bg-zinc-900/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="relative flex h-[64px] items-center justify-around">
        {/* Sliding active pill */}
        <motion.div
          className="absolute top-1.5 h-[3px] w-[40px] rounded-full bg-emerald-500"
          animate={{
            left: `calc(${(activeIndex / tabs.length) * 100}% + ${100 / tabs.length / 2}% - 20px)`,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-1 h-full min-h-[48px] touch-manipulation transition-colors ${
                isActive ? "text-emerald-400" : "text-zinc-400"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
