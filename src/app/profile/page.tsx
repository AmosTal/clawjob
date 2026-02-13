"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase-client";
import type { UserProfile, Application } from "@/lib/types";
import AppShell from "@/components/AppShell";
import SignInScreen from "@/components/SignInScreen";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface ProfileStats {
  applied: number;
  interviews: number;
  offers: number;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    applied: 0,
    interviews: 0,
    offers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editResume, setEditResume] = useState("");
  const [editingName, setEditingName] = useState(false);

  const getToken = useCallback(async () => {
    return await auth.currentUser?.getIdToken();
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data: UserProfile = await res.json();
      setProfile(data);
      setEditName(data.name || "");
      setEditBio(data.bio || "");
      setEditResume(data.resumeURL || "");
    } catch {
      // silently fail
    }
  }, [getToken]);

  const fetchStats = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      const apps: Application[] = await res.json();
      setStats({
        applied: apps.length,
        interviews: apps.filter((a) => a.status === "interview").length,
        offers: apps.filter((a) => a.status === "offer").length,
      });
    } catch {
      // silently fail
    }
  }, [getToken]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchProfile(), fetchStats()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user, fetchProfile, fetchStats]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          resumeURL: editResume,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data: UserProfile = await res.json();
      setProfile(data);
      showToast("Profile saved!", "success");
    } catch {
      showToast("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return (
    <AppShell>
      <div className="flex min-h-dvh justify-center bg-zinc-950">
        <div className="w-full max-w-[430px] px-4 py-6">
          {loading ? (
            <div className="flex flex-col items-center gap-6 pt-8">
              <div className="h-20 w-20 animate-pulse rounded-full bg-zinc-800" />
              <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-52 animate-pulse rounded bg-zinc-800" />
              <div className="mt-4 flex w-full gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 flex-1 animate-pulse rounded-xl bg-zinc-800"
                  />
                ))}
              </div>
              <div className="mt-4 h-24 w-full animate-pulse rounded-xl bg-zinc-800" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
            </div>
          ) : (
            <motion.div
              className="flex flex-col gap-6"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {/* Avatar + Name + Email */}
              <motion.div
                className="flex flex-col items-center gap-3 pt-4"
                variants={fadeUp}
              >
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="h-20 w-20 rounded-full border-2 border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
                    {getInitials(editName || user.email || "U")}
                  </div>
                )}

                {editingName ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingName(false);
                    }}
                    autoFocus
                    className="w-full max-w-[240px] rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-center text-lg font-bold text-white outline-none focus:border-emerald-500"
                  />
                ) : (
                  <button
                    onClick={() => setEditingName(true)}
                    className="group flex items-center gap-1.5 text-lg font-bold text-white"
                  >
                    {editName || "Set your name"}
                    <svg
                      className="h-3.5 w-3.5 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}

                <p className="text-sm text-zinc-500">
                  {profile?.email || user.email}
                </p>
              </motion.div>

              {/* Stats Row */}
              <motion.div className="flex gap-3" variants={fadeUp}>
                <div className="flex flex-1 flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 py-3">
                  <span className="text-xl font-bold text-white">
                    {stats.applied}
                  </span>
                  <span className="text-xs text-zinc-400">Applied</span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 py-3">
                  <span className="text-xl font-bold text-white">
                    {stats.interviews}
                  </span>
                  <span className="text-xs text-zinc-400">Interviews</span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded-xl border border-emerald-800/50 bg-zinc-900 py-3">
                  <span className="text-xl font-bold text-emerald-400">
                    {stats.offers}
                  </span>
                  <span className="text-xs text-emerald-400/70">Offers</span>
                </div>
              </motion.div>

              {/* Bio */}
              <motion.div className="flex flex-col gap-1.5" variants={fadeUp}>
                <label className="text-xs font-medium text-zinc-400">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell employers about yourself..."
                  rows={3}
                  className="resize-none rounded-xl border border-zinc-800 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
                />
              </motion.div>

              {/* Resume URL */}
              <motion.div className="flex flex-col gap-1.5" variants={fadeUp}>
                <label className="text-xs font-medium text-zinc-400">
                  Resume URL
                </label>
                <input
                  value={editResume}
                  onChange={(e) => setEditResume(e.target.value)}
                  placeholder="Link to your resume"
                  className="rounded-xl border border-zinc-800 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
                />
              </motion.div>

              {/* Save Button */}
              <motion.button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                variants={fadeUp}
                whileTap={{ scale: 0.98 }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>

              {/* Sign Out */}
              <motion.button
                onClick={handleSignOut}
                className="w-full py-3 text-sm font-medium text-red-400 transition-colors hover:text-red-300"
                variants={fadeUp}
                whileTap={{ scale: 0.98 }}
              >
                Sign Out
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
