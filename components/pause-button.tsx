"use client"

import { Pause, Play } from "lucide-react"
import { useHoldPress } from "@/hooks/use-hold-press"
import { HoldRing } from "./hold-ring"

const HOLD_MS = 600

interface PauseButtonProps {
  isRunning: boolean
  /** The run has finished: there is nothing left to pause or resume. */
  isDone: boolean
  onPause: () => void
  onPlay: () => void
  /** Fires at the start of a tap so phones can unlock sound inside the gesture. */
  onPressStart?: () => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  ref?: React.Ref<HTMLButtonElement>
}

/**
 * One round control. While running a press must be held for HOLD_MS to pause
 * (little fingers tap everything); while paused a tap resumes. Keyboard toggles.
 */
export function PauseButton({ isRunning, isDone, onPause, onPlay, onPressStart, onKeyDown, ref }: PauseButtonProps) {
  const paused = !isRunning && !isDone
  const { progress, handlers } = useHoldPress({
    holdMs: HOLD_MS,
    armed: isRunning,
    disabled: isDone,
    vibration: 40,
    onHold: onPause,
    onPressStart,
    onTap: paused ? onPlay : undefined,
  })

  // Keyboard activation (detail 0) toggles; pointer presses are resolved by the hold.
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0 || isDone) return
    onPressStart?.()
    if (isRunning) onPause()
    else onPlay()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        ref={ref}
        type="button"
        aria-label={paused ? "Play" : "Hold to pause"}
        aria-disabled={isDone || undefined}
        {...handlers}
        onKeyDown={onKeyDown}
        onClick={handleClick}
        className={`relative flex size-[4.5rem] items-center justify-center rounded-full bg-control text-control-foreground shadow-[0_6px_0_rgba(46,26,8,0.35)] select-none touch-none focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong sm:size-20 md:size-24 ${
          isDone ? "opacity-60" : "active:translate-y-0.5 active:shadow-[0_4px_0_rgba(46,26,8,0.35)]"
        }`}
      >
        <HoldRing progress={progress} color="var(--color-accent)" />
        {paused ? (
          <Play className="ml-1 size-8 fill-current sm:size-9 md:size-11" />
        ) : (
          <Pause className="size-8 fill-current sm:size-9 md:size-11" />
        )}
      </button>
      {/* Stays in the layout when the run is done so the footer does not jump. */}
      <p
        className={`text-base font-semibold whitespace-nowrap text-foreground-strong max-[22rem]:text-sm ${isDone ? "invisible" : ""}`}
      >
        {paused ? "Tap to play" : "Hold to pause"}
      </p>
    </div>
  )
}
