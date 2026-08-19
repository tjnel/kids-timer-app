"use client"

import { useEffect, useState, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useSpriteStatus } from "@/hooks/use-sprite-status"
import {
  AppleSvg,
  CarSvg,
  CheeseSvg,
  FlagSvg,
  MouseEatSvg,
  MouseIdleSvg,
  MouseRunSvg,
} from "./sprite-fallbacks"

/** Lab Slow preset: 0.55× original feel (fps × speed, duration ÷ speed). */
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
  const [current, setCurrent] = useState(frame ?? 0)

  useEffect(() => {
    if (typeof frame === "number") {
      setCurrent(frame)
      return
    }
    if (!playing || frameCount <= 1) return
    const id = window.setInterval(() => {
      setCurrent((f) => (f + 1) % frameCount)
    }, Math.max(50, Math.round(1000 / fps)))
    return () => window.clearInterval(id)
  }, [frame, playing, frameCount, fps])

  const safe = Math.max(0, Math.min(current, frameCount - 1))
  const position =
    frameCount > 1 ? `${(safe / (frameCount - 1)) * 100}% 0%` : "center"

  if (status !== "ready") {
    return (
      <div className={`${className} pointer-events-none select-none`} aria-hidden="true">
        {fallback(safe)}
      </div>
    )
  }

  return (
    <div
      className={`${className} pointer-events-none select-none`}
      aria-hidden="true"
      style={{
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${frameCount * 100}% 100%`,
        backgroundPosition: position,
      }}
    />
  )
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
  const sheet = isEating
    ? { src: "/sprites/mouse-eat.png", frames: 4, fps: EAT_FPS }
    : isMoving
      ? { src: "/sprites/mouse-run.png", frames: 4, fps: RUN_FPS }
      : { src: "/sprites/mouse-idle.png", frames: 1, fps: 1 }

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
      className={className}
      animate={animate}
      transition={{
        type: "tween",
        duration: isEating ? EAT_DURATION : MOVE_DURATION,
        repeat: reduceMotion || !isAnimating ? 0 : isMoving || isEating ? Infinity : 2,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    >
      <Sprite
        src={sheet.src}
        frameCount={sheet.frames}
        fps={sheet.fps}
        playing={isAnimating}
        className="size-full"
        fallback={(frame) =>
          isEating ? (
            <MouseEatSvg frame={frame} />
          ) : isMoving ? (
            <MouseRunSvg frame={frame} />
          ) : (
            <MouseIdleSvg />
          )
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
  const frame = eaten
    ? 3
    : Math.min(3, Math.max(0, Math.floor(eatProgress * 4)))

  return (
    <motion.div
      className={className}
      animate={
        reduceMotion
          ? { scale: 1 }
          : isBeingEaten
            ? { rotate: [-2, 2, -2], scale: [1, 0.96, 1] }
            : eaten
              ? { scale: 0.92, opacity: 0.95 }
              : { scale: [1, 1.04, 1] }
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
        frame={eaten || isBeingEaten || eatProgress > 0 ? frame : 0}
        className="size-full"
        fallback={(f) => <CheeseSvg frame={eaten || isBeingEaten || eatProgress > 0 ? f : 0} />}
      />
    </motion.div>
  )
}

export function Apple({
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
  const frame = eaten
    ? 5
    : Math.min(4, Math.max(0, Math.floor(eatProgress * 5)))

  return (
    <motion.div
      className={className}
      animate={
        isBeingEaten
          ? { rotate: [-2, 2, -2], scale: [1, 0.98, 1] }
          : { scale: 1 }
      }
      transition={{
        duration: 0.2,
        repeat: isBeingEaten ? Infinity : 0,
        ease: "easeInOut",
      }}
    >
      <Sprite
        src="/sprites/apple-eat.png"
        frameCount={6}
        frame={frame}
        className="size-full"
        fallback={(f) => <AppleSvg frame={f} />}
      />
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
  return (
    <motion.div
      className={className}
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
      <Sprite
        src={isMoving ? "/sprites/car-drive.png" : "/sprites/car-idle.png"}
        frameCount={isMoving ? 3 : 1}
        fps={DRIVE_FPS}
        playing={isAnimating}
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
      className={className}
      animate={
        reduceMotion
          ? { scale: 1 }
          : arrived
            ? { scale: [1, 1.08, 1] }
            : { scale: [1, 1.05, 1] }
      }
      transition={{
        type: "tween",
        duration: arrived ? 0.7 : 1.8,
        repeat: reduceMotion ? 0 : arrived ? 2 : Infinity,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 64 64" className="size-full" aria-hidden="true">
        <ellipse cx="32" cy="56" rx="16" ry="3.2" className="fill-indigo-950/10" />
        <polygon points="32,8 54,26 10,26" className="fill-orange-700" />
        <polygon points="32,12 48,26 16,26" className="fill-orange-600" />
        <rect x="14" y="25" width="36" height="28" rx="3" className="fill-amber-700 stroke-amber-950" strokeWidth="2" />
        <rect x="18" y="29" width="10" height="8" rx="1.5" className="fill-amber-200" />
        <rect x="19" y="30" width="3.5" height="6" className="fill-amber-100/80" />
        <ellipse
          cx="38"
          cy="44"
          rx={arrived ? 7 : 8.5}
          ry={arrived ? 10 : 12}
          className="fill-stone-950"
        />
        <ellipse cx="38" cy="44" rx="5.5" ry="8.5" className="fill-stone-900" />
        {!arrived && (
          <path
            d="M34 38c1.5 3 3 5 4 5s2.5-2 4-5"
            className="fill-none stroke-amber-100/35"
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
        initial={{ rotate: 0, x: 0 }}
        animate={{ rotate: -28, x: 4, opacity: 0.85 }}
        transition={{ duration: CONE_SETTLE_DURATION, type: "spring" }}
      >
        <ellipse cx="36" cy="50" rx="18" ry="4" fill="#1e1b4b" opacity="0.1" />
        <polygon points="24,52 50,40 50,48 24,56" fill="#ff6b00" opacity="0.9" />
        <rect
          x="22"
          y="50"
          width="6"
          height="24"
          fill="#ff6b00"
          rx="2"
          transform="rotate(-70 25 52)"
        />
      </motion.svg>
    )
  }

  const wobbleIntensity = passProgress * 8
  const scaleEffect = 1 - passProgress * 0.15

  return (
    <motion.svg
      viewBox="0 0 64 64"
      className={className}
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
      <ellipse
        cx="32"
        cy="54"
        rx={14 - passProgress * 4}
        ry={3 - passProgress}
        fill="#1e1b4b"
        opacity="0.12"
      />
      <polygon points="32,12 44,52 20,52" fill="#ff6b00" />
      <polygon points="32,18 26,36 38,36" fill="#fff" opacity="0.25" />
      <rect x="18" y="48" width="28" height="6" fill="#ff6b00" rx="2" />
      <rect x="24" y="28" width="16" height="4" fill="#fff" />
      <rect x="22" y="38" width="20" height="4" fill="#fff" />
    </motion.svg>
  )
}
