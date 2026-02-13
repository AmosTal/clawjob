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
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="MyWhisper"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                placeholder="support@mywhisper.com"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Moderation */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Moderation</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">Auto-approve jobs</p>
                <p className="text-xs text-zinc-500">
                  Automatically approve new job listings
                </p>
              </div>
              <div className="w-10 h-6 rounded-full bg-emerald-500 relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
              </div>
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">Require email verification</p>
                <p className="text-xs text-zinc-500">
                  Users must verify email before applying
                </p>
              </div>
              <div className="w-10 h-6 rounded-full bg-zinc-700 relative cursor-pointer">
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
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
            <button className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors">
              Purge Inactive Jobs
            </button>
            <button className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10 transition-colors">
              Reset Platform
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
