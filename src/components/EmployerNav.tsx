"use client";

import { motion } from "framer-motion";

interface EmployerNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "post",
    label: "Post Job",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: "applications",
    label: "Applicants",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

export default function EmployerNav({ activeTab, onNavigate }: EmployerNavProps) {
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-xl" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
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
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 h-full min-h-[48px] touch-manipulation transition-colors ${
                isActive ? "text-emerald-400" : "text-zinc-500"
              }`}
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
