"use client"

import { AnimatePresence, motion } from "framer-motion"

/** A brief full-screen glow; remount by changing `flashKey` to play it again. */
export function FlashOverlay({ active, flashKey, gradient }: { active: boolean; flashKey: number; gradient: string }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={flashKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, type: "tween" }}
          className="pointer-events-none fixed inset-0 z-40"
          style={{ background: gradient }}
        />
      )}
    </AnimatePresence>
  )
}
