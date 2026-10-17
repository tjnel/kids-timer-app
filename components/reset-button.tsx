"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"

const HOLD_MS = 1500
const RING_RADIUS = 46
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/** Hold to put the current run back to its full time. A tap does nothing. */
export function ResetButton({ onReset }: { onReset: () => void }) {
  const [holdProgress, setHoldProgress] = useState(0)
  const rafRef = useRef(0)
  const holdFiredRef = useRef(false)

  const cancelHold = useCallback(() => {
    window.cancelAnimationFrame(rafRef.current)
    setHoldProgress(0)
  }, [])

  useEffect(() => cancelHold, [cancelHold])

  const beginHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    holdFiredRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    const startedAt = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / HOLD_MS)
      setHoldProgress(progress)
      if (progress >= 1) {
        holdFiredRef.current = true
        if ("vibrate" in navigator) navigator.vibrate([40, 30, 40])
        onReset()
        cancelHold()
        return
      }
      rafRef.current = window.requestAnimationFrame(step)
    }
    rafRef.current = window.requestAnimationFrame(step)
  }

  const endPress = () => {
    holdFiredRef.current = false
    cancelHold()
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) return
    onReset()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="Hold to reset"
        onPointerDown={beginHold}
        onPointerUp={endPress}
        onPointerCancel={cancelHold}
        onLostPointerCapture={cancelHold}
        onContextMenu={(event) => event.preventDefault()}
        onClick={handleClick}
        className="relative flex size-14 items-center justify-center rounded-full bg-card text-card-foreground shadow-[0_4px_0_rgba(46,26,8,0.28)] select-none touch-none focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong active:translate-y-0.5 active:shadow-[0_2px_0_rgba(46,26,8,0.28)] sm:size-16"
      >
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - holdProgress)}
            opacity={holdProgress > 0 ? 1 : 0}
          />
        </svg>
        <RotateCcw className="size-6 sm:size-7" strokeWidth={2.5} />
      </button>
      <p className="text-base font-semibold text-foreground-strong short:sr-only">Hold to reset</p>
    </div>
  )
}
