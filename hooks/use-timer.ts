"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseTimerOptions {
  initialMinutes: number
  initialSeconds?: number
  intervalType: "30sec" | "1min"
  onIntervalComplete?: (completedIntervals: number) => void
  onTimerComplete?: () => void
}

function toTotal(minutes: number, seconds: number) {
  return minutes * 60 + seconds
}

export function useTimer({
  initialMinutes,
  initialSeconds = 0,
  intervalType,
  onIntervalComplete,
  onTimerComplete,
}: UseTimerOptions) {
  const intervalDuration = intervalType === "1min" ? 60 : 30
  const configuredTotal = toTotal(initialMinutes, initialSeconds)
  const totalIntervals = Math.max(1, Math.ceil(configuredTotal / intervalDuration))

  const [displaySeconds, setDisplaySeconds] = useState(Math.ceil(configuredTotal))
  const [visualRemaining, setVisualRemaining] = useState(configuredTotal)
  const [isRunning, setIsRunning] = useState(false)
  const [completedIntervals, setCompletedIntervals] = useState(0)

  const visualRemainingRef = useRef(configuredTotal)
  const remainingAtStartRef = useRef(configuredTotal)
  const runStartedAtRef = useRef(0)
  const lastIntervalCheck = useRef(0)
  const lastDisplayedSecond = useRef(Math.ceil(configuredTotal))
  const completedRef = useRef(false)
  const isRunningRef = useRef(false)
  const initialTotalRef = useRef(configuredTotal)
  const onIntervalCompleteRef = useRef(onIntervalComplete)
  const onTimerCompleteRef = useRef(onTimerComplete)

  onIntervalCompleteRef.current = onIntervalComplete
  onTimerCompleteRef.current = onTimerComplete
  isRunningRef.current = isRunning

  useEffect(() => {
    initialTotalRef.current = toTotal(initialMinutes, initialSeconds)
  }, [initialMinutes, initialSeconds])

  const applyRemaining = useCallback((remaining: number) => {
    visualRemainingRef.current = remaining
    setVisualRemaining(remaining)
    const display = Math.max(0, Math.ceil(remaining))
    if (display !== lastDisplayedSecond.current) {
      lastDisplayedSecond.current = display
      setDisplaySeconds(display)
    }
  }, [])

  const restoreConfigured = useCallback(() => {
    const total = toTotal(initialMinutes, initialSeconds)
    completedRef.current = false
    lastIntervalCheck.current = 0
    lastDisplayedSecond.current = Math.ceil(total)
    visualRemainingRef.current = total
    remainingAtStartRef.current = total
    setVisualRemaining(total)
    setDisplaySeconds(Math.ceil(total))
    setCompletedIntervals(0)
    setIsRunning(false)
  }, [initialMinutes, initialSeconds])

  const configKey = `${initialMinutes}:${initialSeconds}:${intervalType}`
  const prevConfigKeyRef = useRef(configKey)

  useEffect(() => {
    if (prevConfigKeyRef.current === configKey) return
    prevConfigKeyRef.current = configKey
    if (isRunningRef.current) return
    restoreConfigured()
  }, [configKey, restoreConfigured])

  const start = useCallback(() => {
    if (visualRemainingRef.current <= 0) {
      restoreConfigured()
    }
    completedRef.current = false
    remainingAtStartRef.current = visualRemainingRef.current
    runStartedAtRef.current = performance.now()
    setIsRunning(true)
  }, [restoreConfigured])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const toggle = useCallback(() => {
    setIsRunning((prev) => {
      if (prev) return false
      if (visualRemainingRef.current <= 0) return false
      remainingAtStartRef.current = visualRemainingRef.current
      runStartedAtRef.current = performance.now()
      completedRef.current = false
      return true
    })
  }, [])

  const reset = useCallback(() => {
    restoreConfigured()
  }, [restoreConfigured])

  const setTime = useCallback((newMinutes: number, newSeconds: number = 0) => {
    const total = toTotal(newMinutes, newSeconds)
    completedRef.current = false
    lastIntervalCheck.current = 0
    lastDisplayedSecond.current = Math.ceil(total)
    visualRemainingRef.current = total
    remainingAtStartRef.current = total
    initialTotalRef.current = total
    setIsRunning(false)
    setVisualRemaining(total)
    setDisplaySeconds(Math.ceil(total))
    setCompletedIntervals(0)
  }, [])

  useEffect(() => {
    if (!isRunning) return

    remainingAtStartRef.current = visualRemainingRef.current
    runStartedAtRef.current = performance.now()

    let raf = 0
    let lastUi = 0

    const tick = (now: number) => {
      const elapsed = (now - runStartedAtRef.current) / 1000
      const remaining = Math.max(0, remainingAtStartRef.current - elapsed)
      const initial = initialTotalRef.current
      const elapsedTotal = Math.max(0, initial - remaining)
      const done = Math.min(Math.floor(elapsedTotal / intervalDuration), Math.ceil(initial / intervalDuration))

      if (done > lastIntervalCheck.current) {
        lastIntervalCheck.current = done
        setCompletedIntervals(done)
        onIntervalCompleteRef.current?.(done)
      }

      if (now - lastUi >= 50 || remaining <= 0) {
        lastUi = now
        applyRemaining(remaining)
      }

      if (remaining <= 0) {
        applyRemaining(0)
        setCompletedIntervals(Math.ceil(initial / intervalDuration))
        setIsRunning(false)
        if (!completedRef.current) {
          completedRef.current = true
          onTimerCompleteRef.current?.()
        }
        return
      }

      raf = window.requestAnimationFrame(tick)
    }

    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [isRunning, intervalDuration, applyRemaining])

  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  const elapsedTotal = Math.max(0, initialTotalRef.current - visualRemaining)
  const elapsedInCurrent = elapsedTotal % intervalDuration
  const currentIntervalProgress =
    visualRemaining <= 0 ? 1 : Math.min(1, elapsedInCurrent / intervalDuration)

  return {
    minutes,
    seconds,
    totalSeconds: displaySeconds,
    visualRemaining,
    isRunning,
    completedIntervals,
    totalIntervals,
    currentIntervalProgress,
    start,
    pause,
    toggle,
    reset,
    setTime,
  }
}
