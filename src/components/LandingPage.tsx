"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { APP_VERSION, APP_NAME } from "@/lib/constants";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const features = [
  {
    icon: (
      <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Swipe to Apply",
    description: "Discover jobs with a simple swipe. Right to apply, left to skip — job hunting made effortless.",
  },
  {
    icon: (
      <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    title: "Smart Matching",
    description: "AI-powered recommendations surface the roles that fit your skills, experience, and preferences.",
  },
  {
    icon: (
      <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15A1.5 1.5 0 0 1 4.5 3Zm6 6h3m-3 3h3m-3 3h3m-6-6h.008v.008H7.5V9Zm0 3h.008v.008H7.5V12Zm0 3h.008v.008H7.5V15Z" />
      </svg>
    ),
    title: "Employer Dashboard",
    description: "Post openings, review applicants, and manage your hiring pipeline all in one place.",
  },
  {
    icon: (
      <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Track Applications",
    description: "Real-time status updates keep you informed from application to offer — no more guessing.",
  },
];

const stats = [
  { value: "1,000+", label: "Jobs" },
  { value: "500+", label: "Companies" },
  { value: "10,000+", label: "Applications" },
];

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center"
    >
      <div className="text-3xl font-black text-white sm:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-zinc-400">{label}</div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-zinc-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight text-white">
              claw<span className="text-emerald-400">job</span>
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              v{APP_VERSION}
            </span>
          </div>
          <Link
            href="/signin"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 sm:pb-32 sm:pt-36">
        {/* Gradient orb backgrounds */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-[300px] w-[400px] rounded-full bg-teal-500/5 blur-3xl" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-700/50 bg-zinc-900/50 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Now in early access
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-6 text-5xl font-black tracking-tight sm:text-7xl text-white"
          >
            claw<span className="text-emerald-400">job</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-lg text-zinc-400 sm:text-xl"
          >
            Swipe your way to your dream job. The fastest way to discover, apply, and land your next career opportunity.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link href="/signin">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-500"
              >
                Get Started
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </motion.span>
            </Link>
            <Link
              href="/signin"
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-emerald-400"
            >
              Already have an account? Sign in
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <FadeInSection>
            <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
              Everything you need to land your next role
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-zinc-400">
              Built for modern job seekers and employers who value speed, simplicity, and smart technology.
            </p>
          </FadeInSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mt-14 grid gap-4 sm:grid-cols-2"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/80"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800/50 px-6 py-16 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-12 sm:gap-20">
          {stats.map((s) => (
            <AnimatedStat key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 sm:py-28">
        <FadeInSection>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to start swiping?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-zinc-400">
              Join thousands of job seekers and employers already using {APP_NAME} to connect faster.
            </p>
            <div className="mt-8">
              <Link href="/signin">
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-500"
                >
                  Create Free Account
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </motion.span>
              </Link>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-black tracking-tight text-white">
                claw<span className="text-emerald-400">job</span>
              </span>
              <span className="text-xs text-zinc-500">v{APP_VERSION}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <span className="cursor-pointer transition-colors hover:text-zinc-300">About</span>
              <span className="cursor-pointer transition-colors hover:text-zinc-300">Privacy</span>
              <span className="cursor-pointer transition-colors hover:text-zinc-300">Terms</span>
              <span className="cursor-pointer transition-colors hover:text-zinc-300">Contact</span>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-zinc-600">
            Built with Next.js & Firebase
          </p>
        </div>
      </footer>
    </div>
  );
}

function FadeInSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
