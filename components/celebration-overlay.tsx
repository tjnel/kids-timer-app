"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ConfettiBurst } from "./confetti-burst"
import { THEMES, type ThemeType } from "./theme"
import { FinishFlag, Mouse, MouseHole, RaceCar } from "./timer-icons"

export function CelebrationOverlay({ theme, onClose }: { theme: ThemeType; onClose: () => void }) {
  const reduceMotion = useReducedMotion()
  const { doneTitle, doneBody } = THEMES[theme]

  // The dialog has one focusable control, so trapping focus means keeping Tab on it.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
    } else if (event.key === "Tab") {
      event.preventDefault()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-foreground-strong/60 p-4"
      onClick={onClose}
    >
      <ConfettiBurst pieceCount={80} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        onKeyDown={handleKeyDown}
        initial={{ scale: 0.7, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.45 }}
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-[1.75rem] bg-card p-6 text-center text-card-foreground shadow-2xl sm:p-8 short:p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, -10, 0] }}
          transition={{ type: "tween", duration: 0.8, repeat: reduceMotion ? 0 : 3, ease: "easeOut" }}
          className="relative mx-auto mb-5 size-28 sm:size-32 short:mb-2 short:size-20"
        >
          {theme === "mouse" ? (
            <>
              <Mouse className="size-full" />
              <div className="absolute -top-1 -right-1 size-12 short:size-9">
                <MouseHole className="size-full" arrived />
              </div>
            </>
          ) : (
            <>
              <RaceCar className="size-full" />
              <div className="absolute -top-1 -right-1 size-12 short:size-9">
                <FinishFlag className="size-full" />
              </div>
            </>
          )}
        </motion.div>

        <h2 id="celebration-title" className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl short:mb-1 short:text-2xl">
          {doneTitle}
        </h2>
        <p className="mb-6 text-base text-muted-foreground short:mb-3">{doneBody}</p>
        <button
          type="button"
          data-testid="play-again"
          autoFocus
          onClick={onClose}
          className="min-h-12 rounded-full bg-primary px-8 py-3 text-lg font-bold text-primary-foreground shadow-[0_4px_0_rgba(46,26,8,0.3)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong"
        >
          Play Again
        </button>
      </motion.div>
    </motion.div>
  )
}
