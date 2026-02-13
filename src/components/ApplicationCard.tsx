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

const statusConfig: Record<
  Application["status"],
  { bg: string; text: string; label: string }
> = {
  applied: { bg: "bg-zinc-600", text: "text-zinc-300", label: "Applied" },
  reviewing: { bg: "bg-amber-600", text: "text-amber-200", label: "Reviewing" },
  interview: { bg: "bg-sky-600", text: "text-sky-200", label: "Interview" },
  offer: { bg: "bg-emerald-600", text: "text-emerald-200", label: "Offer" },
  rejected: { bg: "bg-red-600", text: "text-red-200", label: "Rejected" },
  withdrawn: { bg: "bg-zinc-700", text: "text-zinc-400", label: "Withdrawn" },
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

  return (
    <motion.div
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-white">
            {application.jobTitle}
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">{application.company}</p>
          <p className="mt-1 text-xs text-zinc-500">{appliedDate}</p>
        </div>

        <span
          className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>
      </div>

      {application.status === "applied" && (
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="mt-3 text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          {withdrawing ? "Withdrawing..." : "Withdraw"}
        </button>
      )}
    </motion.div>
  );
}
