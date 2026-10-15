"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CarSvg, CheeseSvg, FlagSvg, MouseEatSvg, MouseIdleSvg, MouseRunSvg } from "./art"

/** Slow preset: 0.55x of the original feel (fps x speed, duration / speed). */
export const ANIM_SPEED = 0.55
const EAT_FPS = 8 * ANIM_SPEED
const RUN_FPS = 10 * ANIM_SPEED
const DRIVE_FPS = 10 * ANIM_SPEED
const FLAG_FPS = 5 * ANIM_SPEED
const EAT_DURATION = 0.28 / ANIM_SPEED
const MOVE_DURATION = 0.7 / ANIM_SPEED
const CHEESE_NIBBLE_DURATION = 0.22 / ANIM_SPEED
const CHEESE_IDLE_DURATION = 0.4 / ANIM_SPEED
const CAR_DURATION = 0.25 / ANIM_SPEED
const CONE_WOBBLE_DURATION = 0.2 / ANIM_SPEED
const CONE_SETTLE_DURATION = 0.3 / ANIM_SPEED

/** Cycles 0..frameCount-1 at `fps` while `playing`; holds the last frame otherwise. */
function useFrameCycle(frameCount: number, fps: number, playing: boolean) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!playing || frameCount <= 1) return
    const id = window.setInterval(
      () => setFrame((current) => (current + 1) % frameCount),
      Math.max(50, Math.round(1000 / fps)),
    )
    return () => window.clearInterval(id)
  }, [playing, frameCount, fps])

  return frame % frameCount
}

export function Mouse({
  className = "",
  isMoving = false,
  isEating = false,
  playing,
}: {
  className?: string
  isMoving?: boolean
  isEating?: boolean
  playing?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const isAnimating = playing ?? (isMoving || isEating)
  const frame = useFrameCycle(4, isEating ? EAT_FPS : RUN_FPS, isAnimating && (isEating || isMoving))

  const animate =
    reduceMotion || !isAnimating
      ? {}
      : isEating
        ? { rotate: [0, 4, 0, -3, 0], y: [0, 1, 0, 1, 0] }
        : isMoving
          ? { y: [0, -3, 0] }
          : { y: [0, -2, 0] }

  return (
    <motion.div
      className={`${className} pointer-events-none select-none`}
      aria-hidden="true"
      animate={animate}
      transition={{
        type: "tween",
        duration: isEating ? EAT_DURATION : MOVE_DURATION,
        repeat: reduceMotion || !isAnimating ? 0 : isMoving || isEating ? Infinity : 2,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    >
      {isEating ? <MouseEatSvg frame={frame} /> : isMoving ? <MouseRunSvg frame={frame} /> : <MouseIdleSvg />}
    </motion.div>
  )
}

export function Cheese({
  className = "",
  eaten = false,
  eatProgress = 0,
  isBeingEaten = false,
}: {
  className?: string
  eaten?: boolean
  eatProgress?: number
  isBeingEaten?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const frame = eaten ? 3 : Math.min(3, Math.max(0, Math.floor(eatProgress * 4)))

  return (
    <motion.div
      className={`${className} pointer-events-none select-none`}
      aria-hidden="true"
      animate={
        reduceMotion
          ? { scale: 1 }
          : isBeingEaten
            ? { rotate: [-2, 2, -2], scale: [1, 0.96, 1] }
            : eaten
              ? { scale: 0.92, opacity: 0.95 }
              : { scale: 1 }
      }
      transition={{
        duration: isBeingEaten ? CHEESE_NIBBLE_DURATION : CHEESE_IDLE_DURATION,
        repeat: reduceMotion ? 0 : isBeingEaten ? Infinity : 0,
        ease: "easeInOut",
      }}
    >
      <CheeseSvg frame={frame} />
    </motion.div>
  )
}

export function RaceCar({
  className = "",
  isMoving = false,
  playing,
}: {
  className?: string
  isMoving?: boolean
  playing?: boolean
}) {
  const isAnimating = playing ?? isMoving
  const frame = useFrameCycle(3, DRIVE_FPS, isAnimating && isMoving)

  return (
    <motion.div
      className={`${className} pointer-events-none select-none`}
      aria-hidden="true"
      animate={
        isAnimating
          ? {
              x: [0, 2, 0, -1, 0],
              y: [0, -1, 0, -0.5, 0],
              rotate: [0, 0.4, 0, -0.2, 0],
            }
          : {}
      }
      transition={{
        type: "tween",
        duration: CAR_DURATION,
        repeat: isAnimating ? Infinity : 0,
        ease: "linear",
      }}
    >
      <CarSvg driving={isMoving} frame={frame} />
    </motion.div>
  )
}

export function FinishFlag({ className = "" }: { className?: string }) {
  const frame = useFrameCycle(3, FLAG_FPS, true)
  return (
    <div className={`${className} pointer-events-none select-none`} aria-hidden="true">
      <FlagSvg frame={frame} />
    </div>
  )
}

export function MouseHole({
  className = "",
  arrived = false,
}: {
  className?: string
  arrived?: boolean
}) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={`${className} pointer-events-none select-none`}
      aria-hidden="true"
      animate={reduceMotion ? { scale: 1 } : arrived ? { scale: [1, 1.08, 1] } : { scale: [1, 1.05, 1] }}
      transition={{
        type: "tween",
        duration: arrived ? 0.7 : 1.8,
        repeat: reduceMotion ? 0 : arrived ? 2 : Infinity,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 64 64" className="size-full">
        <ellipse cx="32" cy="56" rx="16" ry="3.2" fill="#2e1a08" opacity="0.18" />
        <polygon points="32,8 54,26 10,26" fill="#b3391c" />
        <polygon points="32,12 48,26 16,26" fill="#d6481f" />
        <rect x="14" y="25" width="36" height="28" rx="3" fill="#8f5a24" stroke="#412812" strokeWidth="2" />
        <rect x="18" y="29" width="10" height="8" rx="1.5" fill="#fde68a" />
        <rect x="19" y="30" width="3.5" height="6" fill="#fff7d6" opacity="0.8" />
        <ellipse cx="38" cy="44" rx={arrived ? 7 : 8.5} ry={arrived ? 10 : 12} fill="#1c1917" />
        <ellipse cx="38" cy="44" rx="5.5" ry="8.5" fill="#292524" />
        {!arrived && (
          <path
            d="M34 38c1.5 3 3 5 4 5s2.5-2 4-5"
            fill="none"
            stroke="#fde68a"
            strokeOpacity="0.4"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        )}
      </svg>
    </motion.div>
  )
}

export function Cone({
  className = "",
  passed = false,
  passProgress = 0,
  isBeingPassed = false,
}: {
  className?: string
  passed?: boolean
  passProgress?: number
  isBeingPassed?: boolean
}) {
  if (passed) {
    return (
      <motion.svg
        viewBox="0 0 64 64"
        className={className}
        aria-hidden="true"
        initial={{ rotate: 0, x: 0 }}
        animate={{ rotate: -28, x: 4, opacity: 0.85 }}
        transition={{ duration: CONE_SETTLE_DURATION, type: "spring" }}
      >
        <ellipse cx="36" cy="50" rx="18" ry="4" fill="#2e1a08" opacity="0.18" />
        <polygon points="24,52 50,40 50,48 24,56" fill="#ff6b00" opacity="0.9" />
        <rect x="22" y="50" width="6" height="24" fill="#ff6b00" rx="2" transform="rotate(-70 25 52)" />
      </motion.svg>
    )
  }

  const wobbleIntensity = passProgress * 8
  const scaleEffect = 1 - passProgress * 0.15

  return (
    <motion.svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      animate={
        isBeingPassed
          ? {
              rotate: [-wobbleIntensity, wobbleIntensity, -wobbleIntensity],
              scale: scaleEffect,
            }
          : { scale: 1 }
      }
      transition={
        isBeingPassed
          ? { duration: CONE_WOBBLE_DURATION, repeat: Infinity, ease: "easeInOut" }
          : { duration: CONE_SETTLE_DURATION }
      }
    >
      <ellipse cx="32" cy="54" rx={14 - passProgress * 4} ry={3 - passProgress} fill="#2e1a08" opacity="0.18" />
      <polygon points="32,12 44,52 20,52" fill="#ff6b00" />
      <polygon points="32,18 26,36 38,36" fill="#fff" opacity="0.25" />
      <rect x="18" y="48" width="28" height="6" fill="#ff6b00" rx="2" />
      <rect x="24" y="28" width="16" height="4" fill="#fff" />
      <rect x="22" y="38" width="20" height="4" fill="#fff" />
    </motion.svg>
  )
}
