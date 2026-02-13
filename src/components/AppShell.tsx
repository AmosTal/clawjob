"use client";

import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const tabMap: Record<string, string> = {
  "/": "swipe",
  "/saved": "saved",
  "/applications": "applications",
  "/profile": "profile",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = tabMap[pathname] ?? "swipe";

  const handleNavigate = (tab: string) => {
    const path = Object.entries(tabMap).find(([, t]) => t === tab)?.[0] ?? "/";
    router.push(path);
  };

  return (
    <div className="pb-[70px]">
      {children}
      <BottomNav activeTab={activeTab} onNavigate={handleNavigate} />
    </div>
  );
}
