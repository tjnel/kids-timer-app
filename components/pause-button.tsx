"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Pause, Play } from "lucide-react"

const HOLD_MS = 600
const RING_LENGTH = 2 * Math.PI * 46

interface PauseButtonProps {
  isRunning: boolean
  onPause: () => void
  onPlay: () => void
}

/**
 * One round control. While running it needs a short hold so a tap from a small
 * hand does not stop the timer; when paused a tap resumes. Keyboard users
 * toggle directly with Enter or Space.
 */
export function PauseButton({ isRunning, onPause, onPlay }: PauseButtonProps) {
  const [holdProgress, setHoldProgress] = useState(0)
  const rafRef = useRef(0)
  const holdFiredRef = useRef(false)
  const onPauseRef = useRef(onPause)
  useEffect(() => {
    onPauseRef.current = onPause
  })

  const cancelHold = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current)
    setHoldProgress(0)
  }, [])

  useEffect(() => cancelHold, [cancelHold, isRunning])

  const beginHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isRunning) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const startedAt = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / HOLD_MS)
      setHoldProgress(progress)
      if (progress >= 1) {
        // Swallow the click that may follow; long presses on touch often emit none.
        holdFiredRef.current = true
        window.setTimeout(() => {
          holdFiredRef.current = false
        }, 400)
        if ("vibrate" in navigator) navigator.vibrate(40)
        onPauseRef.current()
        return
      }
      rafRef.current = window.requestAnimationFrame(step)
    }
    rafRef.current = window.requestAnimationFrame(step)
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // The click that follows a completed hold must not resume the timer.
    if (holdFiredRef.current) {
      holdFiredRef.current = false
      return
    }
    // detail is 0 for keyboard activation; pointer presses while running are handled by the hold.
    if (event.detail !== 0) {
      if (!isRunning) onPlay()
      return
    }
    if (isRunning) onPauseRef.current()
    else onPlay()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        aria-label={isRunning ? "Hold to pause" : "Play"}
        aria-pressed={!isRunning}
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onLostPointerCapture={cancelHold}
        onContextMenu={(event) => event.preventDefault()}
        onClick={handleClick}
        whileTap={{ scale: 0.94 }}
        className="relative flex size-[4.5rem] touch-none items-center justify-center rounded-full bg-control text-control-foreground shadow-[0_6px_0_rgba(46,26,8,0.35)] select-none focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong sm:size-20"
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${holdProgress * RING_LENGTH} ${RING_LENGTH}`}
            style={{ opacity: holdProgress > 0 ? 1 : 0 }}
          />
        </svg>
        {isRunning ? (
          <Pause className="relative size-8 fill-current sm:size-9" />
        ) : (
          <Play className="relative ml-1 size-8 fill-current sm:size-9" />
        )}
      </motion.button>
      <p className="text-sm font-semibold text-foreground-strong">
        {isRunning ? "Hold to pause" : "Tap to play"}
      </p>
    </div>
  )
}
