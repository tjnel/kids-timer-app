"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseHoldPressOptions {
  /** How long a press must be held before `onHold` fires. */
  holdMs: number
  /** When false a press is still tracked (so `onTap` works) but no hold is timed. */
  armed?: boolean
  /** When true the control ignores presses entirely. */
  disabled?: boolean
  /** Vibration pattern played when the hold completes. */
  vibration: number | number[]
  onHold: () => void
  /** Fires at the start of every press, inside the gesture. */
  onPressStart?: () => void
  /** Fires when a press is released on the control without the hold having completed. */
  onTap?: () => void
}

/**
 * Press-and-hold for one pointer. The first finger down owns the press until
 * it lifts; other fingers are ignored. Returns the hold progress (0..1) for a
 * ring and the pointer handlers to spread on the button.
 */
export function useHoldPress({
  holdMs,
  armed = true,
  disabled = false,
  vibration,
  onHold,
  onPressStart,
  onTap,
}: UseHoldPressOptions) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(0)
  const firedRef = useRef(false)
  const activePointerRef = useRef<number | null>(null)

  const cancel = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current)
    setProgress(0)
  }, [])

  // A hold in flight ends when the control stops being holdable or unmounts.
  useEffect(() => cancel, [cancel, armed, disabled])

  const begin = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.button !== 0 || activePointerRef.current !== null) return
    activePointerRef.current = event.pointerId
    onPressStart?.()
    if (!armed) return
    firedRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    const startedAt = performance.now()
    const step = (now: number) => {
      const next = Math.min(1, (now - startedAt) / holdMs)
      setProgress(next)
      if (next >= 1) {
        firedRef.current = true
        if ("vibrate" in navigator) navigator.vibrate(vibration)
        onHold()
        cancel()
        return
      }
      rafRef.current = window.requestAnimationFrame(step)
    }
    rafRef.current = window.requestAnimationFrame(step)
  }

  const end = (event: React.PointerEvent<HTMLButtonElement>, released: boolean) => {
    if (event.pointerId !== activePointerRef.current) return
    activePointerRef.current = null
    const fired = firedRef.current
    firedRef.current = false
    cancel()
    if (released && !fired) onTap?.()
  }

  return {
    progress,
    handlers: {
      onPointerDown: begin,
      onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => end(event, true),
      onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => end(event, false),
      onLostPointerCapture: (event: React.PointerEvent<HTMLButtonElement>) => end(event, false),
      onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
    },
  }
}
