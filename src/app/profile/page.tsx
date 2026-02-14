"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { auth, storage } from "@/lib/firebase-client";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ProfilePage() {
  const { user, loading: authLoading, signOut, role, refreshProfile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [switchingRole, setSwitchingRole] = useState(false);
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dangerousMode, setDangerousMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setDangerousMode(data.dangerousMode ?? false);
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

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!user) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        showToast("Please upload a PDF, DOC, or DOCX file", "error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast("File must be under 5MB", "error");
        return;
      }

      const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploadProgress(0);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(pct);
        },
        (error) => {
          console.error("Upload error:", error);
          setUploadProgress(null);
          showToast("Upload failed. Please try again.", "error");
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const token = await getToken();
            const res = await fetch("/api/user", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                resumeURL: downloadURL,
                resumeFileName: file.name,
              }),
            });
            if (!res.ok) throw new Error("Failed to save");
            const data: UserProfile = await res.json();
            setProfile(data);
            setEditResume(downloadURL);
            showToast("Resume uploaded!", "success");
          } catch {
            showToast("Failed to save resume info", "error");
          } finally {
            setUploadProgress(null);
          }
        }
      );
    },
    [user, getToken, showToast]
  );

  const handleRemoveResume = useCallback(async () => {
    if (!user || !profile) return;

    try {
      // If there's a file in storage, try to delete it
      if (profile.resumeFileName) {
        const storageRef = ref(
          storage,
          `resumes/${user.uid}/${profile.resumeFileName}`
        );
        try {
          await deleteObject(storageRef);
        } catch {
          // File may not exist in storage — ignore
        }
      }

      const token = await getToken();
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeURL: "", resumeFileName: "" }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      const data: UserProfile = await res.json();
      setProfile(data);
      setEditResume("");
      showToast("Resume removed", "success");
    } catch {
      showToast("Failed to remove resume", "error");
    }
  }, [user, profile, getToken, showToast]);

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

  const handleSwitchRole = async () => {
    setSwitchingRole(true);
    try {
      const newRole = role === "employer" ? "seeker" : "employer";
      const token = await getToken();
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Failed to switch role");
      await refreshProfile();
      showToast(
        `Switched to ${newRole === "employer" ? "Employer" : "Job Seeker"} mode`,
        "success"
      );
      router.push(newRole === "employer" ? "/employer" : "/");
    } catch {
      showToast("Failed to switch role", "error");
    } finally {
      setSwitchingRole(false);
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

              {/* Resume Upload */}
              <motion.div className="flex flex-col gap-2" variants={fadeUp}>
                <label className="text-xs font-medium text-zinc-400">
                  Resume / CV
                </label>

                {/* Show uploaded file info */}
                {profile?.resumeFileName && profile?.resumeURL ? (
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3">
                    <svg
                      className="h-8 w-8 shrink-0 text-emerald-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-white">
                        {profile.resumeFileName}
                      </span>
                      <div className="mt-1 flex gap-3">
                        <a
                          href={profile.resumeURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                        >
                          View
                        </a>
                        <button
                          onClick={handleRemoveResume}
                          className="text-xs font-medium text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drop zone / file picker */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
                      dragging
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                    }`}
                  >
                    <svg
                      className={`h-8 w-8 ${dragging ? "text-emerald-400" : "text-zinc-500"}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-sm text-zinc-400">
                      Drop your resume here or{" "}
                      <span className="font-medium text-emerald-400">browse</span>
                    </span>
                    <span className="text-xs text-zinc-500">
                      PDF, DOC, DOCX up to 5MB
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}

                {/* Upload progress bar */}
                {uploadProgress !== null && (
                  <div className="overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Or paste a link */}
                {!profile?.resumeFileName && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-center text-xs text-zinc-500">
                      Or paste a link
                    </span>
                    <input
                      value={editResume}
                      onChange={(e) => setEditResume(e.target.value)}
                      placeholder="https://example.com/my-resume.pdf"
                      className="rounded-xl border border-zinc-800 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
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

              {/* Dangerous Mode Toggle */}
              <motion.div
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
                variants={fadeUp}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Dangerous Mode</span>
                  <span className="text-xs text-zinc-500">
                    {dangerousMode ? "Swipe right = Apply directly" : "Swipe right = Save to review later"}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    const newValue = !dangerousMode;
                    setDangerousMode(newValue);
                    try {
                      const token = await getToken();
                      await fetch("/api/user", {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ dangerousMode: newValue }),
                      });
                      await refreshProfile();
                      showToast(newValue ? "Dangerous mode enabled" : "Safe mode enabled", "info");
                    } catch {
                      setDangerousMode(!newValue);
                      showToast("Failed to update setting", "error");
                    }
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    dangerousMode ? "bg-red-500" : "bg-zinc-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      dangerousMode ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </motion.div>

              {/* Switch Role */}
              <motion.button
                onClick={handleSwitchRole}
                disabled={switchingRole}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-emerald-600 hover:text-white disabled:opacity-50"
                variants={fadeUp}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
                {switchingRole
                  ? "Switching..."
                  : role === "employer"
                    ? "Switch to Job Seeker"
                    : "Switch to Employer"}
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
