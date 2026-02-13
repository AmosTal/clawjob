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
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
