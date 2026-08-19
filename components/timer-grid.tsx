"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ANIM_SPEED, Mouse, Cheese, RaceCar, FinishFlag, Cone, MouseHole } from "./timer-icons"
import { ConfettiBurst } from "./confetti-burst"
import { useMediaQuery } from "@/hooks/use-media-query"

export type ThemeType = "mouse" | "racecar"

interface TimerGridProps {
  totalIntervals: number
  completedIntervals: number
  theme: ThemeType
  isRunning: boolean
  intervalType: "30sec" | "1min"
  currentIntervalProgress: number
}

function maxColsFromWidth(isNarrow: boolean) {
  return isNarrow ? 5 : 7
}

const HOP_DURATION = 0.35 / ANIM_SPEED
const CRUMB_DURATION = 0.45 / ANIM_SPEED
const CRUMB_STAGGER = 0.04 / ANIM_SPEED
const TRAVEL_STIFFNESS = 320 * ANIM_SPEED
const JUST_ATE_MS = Math.round(600 / ANIM_SPEED)

function gridColsFor(totalIntervals: number, maxCols: number) {
  const withGoal = totalIntervals + 1
  if (withGoal <= 5) return Math.min(withGoal, maxCols)
  if (totalIntervals <= 6) return Math.min(totalIntervals + 1, maxCols)
  if (totalIntervals <= 12) return Math.min(6, maxCols)
  if (totalIntervals <= 20) return Math.min(7, maxCols)
  return Math.min(8, maxCols)
}

export function TimerGrid({
  totalIntervals,
  completedIntervals,
  theme,
  isRunning,
  currentIntervalProgress,
}: TimerGridProps) {
  const reduceMotion = useReducedMotion()
  const isNarrow = useMediaQuery("(max-width: 399px)")
  const cols = gridColsFor(totalIntervals, maxColsFromWidth(isNarrow))
  const gridRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState({ cell: 0, gap: 8 })
  const [prevCompleted, setPrevCompleted] = useState(completedIntervals)
  const [justAte, setJustAte] = useState(false)

  useEffect(() => {
    if (completedIntervals > prevCompleted) {
      setJustAte(true)
      const timer = window.setTimeout(() => setJustAte(false), JUST_ATE_MS)
      setPrevCompleted(completedIntervals)
      return () => window.clearTimeout(timer)
    }
    if (completedIntervals < prevCompleted) {
      setPrevCompleted(completedIntervals)
      setJustAte(false)
    }
  }, [completedIntervals, prevCompleted])

  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el) return

    const update = () => {
      const styles = window.getComputedStyle(el)
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 8
      const width = el.clientWidth
      const cell = cols > 0 ? (width - gap * (cols - 1)) / cols : 0
      setMetrics({ cell, gap })
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cols, totalIntervals])

  const onCurrentFood = completedIntervals < totalIntervals
  const goingHome = theme === "mouse" && completedIntervals >= totalIntervals
  const characterIndex = Math.min(completedIntervals, totalIntervals)
  const characterCol = characterIndex % cols
  const characterRow = Math.floor(characterIndex / cols)
  const intervalActive = isRunning || currentIntervalProgress > 0
  const isEating = onCurrentFood && intervalActive && currentIntervalProgress >= 0.08
  const isMoving =
    (onCurrentFood && intervalActive && currentIntervalProgress < 0.08) || goingHome
  const nibbleOffset = theme === "mouse" && onCurrentFood
  const charSize = goingHome
    ? metrics.cell * 0.16
    : nibbleOffset
      ? metrics.cell * 0.56
      : metrics.cell * 0.82
  const xInset = goingHome
    ? metrics.cell * 0.42
    : nibbleOffset
      ? characterCol === 0
        ? metrics.cell * 0.04
        : metrics.cell * 0.02
      : metrics.cell * 0.09
  const yInset = goingHome
    ? metrics.cell * 0.42
    : nibbleOffset
      ? metrics.cell * 0.4
      : metrics.cell * 0.09
  const charLeft = Math.max(0, characterCol * (metrics.cell + metrics.gap) + xInset)
  const charTop = Math.max(0, characterRow * (metrics.cell + metrics.gap) + yInset)
  const charOpacity = goingHome ? 0 : 1

  const crumbOffsets = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: ((i * 37) % 60) - 30,
        y: ((i * 53) % 60) - 30,
      })),
    [],
  )

  return (
    <div className="mx-auto w-full max-w-lg p-2 sm:p-3">
      <div className="relative">
      <div
        ref={gridRef}
        className="grid w-full gap-1.5 sm:gap-2 md:gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: totalIntervals }, (_, i) => {
          const isCompleted = i < completedIntervals
          const isCurrent = i === completedIntervals && (isRunning || currentIntervalProgress > 0) && i < totalIntervals
          const showCurrent = i === completedIntervals && completedIntervals < totalIntervals
          const justCompleted = i === completedIntervals - 1 && justAte
          const eatProgress = showCurrent ? currentIntervalProgress : isCompleted ? 1 : 0

          return (
            <div
              key={`interval-${i}`}
              className="relative flex aspect-square items-center justify-center"
            >
              {showCurrent && !reduceMotion && (
                <div
                  className="absolute inset-0 rounded-full opacity-70"
                  style={{
                    background:
                      theme === "mouse"
                        ? "radial-gradient(circle, rgba(255,217,61,0.35) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(255,107,0,0.28) 0%, transparent 70%)",
                  }}
                />
              )}

              {justCompleted && theme === "mouse" && !reduceMotion && (
                <div className="pointer-events-none absolute inset-0">
                  {crumbOffsets.map((crumb, n) => (
                    <motion.div
                      key={n}
                      className="absolute top-1/2 left-1/2 size-2 rounded-full bg-amber-200"
                      initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                      animate={{ x: crumb.x, y: crumb.y, scale: 0, opacity: 0 }}
                      transition={{ duration: CRUMB_DURATION, delay: n * CRUMB_STAGGER }}
                    />
                  ))}
                </div>
              )}

              {theme === "mouse" ? (
                <Cheese
                  className="relative size-full drop-shadow-md"
                  eaten={isCompleted}
                  eatProgress={eatProgress}
                  isBeingEaten={Boolean(isCurrent && isRunning)}
                />
              ) : (
                <Cone
                  className="relative size-full drop-shadow-md"
                  passed={isCompleted}
                  passProgress={eatProgress}
                  isBeingPassed={Boolean(isCurrent && isRunning)}
                />
              )}
            </div>
          )
        })}

        <motion.div
          className="relative flex aspect-square items-center justify-center"
          animate={
            completedIntervals >= totalIntervals && !reduceMotion
              ? { scale: [1, 1.08, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.9, repeat: completedIntervals >= totalIntervals ? 2 : 0 }}
        >
          {theme === "mouse" ? (
            <MouseHole
              className="size-full drop-shadow-lg"
              arrived={completedIntervals >= totalIntervals}
            />
          ) : (
            <FinishFlag className="size-full drop-shadow-lg" />
          )}
        </motion.div>
      </div>

      {metrics.cell > 0 && (
        <motion.div
          className="pointer-events-none absolute z-10 flex items-center justify-center"
          initial={false}
          animate={{
            left: charLeft,
            top: charTop,
            width: charSize,
            height: charSize,
            opacity: charOpacity,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : goingHome
                ? {
                    left: { type: "spring", stiffness: TRAVEL_STIFFNESS, damping: 26 },
                    top: { type: "spring", stiffness: TRAVEL_STIFFNESS, damping: 26 },
                    width: { duration: 0.7 / ANIM_SPEED, delay: 0.12 / ANIM_SPEED, ease: "easeIn" },
                    height: { duration: 0.7 / ANIM_SPEED, delay: 0.12 / ANIM_SPEED, ease: "easeIn" },
                    opacity: { duration: 0.45 / ANIM_SPEED, delay: 0.28 / ANIM_SPEED, ease: "easeIn" },
                  }
                : { type: "spring", stiffness: TRAVEL_STIFFNESS, damping: 26 }
          }
        >
          <motion.div
            className="size-full"
            animate={justAte && !reduceMotion && !goingHome ? { y: [0, -8, 0] } : { y: 0 }}
            transition={{ duration: 0.48, type: "tween", ease: "easeOut" }}
          >
            {theme === "mouse" ? (
              <Mouse
                className="size-full drop-shadow-xl"
                isMoving={isMoving}
                isEating={isEating}
                playing={isRunning || goingHome}
              />
            ) : (
              <RaceCar
                className="size-full drop-shadow-xl"
                isMoving={isMoving || isEating}
                playing={isRunning}
              />
            )}
          </motion.div>
        </motion.div>
      )}
      </div>
    </div>
  )
}

const CONFETTI_COLORS = ["#E53935", "#FFD93D", "#4CAF50", "#2196F3", "#FF6B00", "#9C27B0"] as const
const CONFETTI_SHAPES = ["square", "circle", "triangle"] as const

type ConfettiPiece = {
  id: number
  shape: (typeof CONFETTI_SHAPES)[number]
  color: string
  startX: number
  drift: number
  duration: number
  delay: number
  rotate: number
  size: number
}

export function CelebrationOverlay({
  theme,
  onClose,
}: {
  theme: ThemeType
  onClose: () => void
}) {
  const reduceMotion = useReducedMotion()
  const isNarrow = useMediaQuery("(max-width: 480px)")
  const confettiCount = reduceMotion ? 0 : isNarrow ? 48 : 90

  const confetti = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: confettiCount }, (_, i) => ({
        id: i,
        shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length] ?? "square",
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? "#FFD93D",
        startX: (i * 17) % 100,
        drift: ((i * 13) % 24) - 12,
        duration: 2.2 + (i % 5) * 0.15,
        delay: (i % 8) * 0.05,
        rotate: (i % 2 === 0 ? 1 : -1) * (420 + i * 12),
        size: 8 + (i % 7),
      })),
    [confettiCount],
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-foreground/50"
      onClick={onClose}
    >
      <ConfettiBurst pieceCount={96} />

      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ duration: 1, type: "tween" }}
        style={{
          background:
            theme === "mouse"
              ? "radial-gradient(circle at center, rgba(255,217,61,0.45) 0%, transparent 70%)"
              : "radial-gradient(circle at center, rgba(229,57,53,0.4) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ scale: 0.7, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.45 }}
        className="relative z-10 mx-3 w-full max-w-sm rounded-[1.75rem] bg-card p-6 text-center shadow-xl ring-1 ring-black/5 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, -10, 0] }}
          transition={{ type: "tween", duration: 0.8, repeat: reduceMotion ? 0 : 3, ease: "easeOut" }}
          className="relative mx-auto mb-5 size-28 sm:size-32"
        >
          {theme === "mouse" ? (
            <>
              <Mouse className="size-full" />
              <div className="absolute -top-1 -right-1 size-12">
                <MouseHole className="size-full" arrived />
              </div>
            </>
          ) : (
            <>
              <RaceCar className="size-full" />
              <div className="absolute -top-1 -right-1 size-12">
                <FinishFlag className="size-full" />
              </div>
            </>
          )}
        </motion.div>

        <h2 className="mb-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {theme === "mouse" ? "All done!" : "Winner!"}
        </h2>
        <p className="mb-6 text-pretty text-base text-muted-foreground">
          {theme === "mouse"
            ? "The mouse ate every piece and went home."
            : "You crossed the finish line."}
        </p>
        <button
          type="button"
          data-testid="play-again"
          onClick={onClose}
          className="relative min-h-12 rounded-full bg-primary px-8 py-3 text-lg font-semibold text-primary-foreground shadow-lg ring-1 ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Play Again
        </button>
      </motion.div>

      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className={`pointer-events-none absolute ${
            piece.shape === "circle" ? "rounded-full" : "rounded-sm"
          }`}
          style={{
            width: piece.shape === "triangle" ? 0 : piece.size,
            height: piece.shape === "triangle" ? 0 : piece.size,
            backgroundColor: piece.shape === "triangle" ? "transparent" : piece.color,
            borderLeft: piece.shape === "triangle" ? "6px solid transparent" : undefined,
            borderRight: piece.shape === "triangle" ? "6px solid transparent" : undefined,
            borderBottom: piece.shape === "triangle" ? `12px solid ${piece.color}` : undefined,
            left: `${piece.startX}%`,
          }}
          initial={{ y: -24, rotate: 0, opacity: 1, scale: 0.4 }}
          animate={{
            y: "110vh",
            x: piece.drift * 4,
            rotate: piece.rotate,
            opacity: [1, 1, 0],
            scale: 1,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  )
}
