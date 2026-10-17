"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"

const HOLD_MS = 600
const RING_RADIUS = 46
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

interface PauseButtonProps {
  isRunning: boolean
  onPause: () => void
  onPlay: () => void
  /** Fires at the start of a tap so phones can unlock sound inside the gesture. */
  onPressStart?: () => void
}

/**
 * One round control. While running a press must be held for HOLD_MS to pause
 * (little fingers tap everything); while paused a tap resumes. Keyboard toggles.
 */
export function PauseButton({ isRunning, onPause, onPlay, onPressStart }: PauseButtonProps) {
  const [holdProgress, setHoldProgress] = useState(0)
  const rafRef = useRef(0)
  const holdFiredRef = useRef(false)

  const cancelHold = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current)
    setHoldProgress(0)
  }, [])

  useEffect(() => cancelHold, [cancelHold, isRunning])

  const beginHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    onPressStart?.()
    if (!isRunning || event.button !== 0) return
    holdFiredRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    const startedAt = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / HOLD_MS)
      setHoldProgress(progress)
      if (progress >= 1) {
        holdFiredRef.current = true
        if ("vibrate" in navigator) navigator.vibrate(40)
        onPause()
        return
      }
      rafRef.current = window.requestAnimationFrame(step)
    }
    rafRef.current = window.requestAnimationFrame(step)
  }

  // Pointer presses resolve here: a completed hold already paused, anything
  // else while paused resumes. Quick taps while running do nothing.
  const endPress = () => {
    const fired = holdFiredRef.current
    holdFiredRef.current = false
    cancelHold()
    if (!fired && !isRunning) onPlay()
  }

  // Keyboard activation (detail 0) toggles; pointer clicks were handled above.
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) return
    if (isRunning) onPause()
    else onPlay()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label={isRunning ? "Hold to pause" : "Play"}
        aria-pressed={!isRunning}
        onPointerDown={beginHold}
        onPointerUp={endPress}
        onPointerCancel={cancelHold}
        onLostPointerCapture={cancelHold}
        onContextMenu={(event) => event.preventDefault()}
        onClick={handleClick}
        className="relative flex size-[4.5rem] items-center justify-center rounded-full bg-control text-control-foreground shadow-[0_6px_0_rgba(46,26,8,0.35)] select-none touch-none focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong active:translate-y-0.5 active:shadow-[0_4px_0_rgba(46,26,8,0.35)] sm:size-20 md:size-24"
      >
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - holdProgress)}
            opacity={holdProgress > 0 ? 1 : 0}
          />
        </svg>
        {isRunning ? (
          <Pause className="size-8 fill-current sm:size-9 md:size-11" />
        ) : (
          <Play className="ml-1 size-8 fill-current sm:size-9 md:size-11" />
        )}
      </button>
      <p className="text-base font-semibold text-foreground-strong">{isRunning ? "Hold to pause" : "Tap to play"}</p>
    </div>
  )
}
