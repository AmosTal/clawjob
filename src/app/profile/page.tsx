"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase-client";
import type { UserProfile, Application, CVVersion } from "@/lib/types";
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
  const [editingName, setEditingName] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dangerousMode, setDangerousMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cvVersions, setCvVersions] = useState<CVVersion[]>([]);

  const [deletingCvId, setDeletingCvId] = useState<string | null>(null);
  const [renamingCvId, setRenamingCvId] = useState<string | null>(null);
  const [renamingCvValue, setRenamingCvValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTaskRef = useRef<ReturnType<typeof uploadBytesResumable> | null>(null);

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

  const fetchCVVersions = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/user/cvs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch CVs");
      const data: CVVersion[] = await res.json();
      setCvVersions(data);
    } catch {
      // silently fail
    }
  }, [getToken]);

  const resetUploadState = useCallback(() => {
    setUploadProgress(null);
    uploadTaskRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleCancelUpload = useCallback(() => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
    }
    resetUploadState();
    showToast("Upload cancelled", "info");
  }, [resetUploadState, showToast]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!user) return;

      const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
      const ext = file.name.toLowerCase().replace(/^.*(\.[^.]+)$/, "$1");
      const validType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);

      if (!validType) {
        showToast("Please upload a PDF, DOC, or DOCX file", "error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast("File must be under 5MB", "error");
        return;
      }

      setUploadProgress(0);

      try {
        const filename = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `resumes/${user.uid}/${filename}`);
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type || "application/octet-stream",
        });

        uploadTaskRef.current = uploadTask;

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setUploadProgress(progress);
          },
          (error) => {
            if (error.code === "storage/canceled") {
              return;
            }
            console.error("Upload error:", error.code, error.message);
            showToast(`Upload failed: ${error.code}`, "error");
            resetUploadState();
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const token = await getToken();
              const name = file.name.replace(/\.[^.]+$/, "");

              const cvRes = await fetch("/api/user/cvs", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name,
                  fileName: file.name,
                  url: downloadURL,
                }),
              });

              if (!cvRes.ok) throw new Error("Failed to save CV record");

              setUploadProgress(100);
              await fetchCVVersions();
              showToast("CV uploaded!", "success");
            } catch (err) {
              console.error("Metadata save error:", err);
              showToast("Upload succeeded but failed to save details.", "error");
            } finally {
              resetUploadState();
            }
          }
        );
      } catch (error) {
        console.error("Upload setup error:", error);
        showToast("Failed to start upload.", "error");
        resetUploadState();
      }
    },
    [user, getToken, showToast, fetchCVVersions, resetUploadState]
  );

  const handleDeleteCV = useCallback(
    async (cvId: string, _fileName: string) => {
      if (!user) return;
      setDeletingCvId(cvId);

      try {
        const token = await getToken();
        const res = await fetch(`/api/user/cvs/${cvId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete");

        await Promise.all([fetchCVVersions(), fetchProfile()]);
        showToast("CV removed", "success");
      } catch {
        showToast("Failed to remove CV", "error");
      } finally {
        setDeletingCvId(null);
      }
    },
    [user, getToken, showToast, fetchCVVersions, fetchProfile]
  );

  const handleSetDefaultCV = useCallback(
    async (cvId: string) => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/user/cvs/${cvId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isDefault: true }),
        });
        if (!res.ok) throw new Error("Failed to set default");
        await Promise.all([fetchCVVersions(), fetchProfile()]);
        showToast("Default CV updated", "success");
      } catch {
        showToast("Failed to set default CV", "error");
      }
    },
    [getToken, showToast, fetchCVVersions, fetchProfile]
  );

  const handleRenameCV = useCallback(
    async (cvId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) {
        setRenamingCvId(null);
        return;
      }

      try {
        const token = await getToken();
        const res = await fetch(`/api/user/cvs/${cvId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!res.ok) throw new Error("Failed to rename");
        await fetchCVVersions();
        showToast("CV renamed", "success");
      } catch {
        showToast("Failed to rename CV", "error");
      } finally {
        setRenamingCvId(null);
      }
    },
    [getToken, showToast, fetchCVVersions]
  );

  useEffect(() => {
    if (user) {
      Promise.all([fetchProfile(), fetchStats(), fetchCVVersions()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user, fetchProfile, fetchStats, fetchCVVersions]);

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
                <div className="group relative">
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
                  {/* Camera overlay hint */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </div>

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

                {/* Default CV indicator */}
                {profile?.resumeFileName && (
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-800/50 bg-emerald-500/5 px-3 py-1">
                    <svg
                      className="h-3.5 w-3.5 text-emerald-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-xs font-medium text-emerald-400">
                      {profile.resumeFileName}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Stats Row */}
              <motion.div className="flex gap-3" variants={fadeUp}>
                {[
                  { value: stats.applied, label: "Applied", accent: false },
                  { value: stats.interviews, label: "Interviews", accent: false },
                  { value: stats.offers, label: "Offers", accent: true },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex flex-1 flex-col items-center rounded-xl border py-3 transition-colors ${stat.accent
                      ? "border-emerald-800/50 bg-emerald-500/5"
                      : "border-zinc-800 bg-zinc-900"
                      }`}
                  >
                    <span
                      className={`text-xl font-bold ${stat.accent ? "text-emerald-400" : "text-white"
                        }`}
                    >
                      {stat.value}
                    </span>
                    <span
                      className={`text-xs ${stat.accent ? "text-emerald-400/70" : "text-zinc-400"
                        }`}
                    >
                      {stat.label}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Personal Info Section */}
              <motion.div variants={fadeUp}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Personal Info
                </h3>
                <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  {/* Bio */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell employers about yourself..."
                      rows={3}
                      className="resize-none rounded-lg border border-zinc-700/50 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* CV Versions Section */}
              <motion.div variants={fadeUp}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    My CVs
                  </h3>
                  {cvVersions.length > 0 && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                      {cvVersions.length}
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  {/* Existing CV list */}
                  {cvVersions.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2">
                      {cvVersions.map((cv) => (
                        <div
                          key={cv.id}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${cv.isDefault
                            ? "border-emerald-700/50 bg-emerald-500/5"
                            : "border-zinc-700/50 bg-zinc-800"
                            }`}
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cv.isDefault ? "bg-emerald-500/15" : "bg-zinc-700/50"
                            }`}>
                            <svg
                              className={`h-4 w-4 ${cv.isDefault ? "text-emerald-400" : "text-zinc-400"}`}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-center gap-2">
                              {renamingCvId === cv.id ? (
                                <input
                                  value={renamingCvValue}
                                  onChange={(e) => setRenamingCvValue(e.target.value)}
                                  onBlur={() => handleRenameCV(cv.id, renamingCvValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameCV(cv.id, renamingCvValue);
                                    if (e.key === "Escape") setRenamingCvId(null);
                                  }}
                                  autoFocus
                                  className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-700 px-2 py-0.5 text-sm font-medium text-white outline-none focus:border-emerald-500"
                                />
                              ) : (
                                <button
                                  onClick={() => {
                                    setRenamingCvId(cv.id);
                                    setRenamingCvValue(cv.name);
                                  }}
                                  className="group/rename flex min-w-0 items-center gap-1"
                                  title="Click to rename"
                                >
                                  <span className="truncate text-sm font-medium text-white">
                                    {cv.name}
                                  </span>
                                  <svg
                                    className="h-3 w-3 shrink-0 text-zinc-500 opacity-0 transition-opacity group-hover/rename:opacity-100"
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
                              {cv.isDefault && (
                                <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500">
                              {cv.fileName} · {new Date(cv.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <a
                              href={cv.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                              title="View"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                            {!cv.isDefault && (
                              <button
                                onClick={() => handleSetDefaultCV(cv.id)}
                                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-emerald-400"
                                title="Set as default"
                              >
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteCV(cv.id, cv.fileName)}
                              disabled={deletingCvId === cv.id}
                              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400 disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingCvId === cv.id ? (
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border border-zinc-400 border-t-transparent" />
                              ) : (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop zone */}
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
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 transition-colors ${dragging
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      }`}
                  >
                    <svg
                      className={`h-7 w-7 ${dragging ? "text-emerald-400" : "text-zinc-500"}`}
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
                      Drop a CV here or{" "}
                      <span className="font-medium text-emerald-400">browse</span>
                    </span>
                    <span className="text-xs text-zinc-500">
                      PDF, DOC, or DOCX up to 5MB
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

                  {/* Upload progress */}
                  {uploadProgress !== null && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs text-zinc-400">
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
                          Uploading... {uploadProgress}%
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelUpload();
                          }}
                          className="rounded px-2 py-0.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                variants={fadeUp}
                whileTap={{ scale: 0.98 }}
              >
                {saving ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Save Changes"
                )}
              </motion.button>

              {/* Preferences Section */}
              <motion.div variants={fadeUp}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Preferences
                </h3>
                <div className="flex flex-col divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
                  {/* Dangerous Mode Toggle */}
                  <div className="flex items-center justify-between px-4 py-3.5">
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
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${dangerousMode ? "bg-red-500" : "bg-zinc-600"
                        }`}
                      role="switch"
                      aria-checked={dangerousMode}
                    >
                      <motion.span
                        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white"
                        animate={{ x: dangerousMode ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Switch Role */}
                  <button
                    onClick={handleSwitchRole}
                    disabled={switchingRole}
                    className="flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-zinc-800/50 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9" />
                        <path d="M3 11V9a4 4 0 014-4h14" />
                        <polyline points="7 23 3 19 7 15" />
                        <path d="M21 13v2a4 4 0 01-4 4H3" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {switchingRole
                            ? "Switching..."
                            : role === "employer"
                              ? "Switch to Job Seeker"
                              : "Switch to Employer"}
                        </span>
                        <span className="text-xs text-zinc-500">
                          Currently: {role === "employer" ? "Employer" : "Job Seeker"}
                        </span>
                      </div>
                    </div>
                    <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </motion.div>

              {/* Sign Out */}
              <motion.button
                onClick={handleSignOut}
                className="w-full rounded-xl border border-zinc-800 py-3 text-sm font-medium text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/5"
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
