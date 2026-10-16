"use client"

import { useEffect, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useSpriteStatus } from "@/hooks/use-sprite-status"
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

/** Horizontal sprite sheet. Shows the flat drawing until the PNG has loaded. */
function Sprite({
  src,
  frameCount,
  className = "",
  frame,
  playing = false,
  fps = 8,
  fallback,
}: {
  src: string
  frameCount: number
  className?: string
  frame?: number
  playing?: boolean
  fps?: number
  fallback: (frame: number) => ReactNode
}) {
  const status = useSpriteStatus(src)
  const [cycled, setCycled] = useState(0)

  useEffect(() => {
    if (typeof frame === "number" || !playing || frameCount <= 1) return
    const id = window.setInterval(() => {
      setCycled((next) => (next + 1) % frameCount)
    }, Math.max(50, Math.round(1000 / fps)))
    return () => window.clearInterval(id)
  }, [frame, playing, frameCount, fps])

  const current = typeof frame === "number" ? frame : cycled
  const safe = Math.max(0, Math.min(current, frameCount - 1))
  if (status !== "ready") {
    return <div className={`${className} ${STILL}`}>{fallback(safe)}</div>
  }

  const position = frameCount > 1 ? `${(safe / (frameCount - 1)) * 100}% 0%` : "center"
  return (
    <div
      className={`${className} ${STILL}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${frameCount * 100}% 100%`,
        backgroundPosition: position,
      }}
    />
  )
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
  const animating = playing && !reduceMotion
  const sheet = isEating
    ? { src: "/sprites/mouse-eat.png", frames: 4, fps: EAT_FPS }
    : isMoving
      ? { src: "/sprites/mouse-run.png", frames: 4, fps: RUN_FPS }
      : { src: "/sprites/mouse-idle.png", frames: 1, fps: 1 }

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
      <Sprite
        src={sheet.src}
        frameCount={sheet.frames}
        fps={sheet.fps}
        playing={animating && (isEating || isMoving)}
        className="size-full"
        fallback={(frame) =>
          isEating ? <MouseEatSvg frame={frame} /> : isMoving ? <MouseRunSvg frame={frame} /> : <MouseIdleSvg />
        }
      />
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
      <Sprite
        src={eaten || isBeingEaten || eatProgress > 0 ? "/sprites/cheese-eat.png" : "/sprites/cheese-idle.png"}
        frameCount={eaten || isBeingEaten || eatProgress > 0 ? 4 : 1}
        frame={frame}
        className="size-full"
        fallback={(drawn) => <CheeseSvg frame={drawn} />}
      />
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
  return (
    <motion.div
      className={`${className} ${STILL}`}
      aria-hidden="true"
      animate={playing ? { x: [0, 2, 0, -1, 0], y: [0, -1, 0, -0.5, 0], rotate: [0, 0.4, 0, -0.2, 0] } : {}}
      transition={{ type: "tween", duration: CAR_DURATION, repeat: playing ? Infinity : 0, ease: "linear" }}
    >
      <Sprite
        src={isMoving ? "/sprites/car-drive.png" : "/sprites/car-idle.png"}
        frameCount={isMoving ? 3 : 1}
        fps={DRIVE_FPS}
        playing={playing && isMoving}
        className="size-full"
        fallback={(frame) => <CarSvg driving={isMoving} frame={frame} />}
      />
    </motion.div>
  )
}

export function FinishFlag({ className = "" }: { className?: string }) {
  return (
    <Sprite
      src="/sprites/flag-wave.png"
      frameCount={3}
      fps={FLAG_FPS}
      playing
      className={className}
      fallback={(frame) => <FlagSvg frame={frame} />}
    />
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
