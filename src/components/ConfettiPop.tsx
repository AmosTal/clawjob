"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPopProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 25;
const COLORS = [
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#6ee7b7", // emerald-300
  "#f472b6", // pink-400
];

interface Particle {
  id: number;
  color: string;
  angle: number;
  distance: number;
  size: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    angle: (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5,
    distance: 60 + Math.random() * 80,
    size: 4 + Math.random() * 6,
  }));
}

export default function ConfettiPop({ x, y, onComplete }: ConfettiPopProps) {
  const [visible, setVisible] = useState(true);
  const [particles] = useState(generateParticles);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 800);
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
            const ty = Math.sin(p.angle) * p.distance + 40; // gravity-like fall

            return (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  left: -p.size / 2,
                  top: -p.size / 2,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: tx, y: ty, opacity: 0, scale: 0.3 }}
                transition={{
                  duration: 0.7,
                  ease: "easeOut",
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
