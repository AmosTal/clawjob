"use client";

import { motion } from "framer-motion";
import type { ManagerAsset } from "@/lib/types";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-5xl font-bold text-zinc-500">
      {initials}
    </div>
  );
}

export default function ManagerHero({ manager }: { manager: ManagerAsset }) {
  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl"
      style={{ height: "70vh" }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Background: video or photo fallback */}
      {manager.video ? (
        <video
          src={manager.video}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <>
          <Initials name={manager.name} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={manager.photo}
            alt={manager.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h2 className="text-2xl font-bold text-white">{manager.name}</h2>
        <p className="text-sm font-medium text-zinc-300">{manager.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400 italic">
          &ldquo;{manager.tagline}&rdquo;
        </p>
      </div>
    </motion.div>
  );
}
