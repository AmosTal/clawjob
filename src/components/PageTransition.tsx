"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  transitionKey: string;
}

export default function PageTransition({
  children,
  transitionKey,
}: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ x: 16, opacity: 0, filter: "blur(4px)" }}
        animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
        exit={{ x: -16, opacity: 0, filter: "blur(4px)", transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] } }}
        transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
