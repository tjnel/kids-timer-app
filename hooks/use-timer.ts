"use client"

import { useCallback, useEffect, useState } from "react"

export type IntervalType = "30sec" | "1min"
export type TimerStatus = Phase["kind"]

interface UseTimerOptions {
  initialMinutes: number
  intervalType: IntervalType
}

type Phase =
  | { kind: "idle" }
  | { kind: "running"; remainingAtStart: number; startedAt: number }
  | { kind: "paused"; remaining: number }
  | { kind: "done" }

const UI_TICK_MS = 50
export const MAX_MINUTES = 15

type RunningPhase = Extract<Phase, { kind: "running" }>

/** Frame timestamps can trail performance.now(), so never exceed the start value. */
function clampRemaining(phase: RunningPhase, now: number) {
  const left = phase.remainingAtStart - (now - phase.startedAt) / 1000
  return Math.max(0, Math.min(phase.remainingAtStart, left))
}

export function intervalSeconds(intervalType: IntervalType) {
  return intervalType === "1min" ? 60 : 30
}

export function intervalsFor(minutes: number, intervalType: IntervalType) {
  return Math.max(1, Math.ceil((minutes * 60) / intervalSeconds(intervalType)))
}

/** The one policy for valid timer lengths: whole intervals, at least one, at most MAX_MINUTES. */
export function snapMinutes(raw: number, intervalType: IntervalType) {
  const step = intervalSeconds(intervalType) / 60
  if (!Number.isFinite(raw)) return step
  return Math.max(step, Math.min(MAX_MINUTES, Math.round(raw / step) * step))
}

/** "m:ss" for a number of seconds. */
export function formatClock(totalSeconds: number) {
  const whole = Math.max(0, Math.round(totalSeconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}

/**
 * Elapsed-time timer. Everything the UI needs is derived from the current
 * phase and the clock, so a backgrounded tab catches up correctly on return.
 */
export function useTimer({ initialMinutes, intervalType }: UseTimerOptions) {
  const intervalDuration = intervalSeconds(intervalType)
  const configuredTotal = initialMinutes * 60
  const totalIntervals = intervalsFor(initialMinutes, intervalType)

  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [now, setNow] = useState(0)

  const remaining = (() => {
    switch (phase.kind) {
      case "idle":
        return configuredTotal
      case "running":
        return clampRemaining(phase, now)
      case "paused":
        return phase.remaining
      case "done":
        return 0
      default: {
        const exhaustive: never = phase
        return exhaustive
      }
    }
  })()

  const elapsed = Math.max(0, configuredTotal - remaining)
  const completedIntervals =
    phase.kind === "done"
      ? totalIntervals
      : Math.min(totalIntervals, Math.floor(elapsed / intervalDuration))
  const intervalElapsedSeconds = phase.kind === "done" ? intervalDuration : elapsed % intervalDuration
  const currentIntervalProgress = Math.min(1, intervalElapsedSeconds / intervalDuration)

  useEffect(() => {
    if (phase.kind !== "running") return
    const running = phase
    let raf = 0
    let lastUi = 0
    const tick = (timestamp: number) => {
      if (clampRemaining(running, timestamp) <= 0) {
        setNow(timestamp)
        setPhase({ kind: "done" })
        return
      }
      if (timestamp - lastUi >= UI_TICK_MS) {
        lastUi = timestamp
        setNow(timestamp)
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [phase])

  /** Starts from idle or resumes from paused; a no-op while running or done. */
  const start = useCallback(() => {
    const startedAt = performance.now()
    setNow(startedAt)
    setPhase((current) => {
      if (current.kind === "running" || current.kind === "done") return current
      return {
        kind: "running",
        remainingAtStart: current.kind === "paused" ? current.remaining : configuredTotal,
        startedAt,
      }
    })
  }, [configuredTotal])

  const pause = useCallback(() => {
    setPhase((current) => {
      if (current.kind !== "running") return current
      return { kind: "paused", remaining: clampRemaining(current, performance.now()) }
    })
  }, [])

  const reset = useCallback(() => {
    setPhase({ kind: "idle" })
  }, [])

  /** Back to the full time, paused, without leaving the running screen. */
  const restart = useCallback(() => {
    setPhase({ kind: "paused", remaining: configuredTotal })
  }, [configuredTotal])

  return {
    status: phase.kind,
    remainingSeconds: Math.max(0, Math.ceil(remaining)),
    isRunning: phase.kind === "running",
    isDone: phase.kind === "done",
    completedIntervals,
    totalIntervals,
    currentIntervalProgress,
    intervalElapsedSeconds,
    start,
    pause,
    reset,
    restart,
  }
}

export type Timer = ReturnType<typeof useTimer>
