"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Volume2, VolumeX } from "lucide-react"
import { TimerGrid, CelebrationOverlay, type ThemeType } from "./timer-grid"
import { ConfettiBurst } from "./confetti-burst"
import { TimeSelector } from "./time-selector"
import { ThemeSelector } from "./theme-selector"
import { TimerControls } from "./timer-controls"
import { TimerDisplayRing } from "./timer-displays"
import { useTimer } from "@/hooks/use-timer"
import { useKidsAudio } from "@/hooks/use-kids-audio"
import { Mouse, Cheese, RaceCar, FinishFlag } from "./timer-icons"

type ViewState = "setup" | "running"

export function KidsTimer() {
  const [view, setView] = useState<ViewState>("setup")
  const [theme, setTheme] = useState<ThemeType>("mouse")
  const [selectedMinutes, setSelectedMinutes] = useState(2)
  const [intervalType, setIntervalType] = useState<"30sec" | "1min">("30sec")
  const [showCelebration, setShowCelebration] = useState(false)
  const [justCompletedInterval, setJustCompletedInterval] = useState(false)
  const [lastPieceComplete, setLastPieceComplete] = useState(false)
  const [timeUpBurst, setTimeUpBurst] = useState(0)
  const themeRef = useRef(theme)
  themeRef.current = theme
  const { getContext, playChomp, playFanfare, playTick, muted, toggleMuted } = useKidsAudio()
  const celebrationTimerRef = useRef<number | null>(null)
  const lastTickSecondRef = useRef<number | null>(null)
  const lastTimeUpBurstAt = useRef(0)

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current !== null) {
        window.clearTimeout(celebrationTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("minutes")
    if (!raw) return
    const mins = Number(raw)
    if (!Number.isFinite(mins)) return
    // The URL accepts runs as short as 6 seconds so a full run can be exercised quickly.
    const clamped = Math.max(0.1, Math.min(15, Math.round(mins * 10) / 10))
    setSelectedMinutes(clamped)
    if (clamped < 1) setIntervalType("30sec")
  }, [])

  const handleIntervalComplete = useCallback(
    (completed: number) => {
      const intervalSeconds = intervalType === "1min" ? 60 : 30
      const total = Math.max(1, Math.ceil((selectedMinutes * 60) / intervalSeconds))
      setLastPieceComplete(completed >= total)
      setJustCompletedInterval(true)
      window.setTimeout(() => {
        setJustCompletedInterval(false)
        setLastPieceComplete(false)
      }, 800)

      if ("vibrate" in navigator) {
        navigator.vibrate([50, 30, 50])
      }

      try {
        playChomp(themeRef.current)
      } catch {
        /* audio optional */
      }
    },
    [playChomp, intervalType, selectedMinutes],
  )

  const handleTimerComplete = useCallback(() => {
    if (celebrationTimerRef.current !== null) {
      window.clearTimeout(celebrationTimerRef.current)
    }
    celebrationTimerRef.current = window.setTimeout(() => {
      setShowCelebration(true)
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200, 100, 300])
      }
      try {
        playFanfare()
      } catch {
        /* audio optional */
      }
    }, 800)
  }, [playFanfare])

  const timer = useTimer({
    initialMinutes: selectedMinutes,
    intervalType,
    onIntervalComplete: handleIntervalComplete,
    onTimerComplete: handleTimerComplete,
  })

  useEffect(() => {
    if (!timer.isRunning) return
    const remaining = timer.totalSeconds
    if (remaining <= 0) return
    if (lastTickSecondRef.current === remaining) return
    lastTickSecondRef.current = remaining

    const intervalSeconds = intervalType === "1min" ? 60 : 30
    if (remaining % intervalSeconds === 0) return

    try {
      playTick(themeRef.current, remaining)
    } catch {
      /* audio optional */
    }
  }, [timer.isRunning, timer.totalSeconds, intervalType, playTick])

  const handleStart = () => {
    getContext()
    lastTickSecondRef.current = null
    timer.setTime(selectedMinutes)
    setView("running")
    timer.start()
  }

  const handleBack = () => {
    if (celebrationTimerRef.current !== null) {
      window.clearTimeout(celebrationTimerRef.current)
      celebrationTimerRef.current = null
    }
    timer.reset()
    setView("setup")
    setShowCelebration(false)
  }

  const handleCelebrationClose = () => {
    if (celebrationTimerRef.current !== null) {
      window.clearTimeout(celebrationTimerRef.current)
      celebrationTimerRef.current = null
    }
    setShowCelebration(false)
    timer.reset()
    timer.setTime(selectedMinutes)
    setView("setup")
  }

  const handleMinutesChange = (mins: number) => {
    if (mins > selectedMinutes) {
      const now = performance.now()
      if (now - lastTimeUpBurstAt.current > 280) {
        lastTimeUpBurstAt.current = now
        setTimeUpBurst((key) => key + 1)
      }
    }
    setSelectedMinutes(mins)
    timer.setTime(mins)
  }

  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null

    const request = async () => {
      if (!timer.isRunning || !("wakeLock" in navigator)) return
      try {
        sentinel = await navigator.wakeLock.request("screen")
      } catch {
        /* ignore */
      }
    }

    void request()
    const onVis = () => {
      if (document.visibilityState === "visible") void request()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      document.removeEventListener("visibilitychange", onVis)
      void sentinel?.release()
    }
  }, [timer.isRunning])

  const initialTotalSeconds = selectedMinutes * 60
  const progressPct =
    ((timer.completedIntervals + (timer.isRunning || timer.visualRemaining < initialTotalSeconds ? timer.currentIntervalProgress : 0)) /
      Math.max(1, timer.totalIntervals)) *
    100

  return (
    <div className="theme-mint isolate flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center justify-between px-3 py-2 sm:p-4">
        <motion.div
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2"
        >
          {theme === "mouse" ? (
            <Mouse className="size-8 sm:size-9" isMoving={false} isEating={false} playing={false} />
          ) : (
            <RaceCar className="h-6 w-10 sm:h-7 sm:w-12" isMoving={false} playing={false} />
          )}
          <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {theme === "mouse" ? "Mouse Timer" : "Race Timer"}
          </h1>
        </motion.div>
        <button
          type="button"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          aria-pressed={muted}
          onClick={toggleMuted}
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-md ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          <span
            className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
            aria-hidden="true"
          />
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2 sm:p-4">
        <AnimatePresence mode="wait">
          {view === "setup" ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-start gap-3 sm:justify-center sm:gap-6"
            >
              <ThemeSelector theme={theme} onThemeChange={setTheme} />

              <TimeSelector
                minutes={selectedMinutes}
                seconds={0}
                onMinutesChange={handleMinutesChange}
                intervalType={intervalType}
                onIntervalTypeChange={setIntervalType}
              />

              <div className="w-full rounded-[1.75rem] bg-card/70 p-2 ring-1 ring-black/5 sm:p-3">
                <p className="mb-1 text-center text-base text-muted-foreground sm:text-sm">
                  {theme === "mouse" ? "The mouse eats cheese, then runs home." : "The car passes a cone each interval."}
                </p>
                <TimerGrid
                  totalIntervals={Math.ceil((selectedMinutes * 60) / (intervalType === "1min" ? 60 : 30))}
                  completedIntervals={0}
                  theme={theme}
                  isRunning={false}
                  intervalType={intervalType}
                  currentIntervalProgress={0}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="mx-auto flex min-h-full w-full max-w-lg flex-col items-center justify-center gap-3 sm:gap-4"
            >
              <TimerGrid
                totalIntervals={timer.totalIntervals}
                completedIntervals={timer.completedIntervals}
                theme={theme}
                isRunning={timer.isRunning}
                intervalType={intervalType}
                currentIntervalProgress={timer.currentIntervalProgress}
              />

              <TimerDisplayRing
                minutes={timer.minutes}
                seconds={timer.seconds}
                totalSeconds={timer.visualRemaining}
                initialTotal={initialTotalSeconds}
              />

              <div className="w-full max-w-md px-3">
                <div className="h-2 overflow-hidden rounded-full bg-muted sm:h-2.5">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                    transition={{ duration: 0.08, ease: "linear" }}
                  />
                </div>
                <p className="mt-2 text-center text-base text-muted-foreground sm:text-sm">
                  {timer.completedIntervals} of {timer.totalIntervals} pieces
                </p>
              </div>

              <TimerControls
                isRunning={timer.isRunning}
                onPlayPause={timer.toggle}
                onReset={timer.reset}
                onBack={handleBack}
                showBack={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {view === "setup" ? (
        <div className="flex shrink-0 justify-center bg-background/90 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <motion.button
            type="button"
            aria-label="Start timer"
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
            className="relative flex min-h-12 items-center gap-2 rounded-full bg-primary py-3 pr-6 pl-7 text-lg font-semibold text-primary-foreground shadow-lg ring-1 ring-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:text-xl"
          >
            Start
            {theme === "mouse" ? (
              <Cheese className="size-7 sm:size-8" />
            ) : (
              <FinishFlag className="size-7 sm:size-8" />
            )}
            <span
              className="pointer-fine:hidden absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2"
              aria-hidden="true"
            />
          </motion.button>
        </div>
      ) : (
        <footer className="shrink-0 px-3 py-2 text-center sm:p-3">
          <p className="text-base text-muted-foreground sm:text-sm">
            {theme === "mouse"
              ? "Listen for the ticks. Watch the mouse nibble, then run home."
              : "Listen for the ticks. Watch the car race."}
          </p>
        </footer>
      )}

      <AnimatePresence>
        {justCompletedInterval && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, type: "tween" }}
            className="pointer-events-none fixed inset-0 z-40"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.22, 0] }}
              transition={{ duration: 0.45, type: "tween" }}
              className="absolute inset-0"
              style={{
                background:
                  theme === "mouse"
                    ? "radial-gradient(circle at center, rgba(255,217,61,0.45) 0%, transparent 70%)"
                    : "radial-gradient(circle at center, rgba(255,107,0,0.4) 0%, transparent 70%)",
              }}
            />
            {lastPieceComplete && <ConfettiBurst pieceCount={72} />}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {timeUpBurst > 0 && view === "setup" && (
          <motion.div
            key={timeUpBurst}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-30"
          >
            <ConfettiBurst pieceCount={64} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay theme={theme} onClose={handleCelebrationClose} />
        )}
      </AnimatePresence>
    </div>
  )
}
