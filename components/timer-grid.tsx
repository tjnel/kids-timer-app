"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ANIM_SPEED, Cheese, Cone, FinishFlag, Mouse, MouseHole, RaceCar } from "./timer-icons"

export type ThemeType = "mouse" | "racecar"

interface TimerGridProps {
  totalIntervals: number
  completedIntervals: number
  theme: ThemeType
  isRunning: boolean
  currentIntervalProgress: number
  /** Upper bound for one cell so short timers do not become a few giant tiles. */
  maxCell?: number
}

const GAP_RATIO = 0.12
const TRAVEL = { type: "spring", stiffness: 320 * ANIM_SPEED, damping: 26 } as const
const CRUMB_DURATION = 0.45 / ANIM_SPEED
const CRUMB_STAGGER = 0.04 / ANIM_SPEED
const CRUMBS = Array.from({ length: 6 }, (_, i) => ({
  x: ((i * 37) % 60) - 30,
  y: ((i * 53) % 60) - 30,
}))

/**
 * Picks the column count whose cells fill the box best. Ties go to the layout
 * with fewer empty cells, then to the one that follows the box's orientation
 * (wider on landscape screens, taller on portrait ones).
 */
export function fitGrid(count: number, width: number, height: number, maxCell: number) {
  const landscape = width >= height
  let best = { cols: 1, pitch: 0, empty: Infinity }
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const pitch = Math.min(width / cols, height / rows, maxCell)
    const empty = cols * rows - count
    const tie = Math.abs(pitch - best.pitch) <= 0.5
    const better =
      pitch > best.pitch + 0.5 || (tie && (empty < best.empty || (empty === best.empty && landscape)))
    if (better) best = { cols, pitch, empty }
  }
  const gap = Math.round(best.pitch * GAP_RATIO)
  return { cols: best.cols, cell: Math.floor(best.pitch - gap), gap }
}

export function TimerGrid({
  totalIntervals,
  completedIntervals,
  theme,
  isRunning,
  currentIntervalProgress,
  maxCell = 200,
}: TimerGridProps) {
  const reduceMotion = useReducedMotion()
  const boxRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setBox({ width: rect.width, height: rect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const cellCount = totalIntervals + 1
  const { cols, cell, gap } = fitGrid(cellCount, box.width, box.height, maxCell)

  const arrived = completedIntervals >= totalIntervals
  const characterIndex = Math.min(completedIntervals, totalIntervals)
  const intervalActive = isRunning || currentIntervalProgress > 0
  const isEating = !arrived && intervalActive && currentIntervalProgress >= 0.08
  const isMoving = (!arrived && intervalActive && currentIntervalProgress < 0.08) || arrived

  // The character is one persistent element positioned over the grid from the
  // known cell geometry, so moving to the next cell is a plain x/y animation.
  const pitch = cell + gap
  const place = theme === "mouse" ? { left: -0.06, bottom: -0.04, size: 0.6 } : { left: 0.08, bottom: 0.08, size: 0.84 }
  const characterSize = cell * place.size
  const characterX = (characterIndex % cols) * pitch + place.left * cell + (arrived ? 0.3 * cell : 0)
  const characterY =
    Math.floor(characterIndex / cols) * pitch + cell - characterSize - place.bottom * cell - (arrived ? 0.1 * cell : 0)

  const character = (
    <motion.div
      data-testid="runner"
      className="pointer-events-none absolute top-0 left-0 z-10"
      style={{ width: characterSize, height: characterSize }}
      initial={false}
      animate={{ x: characterX, y: characterY, scale: arrived ? 0.15 : 1, opacity: arrived ? 0 : 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              x: TRAVEL,
              y: TRAVEL,
              default: { duration: 0.6 / ANIM_SPEED, delay: arrived ? 0.25 / ANIM_SPEED : 0, ease: "easeIn" },
            }
      }
    >
      <motion.div
        key={completedIntervals}
        className="size-full"
        animate={completedIntervals > 0 && !arrived && !reduceMotion ? { y: [0, -8, 0] } : { y: 0 }}
        transition={{ duration: 0.48, type: "tween", ease: "easeOut" }}
      >
        {theme === "mouse" ? (
          <Mouse className="size-full" isMoving={isMoving} isEating={isEating} playing={isRunning || arrived} />
        ) : (
          <RaceCar className="size-full" isMoving={isMoving || isEating} playing={isRunning} />
        )}
      </motion.div>
    </motion.div>
  )

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={`${completedIntervals} of ${totalIntervals} ${
        theme === "mouse"
          ? totalIntervals === 1
            ? "cheese piece eaten"
            : "cheese pieces eaten"
          : totalIntervals === 1
            ? "cone passed"
            : "cones passed"
      }`}
      className="flex size-full min-h-0 items-center justify-center"
    >
      {cell > 0 && (
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
            gridAutoRows: `${cell}px`,
            gap,
          }}
        >
          {Array.from({ length: totalIntervals }, (_, i) => {
            const isCompleted = i < completedIntervals
            const isCurrent = i === completedIntervals && !arrived
            const progress = isCurrent ? currentIntervalProgress : isCompleted ? 1 : 0

            return (
              <div key={`piece-${i}`} className="relative">
                {i === completedIntervals - 1 && theme === "mouse" && !reduceMotion && (
                  <div key={`crumbs-${completedIntervals}`} className="pointer-events-none absolute inset-0">
                    {CRUMBS.map((crumb, n) => (
                      <motion.div
                        key={n}
                        className="absolute top-1/2 left-1/2 size-[8%] rounded-full bg-accent"
                        initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                        animate={{ x: crumb.x, y: crumb.y, scale: 0, opacity: 0 }}
                        transition={{ duration: CRUMB_DURATION, delay: n * CRUMB_STAGGER }}
                      />
                    ))}
                  </div>
                )}

                {theme === "mouse" ? (
                  <Cheese
                    className="size-full"
                    eaten={isCompleted}
                    eatProgress={progress}
                    isBeingEaten={isCurrent && isRunning}
                  />
                ) : (
                  <Cone
                    className="size-full"
                    passed={isCompleted}
                    passProgress={progress}
                    isBeingPassed={isCurrent && isRunning}
                  />
                )}
              </div>
            )
          })}

          <motion.div
            className="relative"
            animate={arrived && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.9, repeat: arrived ? 2 : 0 }}
          >
            {theme === "mouse" ? (
              <MouseHole className="size-full" arrived={arrived} />
            ) : (
              <FinishFlag className="size-full" />
            )}
          </motion.div>

          {character}
        </div>
      )}
    </div>
  )
}
