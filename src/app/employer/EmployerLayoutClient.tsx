"use client";

import { usePathname, useRouter } from "next/navigation";
import EmployerNav from "@/components/EmployerNav";

const tabMap: Record<string, string> = {
  "/employer": "dashboard",
  "/employer/post-job": "post",
  "/employer/applications": "applications",
  "/profile": "profile",
};

export default function EmployerLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = tabMap[pathname] ?? "dashboard";

  const handleNavigate = (tab: string) => {
    const path =
      Object.entries(tabMap).find(([, t]) => t === tab)?.[0] ?? "/employer";
    router.push(path);
  };

  return (
    <div className="pb-[70px]">
      {children}
      <EmployerNav activeTab={activeTab} onNavigate={handleNavigate} />
    </div>
  );
}
