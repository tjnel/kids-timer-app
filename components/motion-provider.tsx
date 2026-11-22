"use client"

import { domAnimation, LazyMotion } from "framer-motion"

/**
 * Loads only the animation features the app uses (animate, exit, tap), which
 * is about 12 KB less compressed JavaScript than the full `motion` component.
 * `strict` makes a stray `motion.*` fail loudly instead of quietly adding it back.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
