"use client";

import { motion } from "framer-motion";
import type { Application } from "@/lib/types";
import { auth } from "@/lib/firebase-client";
import { useToast } from "@/components/Toast";
import { useState } from "react";

interface ApplicationCardProps {
  application: Application;
  index?: number;
  onWithdraw?: (id: string) => void;
}

const statusSteps = ["applied", "reviewing", "interview", "offer"] as const;

const statusConfig: Record<
  Application["status"],
  { bg: string; text: string; dot: string; label: string; icon: React.ReactNode }
> = {
  applied: {
    bg: "bg-zinc-800",
    text: "text-zinc-300",
    dot: "bg-zinc-400",
    label: "Applied",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  reviewing: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    dot: "bg-amber-400",
    label: "Reviewing",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  interview: {
    bg: "bg-sky-500/15",
    text: "text-sky-300",
    dot: "bg-sky-400",
    label: "Interview",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  offer: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    label: "Offer",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  rejected: {
    bg: "bg-red-500/15",
    text: "text-red-300",
    dot: "bg-red-400",
    label: "Rejected",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  withdrawn: {
    bg: "bg-zinc-800",
    text: "text-zinc-500",
    dot: "bg-zinc-500",
    label: "Withdrawn",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
};

export default function ApplicationCard({
  application,
  index = 0,
  onWithdraw,
}: ApplicationCardProps) {
  const { showToast } = useToast();
  const [withdrawing, setWithdrawing] = useState(false);
  const status = statusConfig[application.status];

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "withdrawn" }),
      });

      if (!res.ok) throw new Error("Failed to withdraw");

      showToast("Application withdrawn", "info");
      onWithdraw?.(application.id);
    } catch {
      showToast("Failed to withdraw application", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const appliedDate = new Date(application.appliedAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  // Timeline progress for non-terminal states
  const isTerminal = application.status === "rejected" || application.status === "withdrawn";
  const currentStepIndex = statusSteps.indexOf(
    application.status as (typeof statusSteps)[number]
  );

  return (
    <motion.div
      className="rounded-xl border border-zinc-700/40 bg-zinc-900 p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Company initials + job info */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {application.companyLogo ? (
            <img
              src={application.companyLogo}
              alt={application.company}
              className="h-10 w-10 shrink-0 rounded-xl bg-zinc-800 object-contain p-1"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-xs font-bold text-zinc-400">
              {application.company
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {application.jobTitle}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">{application.company}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{appliedDate}</p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.text}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Timeline progress */}
      {!isTerminal && currentStepIndex >= 0 && (
        <div className="mt-3.5" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={statusSteps.length} aria-label={`Application progress: ${statusConfig[application.status as (typeof statusSteps)[number]]?.label ?? application.status}`}>
          <div className="flex items-center gap-1">
            {statusSteps.map((step, i) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStepIndex
                    ? statusConfig[step].dot
                    : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between">
            {statusSteps.map((step, i) => (
              <span
                key={step}
                className={`text-[9px] font-medium ${
                  i <= currentStepIndex
                    ? statusConfig[step].text
                    : "text-zinc-600"
                }`}
              >
                {statusConfig[step].label}
              </span>
            ))}
          </div>
        </div>
      )}

      {application.status === "applied" && (
        <motion.button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="mt-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50 touch-manipulation"
          whileTap={{ scale: 0.95 }}
          aria-label={`Withdraw application for ${application.jobTitle} at ${application.company}`}
        >
          {withdrawing ? "Withdrawing..." : "Withdraw Application"}
        </motion.button>
      )}
    </motion.div>
  );
}
