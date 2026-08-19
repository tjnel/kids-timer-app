"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"

interface TimerControlsProps {
  isRunning: boolean
  onPlayPause: () => void
  onReset: () => void
  onBack?: () => void
  showBack?: boolean
}

function SlideToPause({ onPause }: { onPause: () => void }) {
  const [slideProgress, setSlideProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [trackWidth, setTrackWidth] = useState(180)
  const trackRef = useRef<HTMLDivElement>(null)
  const THUMB_SIZE = 48
  const TRIGGER_THRESHOLD = 0.85

  useEffect(() => {
    const mqNarrow = window.matchMedia("(max-width: 359px)")
    const mqMid = window.matchMedia("(max-width: 399px)")
    const update = () => {
      setTrackWidth(mqNarrow.matches ? 160 : mqMid.matches ? 180 : 200)
    }
    update()
    mqNarrow.addEventListener("change", update)
    mqMid.addEventListener("change", update)
    return () => {
      mqNarrow.removeEventListener("change", update)
      mqMid.removeEventListener("change", update)
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - THUMB_SIZE / 2
    const maxX = trackWidth - THUMB_SIZE
    const progress = Math.max(0, Math.min(1, x / maxX))
    setSlideProgress(progress)
    if (progress >= TRIGGER_THRESHOLD) {
      onPause()
      setSlideProgress(0)
      setIsDragging(false)
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    setSlideProgress(0)
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-sm font-medium text-muted-foreground">Slide to pause</p>
      <div
        ref={trackRef}
        className="relative h-12 overflow-hidden rounded-full bg-secondary shadow-inner sm:h-14"
        style={{ width: trackWidth }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/20"
          style={{ width: `${slideProgress * 100}%` }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-3">
          <motion.div
            className="flex items-center"
            animate={{ x: [0, 5, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="size-5 text-muted-foreground" />
            <ChevronRight className="-ml-3 size-5 text-muted-foreground" />
          </motion.div>
        </div>
        <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
          <Pause className="size-5 text-muted-foreground/50" />
        </div>
        <motion.div
          role="slider"
          aria-label="Slide to pause"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(slideProgress * 100)}
          className="absolute top-1 flex size-10 cursor-grab touch-none items-center justify-center rounded-full bg-primary shadow-lg select-none active:cursor-grabbing sm:size-12"
          style={{ left: slideProgress * (trackWidth - THUMB_SIZE) + 4 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          whileTap={{ scale: 0.95 }}
        >
          <div className="size-6 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground sm:size-8" />
        </motion.div>
      </div>
    </div>
  )
}

function LongPressReset({ onReset, isTimerRunning }: { onReset: () => void; isTimerRunning: boolean }) {
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const progressIntervalRef = useRef<number | null>(null)
  const HOLD_DURATION = 1500
  const UPDATE_INTERVAL = 30

  const cancelHold = () => {
    setIsHolding(false)
    setHoldProgress(0)
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const startHold = () => {
    setIsHolding(true)
    setHoldProgress(0)
    const startTime = Date.now()
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / HOLD_DURATION, 1)
      setHoldProgress(progress)
      if (progress >= 1) {
        onReset()
        cancelHold()
        if ("vibrate" in navigator) {
          navigator.vibrate([50, 30, 50])
        }
      }
    }, UPDATE_INTERVAL)
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        aria-label="Hold to reset"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        className="relative flex size-12 items-center justify-center overflow-hidden rounded-full bg-secondary shadow-md ring-1 ring-black/5 sm:size-14"
        whileTap={{ scale: 0.95 }}
      >
        <svg className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-secondary-foreground/20"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-destructive"
            strokeLinecap="round"
            strokeDasharray={`${holdProgress * 283} 283`}
          />
        </svg>
        <motion.div animate={isHolding ? { rotate: -360 * holdProgress } : {}} transition={{ duration: 0.1 }}>
          <RotateCcw className="relative z-10 size-5 text-secondary-foreground sm:size-6" />
        </motion.div>
        <span
          className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
          aria-hidden="true"
        />
      </motion.button>
      {isTimerRunning && (
        <p className="text-sm font-medium text-muted-foreground">Hold to reset</p>
      )}
    </div>
  )
}

function PlayButton({ onPlay }: { onPlay: () => void }) {
  return (
    <button
      type="button"
      aria-label="Play"
      onClick={onPlay}
      className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary shadow-xl ring-1 ring-primary sm:size-20"
    >
      <Play className="relative z-10 ml-1 size-8 text-primary-foreground sm:size-10" />
    </button>
  )
}

export function TimerControls({
  isRunning,
  onPlayPause,
  onReset,
  onBack,
  showBack = false,
}: TimerControlsProps) {
  return (
    <div className="flex w-full max-w-md flex-wrap items-end justify-center gap-3 sm:gap-5">
      {showBack && onBack && (
        <motion.button
          type="button"
          aria-label="Back to setup"
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="relative flex size-12 items-center justify-center rounded-full bg-secondary shadow-md ring-1 ring-black/5 sm:size-14"
        >
          <ChevronLeft className="size-6 text-secondary-foreground sm:size-7" />
          <span
            className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
            aria-hidden="true"
          />
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {isRunning ? (
          <motion.div
            key="slide-pause"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <SlideToPause onPause={onPlayPause} />
          </motion.div>
        ) : (
          <motion.div
            key="play-button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <PlayButton onPlay={onPlayPause} />
          </motion.div>
        )}
      </AnimatePresence>

      <LongPressReset onReset={onReset} isTimerRunning={isRunning} />
    </div>
  )
}
