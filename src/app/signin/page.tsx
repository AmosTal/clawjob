"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import SignInScreen from "@/components/SignInScreen";
import RoleSelectScreen from "@/components/RoleSelectScreen";

export default function SignInPage() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(role === "employer" ? "/employer" : "/");
    }
  }, [loading, user, role, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  if (!role) {
    return <RoleSelectScreen />;
  }

  // Has user + role — redirect is happening via useEffect
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
    </div>
  );
}
