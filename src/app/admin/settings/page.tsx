"use client";

import { motion } from "framer-motion";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Configure platform settings and preferences
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* General */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="MyWhisper"
                className="w-full rounded-xl border border-zinc-700/50 bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                placeholder="support@mywhisper.com"
                className="w-full rounded-xl border border-zinc-700/50 bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {/* Moderation */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Moderation</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">Auto-approve jobs</p>
                <p className="text-xs text-zinc-500">
                  Automatically approve new job listings
                </p>
              </div>
              <div className="relative h-6 w-11 shrink-0 rounded-full bg-emerald-500 cursor-pointer transition-colors">
                <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
              </div>
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">Require email verification</p>
                <p className="text-xs text-zinc-500">
                  Users must verify email before applying
                </p>
              </div>
              <div className="relative h-6 w-11 shrink-0 rounded-full bg-zinc-600 cursor-pointer transition-colors">
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
              </div>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
          <p className="text-xs text-zinc-500">
            These actions are destructive and cannot be reversed.
          </p>
          <div className="flex gap-3">
            <button className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">
              Purge Inactive Jobs
            </button>
            <button className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10">
              Reset Platform
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
