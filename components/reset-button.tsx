"use client"

import { RotateCcw } from "lucide-react"
import { useHoldPress } from "@/hooks/use-hold-press"
import { HoldRing } from "./hold-ring"

const HOLD_MS = 1500

/** Hold to put the current run back to its full time. A tap does nothing. */
export function ResetButton({ onReset }: { onReset: () => void }) {
  const { progress, handlers } = useHoldPress({
    holdMs: HOLD_MS,
    vibration: [40, 30, 40],
    onHold: onReset,
  })

  // Keyboard activation (detail 0) resets at once; pointer presses must hold.
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) return
    onReset()
  }

  return (
    <div className="flex flex-col items-center gap-2 short:gap-1">
      <button
        type="button"
        aria-label="Hold to reset"
        {...handlers}
        onClick={handleClick}
        className="relative flex size-14 items-center justify-center rounded-full bg-card text-card-foreground shadow-[0_4px_0_rgba(46,26,8,0.28)] select-none touch-none focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong active:translate-y-0.5 active:shadow-[0_2px_0_rgba(46,26,8,0.28)] sm:size-16"
      >
        <HoldRing progress={progress} color="var(--color-primary)" />
        <RotateCcw className="size-6 sm:size-7" strokeWidth={2.5} />
      </button>
      {/* A size down on the narrowest phones, where the full-size label runs off the edge. */}
      <p className="text-base font-semibold whitespace-nowrap text-foreground-strong max-[22rem]:text-sm">Hold to reset</p>
    </div>
  )
}
