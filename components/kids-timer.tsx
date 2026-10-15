"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Volume2, VolumeX } from "lucide-react"
import { useKidsAudio } from "@/hooks/use-kids-audio"
import { intervalSeconds, intervalsFor, type IntervalType, useTimer } from "@/hooks/use-timer"
import { CelebrationOverlay } from "./celebration-overlay"
import { ConfettiBurst } from "./confetti-burst"
import { PauseButton } from "./pause-button"
import { ThemeSelector } from "./theme-selector"
import { TimeSelector } from "./time-selector"
import { TimerGrid, type ThemeType } from "./timer-grid"
import { Cheese, FinishFlag, Mouse, RaceCar } from "./timer-icons"

type ViewState = "setup" | "running"

const DEFAULT_MINUTES = 2
const CELEBRATION_DELAY_MS = 800
const FLASH_MS = 800

const COPY = {
  mouse: {
    title: "Mouse Timer",
    hint: "The mouse eats cheese, then runs home.",
  },
  racecar: {
    title: "Race Timer",
    hint: "The car passes a cone each interval.",
  },
} as const

// `?minutes=` lets a parent bookmark a length. It accepts runs as short as six
// seconds so a complete run can be exercised quickly.
function subscribeToNothing() {
  return () => {}
}
function readUrlMinutes(): number | null {
  const raw = new URLSearchParams(window.location.search).get("minutes")
  if (!raw) return null
  const mins = Number(raw)
  if (!Number.isFinite(mins)) return null
  return Math.max(0.1, Math.min(15, Math.round(mins * 10) / 10))
}
function serverUrlMinutes() {
  return null
}

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full text-foreground-strong hover:bg-foreground/10 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-foreground-strong active:bg-foreground/15"
    >
      {children}
    </button>
  )
}

export function KidsTimer() {
  const [view, setView] = useState<ViewState>("setup")
  const [theme, setTheme] = useState<ThemeType>("mouse")
  const urlMinutes = useSyncExternalStore(subscribeToNothing, readUrlMinutes, serverUrlMinutes)
  const [chosenMinutes, setChosenMinutes] = useState<number | null>(null)
  const selectedMinutes = chosenMinutes ?? urlMinutes ?? DEFAULT_MINUTES
  const [intervalType, setIntervalType] = useState<IntervalType>("30sec")
  const [showCelebration, setShowCelebration] = useState(false)
  const [flash, setFlash] = useState<{ key: number; confetti: boolean } | null>(null)
  const [timeUpBurst, setTimeUpBurst] = useState(0)

  const { getContext, playChomp, playFanfare, playTick, muted, toggleMuted } = useKidsAudio()
  const celebrationTimer = useRef<number | null>(null)
  const flashTimer = useRef<number | null>(null)
  const lastTickSecond = useRef<number | null>(null)
  const lastTimeUpBurstAt = useRef(0)

  useEffect(() => {
    return () => {
      if (celebrationTimer.current !== null) window.clearTimeout(celebrationTimer.current)
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
    }
  }, [])

  const handleIntervalComplete = useCallback(
    (completed: number) => {
      const total = intervalsFor(selectedMinutes, intervalType)
      setFlash({ key: completed, confetti: completed >= total })
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current)
      flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS)
      if ("vibrate" in navigator) navigator.vibrate([50, 30, 50])
      try {
        playChomp(theme)
      } catch {
        /* audio optional */
      }
    },
    [playChomp, intervalType, selectedMinutes, theme],
  )

  const handleTimerComplete = useCallback(() => {
    if (celebrationTimer.current !== null) window.clearTimeout(celebrationTimer.current)
    celebrationTimer.current = window.setTimeout(() => {
      setShowCelebration(true)
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 200, 100, 300])
      try {
        playFanfare()
      } catch {
        /* audio optional */
      }
    }, CELEBRATION_DELAY_MS)
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
    if (remaining <= 0 || lastTickSecond.current === remaining) return
    lastTickSecond.current = remaining
    if (remaining % intervalSeconds(intervalType) === 0) return
    try {
      playTick(theme, remaining)
    } catch {
      /* audio optional */
    }
  }, [timer.isRunning, timer.totalSeconds, intervalType, theme, playTick])

  useEffect(() => {
    if (!timer.isRunning || !("wakeLock" in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen")
      } catch {
        /* wake lock optional */
      }
    }
    void request()
    const onVisible = () => {
      if (document.visibilityState === "visible") void request()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      void sentinel?.release()
    }
  }, [timer.isRunning])

  const handleStart = () => {
    getContext()
    lastTickSecond.current = null
    setView("running")
    timer.start()
  }

  const goToSetup = () => {
    if (celebrationTimer.current !== null) {
      window.clearTimeout(celebrationTimer.current)
      celebrationTimer.current = null
    }
    timer.reset()
    setShowCelebration(false)
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
    setChosenMinutes(mins)
  }

  const copy = COPY[theme]
  const muteButton = (
    <IconButton label={muted ? "Unmute sounds" : "Mute sounds"} pressed={muted} onClick={toggleMuted}>
      {muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
    </IconButton>
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] text-foreground">
      <AnimatePresence mode="wait" initial={false}>
        {view === "setup" ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <header className="flex shrink-0 items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {theme === "mouse" ? (
                  <Mouse className="size-9" />
                ) : (
                  <RaceCar className="h-7 w-11" />
                )}
                <h1 className="text-xl font-extrabold tracking-tight">{copy.title}</h1>
              </div>
              {muteButton}
            </header>

            <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 pb-2">
              <div className="mx-auto my-auto flex w-full max-w-lg flex-col items-center gap-4 py-1 sm:gap-6">
                <ThemeSelector theme={theme} onThemeChange={setTheme} />
                <TimeSelector
                  minutes={selectedMinutes}
                  onMinutesChange={handleMinutesChange}
                  intervalType={intervalType}
                  onIntervalTypeChange={setIntervalType}
                />
                <div className="w-full">
                  <p className="mb-2 text-center text-base font-semibold text-foreground-strong">{copy.hint}</p>
                  <div className="h-20 w-full sm:h-24">
                    <TimerGrid
                      totalIntervals={intervalsFor(selectedMinutes, intervalType)}
                      completedIntervals={0}
                      theme={theme}
                      isRunning={false}
                      currentIntervalProgress={0}
                      maxCell={72}
                    />
                  </div>
                </div>
              </div>
            </main>

            <div className="flex shrink-0 justify-center px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <motion.button
                type="button"
                aria-label="Start timer"
                whileTap={{ scale: 0.96 }}
                onClick={handleStart}
                className="flex min-h-14 items-center gap-2 rounded-full bg-primary py-3 pr-6 pl-8 text-xl font-extrabold text-primary-foreground shadow-[0_5px_0_rgba(46,26,8,0.3)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong"
              >
                Start
                {theme === "mouse" ? <Cheese className="size-8" /> : <FinishFlag className="size-8" />}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <header className="flex shrink-0 items-center justify-between px-3 py-2 sm:px-5 sm:py-3">
              <div className="flex items-center gap-1">
                <IconButton label="Back to setup" onClick={goToSetup}>
                  <ArrowLeft className="size-7" strokeWidth={2.75} />
                </IconButton>
                {muteButton}
              </div>
              <p className="pr-2 text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                <span className="sr-only">Time left </span>
                <span data-testid="remaining-time">
                  {timer.minutes}:{String(timer.seconds).padStart(2, "0")}
                </span>
              </p>
            </header>

            <main className="min-h-0 flex-1 px-3 py-1 sm:px-8">
              <TimerGrid
                totalIntervals={timer.totalIntervals}
                completedIntervals={timer.completedIntervals}
                theme={theme}
                isRunning={timer.isRunning}
                currentIntervalProgress={timer.currentIntervalProgress}
              />
            </main>

            <footer className="flex shrink-0 justify-center pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <PauseButton isRunning={timer.isRunning} onPause={timer.pause} onPlay={timer.start} />
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, type: "tween" }}
            className="pointer-events-none fixed inset-0 z-40"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 0.45, type: "tween" }}
              className="absolute inset-0"
              style={{
                background:
                  theme === "mouse"
                    ? "radial-gradient(circle at center, rgba(244,185,28,0.55) 0%, transparent 70%)"
                    : "radial-gradient(circle at center, rgba(255,107,0,0.45) 0%, transparent 70%)",
              }}
            />
            {flash.confetti && <ConfettiBurst pieceCount={72} />}
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
            <ConfettiBurst pieceCount={48} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCelebration && <CelebrationOverlay theme={theme} onClose={goToSetup} />}
      </AnimatePresence>
    </div>
  )
}
