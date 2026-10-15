"use client"

import { useCallback, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { formatClock, intervalSeconds, intervalsFor, MAX_MINUTES, snapMinutes, type IntervalType } from "@/hooks/use-timer"
import { ConfettiBurst } from "./confetti-burst"

interface TimeSelectorProps {
  minutes: number
  onMinutesChange: (minutes: number) => void
  intervalType: IntervalType
  onIntervalTypeChange: (type: IntervalType) => void
}

const PRESETS = [1, 2, 3, 5, 10, 15]
const LABELLED_TICKS = new Set([5, 10, MAX_MINUTES])
const BURST_THROTTLE_MS = 280

function clockForMinutes(mins: number) {
  return formatClock(mins * 60)
}

function tickLabel(mins: number) {
  return mins < 1 ? `${Math.round(mins * 60)}s` : `${mins}m`
}

function tickLeft(value: number, minMinutes: number) {
  return ((value - minMinutes) / (MAX_MINUTES - minMinutes)) * 100
}

export function TimeSelector({ minutes, onMinutesChange, intervalType, onIntervalTypeChange }: TimeSelectorProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [burst, setBurst] = useState(0)
  const lastBurstAt = useRef(0)
  const step = intervalSeconds(intervalType) / 60
  const minMinutes = step
  const position = Math.max(0, Math.min(1, (minutes - minMinutes) / (MAX_MINUTES - minMinutes)))
  const pieces = intervalsFor(minutes, intervalType)

  // A little confetti when the time goes up, so adding minutes feels like a treat.
  const change = useCallback(
    (raw: number) => {
      const next = snapMinutes(raw, intervalType)
      if (next > minutes) {
        const now = performance.now()
        if (now - lastBurstAt.current > BURST_THROTTLE_MS) {
          lastBurstAt.current = now
          setBurst((key) => key + 1)
        }
      }
      onMinutesChange(next)
    },
    [intervalType, minutes, onMinutesChange],
  )

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = sliderRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      change(minMinutes + ratio * (MAX_MINUTES - minMinutes))
    },
    [change, minMinutes],
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    setFromClientX(event.clientX)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons === 0) return
    setFromClientX(event.clientX)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? minutes + step
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? minutes - step
          : event.key === "Home"
            ? minMinutes
            : event.key === "End"
              ? MAX_MINUTES
              : null
    if (target === null) return
    event.preventDefault()
    change(target)
  }

  const chooseInterval = (type: IntervalType) => {
    onIntervalTypeChange(type)
    onMinutesChange(snapMinutes(minutes, type))
  }

  const ticks: number[] = []
  for (let value = Math.ceil(minMinutes); value <= MAX_MINUTES; value += 1) ticks.push(value)
  const firstTick = ticks[0] ?? MAX_MINUTES

  return (
    <div className="flex w-full flex-col items-center gap-3 sm:gap-4">
      <div role="radiogroup" aria-label="Piece length" className="flex gap-1 rounded-full bg-card p-1">
        {(["30sec", "1min"] as const).map((type) => {
          const selected = intervalType === type
          return (
            <motion.button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              whileTap={{ scale: 0.96 }}
              onClick={() => chooseInterval(type)}
              className={`min-h-11 min-w-24 rounded-full px-4 py-2 text-sm font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-foreground-strong ${
                selected ? "bg-primary text-primary-foreground" : "text-card-foreground"
              }`}
            >
              {type === "30sec" ? "30 sec" : "1 min"}
            </motion.button>
          )
        })}
      </div>

      <div className="text-center">
        <p className="text-5xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-6xl">
          {clockForMinutes(minutes)}
        </p>
        <p className="mt-0.5 text-base font-semibold text-foreground-strong">
          {pieces} {pieces === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div className="w-full max-w-md px-3">
        <div
          ref={sliderRef}
          role="slider"
          tabIndex={0}
          aria-label="Minutes"
          aria-valuemin={minMinutes}
          aria-valuemax={MAX_MINUTES}
          aria-valuenow={minutes}
          aria-valuetext={clockForMinutes(minutes)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={handleKeyDown}
          className="relative h-12 cursor-pointer touch-none rounded-full select-none focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong sm:h-14"
        >
          <div className="absolute top-1/2 right-0 left-0 h-3 -translate-y-1/2 rounded-full bg-track" />
          <motion.div
            className="absolute top-1/2 left-0 h-3 -translate-y-1/2 rounded-full bg-primary"
            initial={false}
            animate={{ width: `${position * 100}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
          />
          <div className="pointer-events-none absolute top-1/2 right-0 left-0 -translate-y-1/2">
            {ticks.map((value) => (
              <div
                key={value}
                className={`absolute h-3 w-0.5 -translate-x-1/2 rounded-full ${value <= minutes ? "bg-primary-foreground/60" : "bg-foreground/25"}`}
                style={{ left: `${tickLeft(value, minMinutes)}%` }}
              />
            ))}
          </div>
          <motion.div
            className="absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-[0_3px_0_rgba(46,26,8,0.35)] sm:size-12"
            initial={false}
            animate={{ left: `${position * 100}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            aria-hidden="true"
          >
            {Math.floor(minutes) > 0 ? Math.floor(minutes) : ""}
          </motion.div>
        </div>
        <div aria-hidden="true" className="relative h-4">
          {ticks
            .filter((value) => value === firstTick || LABELLED_TICKS.has(value))
            .map((value) => (
              <p
                key={value}
                className="absolute -translate-x-1/2 text-xs font-bold whitespace-nowrap text-foreground-strong"
                style={{ left: `${tickLeft(value, minMinutes)}%` }}
              >
                {tickLabel(value)}
              </p>
            ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((preset) => {
          const selected = minutes === preset
          return (
            <motion.button
              type="button"
              key={preset}
              aria-pressed={selected}
              whileTap={{ scale: 0.95 }}
              onClick={() => change(preset)}
              className={`min-h-11 min-w-12 rounded-full px-3 py-2 text-sm font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-foreground-strong ${
                selected ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
              }`}
            >
              {preset}m
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {burst > 0 && (
          <motion.div
            key={burst}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-30"
          >
            <ConfettiBurst pieceCount={48} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
