"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CarSvg, CheeseSvg, ConeSvg, FlagSvg, MouseEatSvg, MouseHoleSvg, MouseIdleSvg, MouseRunSvg } from "./art"

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

const STILL = "pointer-events-none select-none"

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

/** `playing` drives all motion; the static mouse is used in headers and pickers. */
export function Mouse({
  className = "",
  isMoving = false,
  isEating = false,
  playing = false,
}: {
  className?: string
  isMoving?: boolean
  isEating?: boolean
  playing?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const frame = useFrameCycle(4, isEating ? EAT_FPS : RUN_FPS, playing && (isEating || isMoving))
  const animating = playing && !reduceMotion

  return (
    <motion.div
      className={`${className} ${STILL}`}
      aria-hidden="true"
      animate={!animating ? {} : isEating ? { rotate: [0, 4, 0, -3, 0], y: [0, 1, 0, 1, 0] } : { y: [0, -3, 0] }}
      transition={{
        type: "tween",
        duration: isEating ? EAT_DURATION : MOVE_DURATION,
        repeat: animating ? Infinity : 0,
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
      className={`${className} ${STILL}`}
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
  playing = false,
}: {
  className?: string
  isMoving?: boolean
  playing?: boolean
}) {
  const frame = useFrameCycle(3, DRIVE_FPS, playing && isMoving)

  return (
    <motion.div
      className={`${className} ${STILL}`}
      aria-hidden="true"
      animate={playing ? { x: [0, 2, 0, -1, 0], y: [0, -1, 0, -0.5, 0], rotate: [0, 0.4, 0, -0.2, 0] } : {}}
      transition={{ type: "tween", duration: CAR_DURATION, repeat: playing ? Infinity : 0, ease: "linear" }}
    >
      <CarSvg driving={isMoving} frame={frame} />
    </motion.div>
  )
}

export function FinishFlag({ className = "" }: { className?: string }) {
  const frame = useFrameCycle(3, FLAG_FPS, true)
  return (
    <div className={`${className} ${STILL}`} aria-hidden="true">
      <FlagSvg frame={frame} />
    </div>
  )
}

export function MouseHole({ className = "", arrived = false }: { className?: string; arrived?: boolean }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={`${className} ${STILL}`}
      aria-hidden="true"
      animate={reduceMotion ? { scale: 1 } : arrived ? { scale: [1, 1.08, 1] } : { scale: [1, 1.05, 1] }}
      transition={{
        type: "tween",
        duration: arrived ? 0.7 : 1.8,
        repeat: reduceMotion ? 0 : arrived ? 2 : Infinity,
        ease: "easeInOut",
      }}
    >
      <MouseHoleSvg arrived={arrived} />
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
  const reduceMotion = useReducedMotion()
  const wobble = passProgress * 8

  return (
    <motion.div
      className={`${className} ${STILL}`}
      aria-hidden="true"
      animate={
        passed
          ? { rotate: -28, x: 4, opacity: 0.85, scale: 1 }
          : isBeingPassed && !reduceMotion
            ? { rotate: [-wobble, wobble, -wobble], scale: 1 - passProgress * 0.15, x: 0, opacity: 1 }
            : { rotate: 0, scale: 1, x: 0, opacity: 1 }
      }
      transition={
        passed
          ? { duration: CONE_SETTLE_DURATION, type: "spring" }
          : isBeingPassed && !reduceMotion
            ? { duration: CONE_WOBBLE_DURATION, repeat: Infinity, ease: "easeInOut" }
            : { duration: CONE_SETTLE_DURATION }
      }
    >
      <ConeSvg knocked={passed} progress={passProgress} />
    </motion.div>
  )
}
