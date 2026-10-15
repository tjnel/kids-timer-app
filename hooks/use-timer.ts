"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type IntervalType = "30sec" | "1min"

interface UseTimerOptions {
  initialMinutes: number
  intervalType: IntervalType
  onIntervalComplete?: (completedIntervals: number) => void
  onTimerComplete?: () => void
}

type Phase =
  | { kind: "idle" }
  | { kind: "running"; remainingAtStart: number; startedAt: number }
  | { kind: "paused"; remaining: number }
  | { kind: "done" }

const UI_TICK_MS = 50

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

/**
 * Elapsed-time timer. Everything the UI needs is derived from the current
 * phase and the clock, so a backgrounded tab catches up correctly on return.
 */
export function useTimer({
  initialMinutes,
  intervalType,
  onIntervalComplete,
  onTimerComplete,
}: UseTimerOptions) {
  const intervalDuration = intervalSeconds(intervalType)
  const configuredTotal = initialMinutes * 60
  const totalIntervals = intervalsFor(initialMinutes, intervalType)

  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const [now, setNow] = useState(0)

  const callbacks = useRef({ onIntervalComplete, onTimerComplete })
  useEffect(() => {
    callbacks.current = { onIntervalComplete, onTimerComplete }
  })

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
  const currentIntervalProgress =
    phase.kind === "done" ? 1 : Math.min(1, (elapsed % intervalDuration) / intervalDuration)
  const isRunning = phase.kind === "running"

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

  const announcedIntervals = useRef(0)
  useEffect(() => {
    if (completedIntervals > announcedIntervals.current) {
      announcedIntervals.current = completedIntervals
      callbacks.current.onIntervalComplete?.(completedIntervals)
    } else if (completedIntervals < announcedIntervals.current) {
      announcedIntervals.current = completedIntervals
    }
  }, [completedIntervals])

  const announcedDone = useRef(false)
  useEffect(() => {
    if (phase.kind === "done" && !announcedDone.current) {
      announcedDone.current = true
      callbacks.current.onTimerComplete?.()
    } else if (phase.kind !== "done") {
      announcedDone.current = false
    }
  }, [phase.kind])

  const start = useCallback(() => {
    const startedAt = performance.now()
    setNow(startedAt)
    setPhase((current) => ({
      kind: "running",
      remainingAtStart: current.kind === "paused" ? current.remaining : configuredTotal,
      startedAt,
    }))
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

  const displaySeconds = Math.max(0, Math.ceil(remaining))

  return {
    minutes: Math.floor(displaySeconds / 60),
    seconds: displaySeconds % 60,
    totalSeconds: displaySeconds,
    isRunning,
    isDone: phase.kind === "done",
    completedIntervals,
    totalIntervals,
    currentIntervalProgress,
    start,
    pause,
    reset,
  }
}
