"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPopProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 32;
const COLORS = [
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#6ee7b7", // emerald-300
  "#f472b6", // pink-400
  "#fcd34d", // amber-300
  "#818cf8", // indigo-400
];

interface Particle {
  id: number;
  color: string;
  angle: number;
  distance: number;
  size: number;
  rotation: number;
  delay: number;
  shape: "circle" | "rect";
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.6,
    distance: 50 + Math.random() * 100,
    size: 3 + Math.random() * 7,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.08,
    shape: Math.random() > 0.5 ? "circle" : "rect",
  }));
}

export default function ConfettiPop({ x, y, onComplete }: ConfettiPopProps) {
  const [visible, setVisible] = useState(true);
  const [particles] = useState(generateParticles);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: x, top: y }}
        >
          {particles.map((p) => {
            const tx = Math.cos(p.angle) * p.distance;
            const ty = Math.sin(p.angle) * p.distance + 50; // gravity-like fall

            return (
              <motion.div
                key={p.id}
                className={`absolute ${p.shape === "circle" ? "rounded-full" : "rounded-sm"}`}
                style={{
                  width: p.size,
                  height: p.shape === "rect" ? p.size * 0.6 : p.size,
                  backgroundColor: p.color,
                  left: -p.size / 2,
                  top: -p.size / 2,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{ x: tx, y: ty, opacity: 0, scale: [0, 1.2, 0.4], rotate: p.rotation }}
                transition={{
                  duration: 0.85,
                  ease: [0.22, 1, 0.36, 1],
                  delay: p.delay,
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
