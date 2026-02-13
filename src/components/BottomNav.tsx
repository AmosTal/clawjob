"use client";

import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const tabs = [
  {
    id: "swipe",
    label: "Swipe",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
      </svg>
    ),
  },
  {
    id: "saved",
    label: "Saved",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "applications",
    label: "Applications",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-[60px] bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${
              isActive ? "text-emerald-500" : "text-zinc-500"
            }`}
          >
            {tab.icon}
            <span className="text-[10px] leading-tight">{tab.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
