"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, m } from "framer-motion"
import { formatClock, intervalSeconds, intervalsFor, MAX_MINUTES, snapMinutes, type IntervalType } from "@/hooks/use-timer"
import { ConfettiBurst } from "./confetti-burst"

interface TimeSelectorProps {
  minutes: number
  onMinutesChange: (minutes: number) => void
  intervalType: IntervalType
  /** What one grid piece is called: "piece"/"pieces", "cone"/"cones". */
  unit: { singular: string; plural: string }
}

const PRESETS = [1, 2, 3, 5, 10, 15]
const LABELLED_TICKS = new Set([5, 10, MAX_MINUTES])
const BURST_THROTTLE_MS = 280
/** Just past the slowest confetti piece (2.25 s fall + 0.36 s delay). */
const BURST_LIFETIME_MS = 2800
const PAGE_STEPS = 5

function clockForMinutes(mins: number) {
  return formatClock(mins * 60)
}

function tickLabel(mins: number) {
  return mins < 1 ? `${Math.round(mins * 60)}s` : `${mins}m`
}

function tickLeft(value: number, minMinutes: number) {
  return ((value - minMinutes) / (MAX_MINUTES - minMinutes)) * 100
}

export function TimeSelector({ minutes, onMinutesChange, intervalType, unit }: TimeSelectorProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [burst, setBurst] = useState(0)
  const lastBurstAt = useRef(0)

  // Take the confetti out of the page once it has fallen.
  useEffect(() => {
    if (burst === 0) return
    const id = window.setTimeout(() => setBurst(0), BURST_LIFETIME_MS)
    return () => window.clearTimeout(id)
  }, [burst])
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
    const targets: Record<string, number> = {
      ArrowRight: minutes + step,
      ArrowUp: minutes + step,
      ArrowLeft: minutes - step,
      ArrowDown: minutes - step,
      PageUp: minutes + step * PAGE_STEPS,
      PageDown: minutes - step * PAGE_STEPS,
      Home: minMinutes,
      End: MAX_MINUTES,
    }
    const target = targets[event.key]
    if (target === undefined) return
    event.preventDefault()
    change(target)
  }

  const ticks: number[] = []
  for (let value = Math.ceil(minMinutes); value <= MAX_MINUTES; value += 1) ticks.push(value)
  const firstTick = ticks[0] ?? MAX_MINUTES

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-3 sm:gap-4 compact:gap-2 short:gap-1">
      <div className="text-center">
        <p className="text-5xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-6xl sm:compact:text-5xl short:text-4xl">
          {clockForMinutes(minutes)}
        </p>
        <p className="mt-0.5 text-base font-semibold text-foreground-strong">
          {pieces} {pieces === 1 ? unit.singular : unit.plural}
        </p>
      </div>

      <div className="w-full max-w-md min-w-0 px-3">
        <div
          ref={sliderRef}
          role="slider"
          tabIndex={0}
          aria-label="Minutes"
          // A `?minutes=` length can sit below one piece; the range still has to contain it.
          aria-valuemin={Math.min(minMinutes, minutes)}
          aria-valuemax={MAX_MINUTES}
          aria-valuenow={minutes}
          aria-valuetext={clockForMinutes(minutes)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={handleKeyDown}
          className="relative h-12 cursor-pointer touch-none rounded-full select-none focus-visible:outline-4 focus-visible:outline-offset-0 focus-visible:outline-foreground-strong sm:h-14"
        >
          <div className="absolute top-1/2 right-0 left-0 h-3 -translate-y-1/2 rounded-full bg-track" />
          <m.div
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
          <m.div
            className="absolute top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-[0_3px_0_rgba(46,26,8,0.35)]"
            initial={false}
            animate={{ left: `${position * 100}%` }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            aria-hidden="true"
          >
            {minutes < 1 ? tickLabel(minutes) : Math.floor(minutes)}
          </m.div>
        </div>
        <div aria-hidden="true" className="relative h-5">
          {ticks
            .filter((value) => value === firstTick || LABELLED_TICKS.has(value))
            .map((value) => (
              <p
                key={value}
                className="absolute -translate-x-1/2 text-sm font-bold whitespace-nowrap text-foreground-strong"
                style={{ left: `${tickLeft(value, minMinutes)}%` }}
              >
                {tickLabel(value)}
              </p>
            ))}
        </div>
      </div>

      {/* Six chips need 318px for one row; in anything narrower they wrap as two balanced rows of three. */}
      <div className="@container flex w-full flex-wrap justify-center gap-1.5 sm:gap-2">
        {PRESETS.map((preset) => {
          const selected = minutes === preset
          return (
            <m.button
              type="button"
              key={preset}
              aria-pressed={selected}
              whileTap={{ scale: 0.95 }}
              onClick={() => change(preset)}
              className={`min-h-12 min-w-12 rounded-full px-1.5 py-2 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-foreground-strong @max-[19.8rem]:basis-[calc(33.333%-4px)] sm:min-h-11 sm:px-2 md:min-w-14 md:px-3 ${
                selected ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground"
              }`}
            >
              {preset}m
            </m.button>
          )
        })}
      </div>

      <AnimatePresence>
        {burst > 0 && (
          <m.div
            key={burst}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-30"
          >
            <ConfettiBurst pieceCount={48} />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
