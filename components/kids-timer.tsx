"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Volume2, VolumeX } from "lucide-react"
import { useKidsAudio } from "@/hooks/use-kids-audio"
import { formatClock, intervalsFor, type IntervalType, snapMinutes, useTimer } from "@/hooks/use-timer"
import { useTimerFeedback } from "@/hooks/use-timer-feedback"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { CelebrationOverlay } from "./celebration-overlay"
import { FlashOverlay } from "./flash-overlay"
import { IconButton } from "./icon-button"
import { IntervalToggle } from "./interval-toggle"
import { PauseButton } from "./pause-button"
import { THEMES, type ThemeType } from "./theme"
import { ThemeSelector } from "./theme-selector"
import { TimeSelector } from "./time-selector"
import { TimerGrid } from "./timer-grid"
import { Cheese, FinishFlag, Mouse, RaceCar } from "./timer-icons"

const DEFAULT_MINUTES = 2
const CELEBRATION_DELAY_MS = 800
const FLASH_SECONDS = 0.8
const VIEW_FADE = { duration: 0.18 }

// `?minutes=` lets a parent bookmark a length. Unlike the slider it accepts
// tenths (down to six seconds) so a whole run can be exercised quickly.
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

/** True from `delayMs` after `active` turns on until it turns off. */
function useDelayed(active: boolean, delayMs: number) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(() => setReady(true), delayMs)
    return () => {
      window.clearTimeout(id)
      setReady(false)
    }
  }, [active, delayMs])
  return active && ready
}

export function KidsTimer() {
  const [theme, setTheme] = useState<ThemeType>("mouse")
  const urlMinutes = useSyncExternalStore(subscribeToNothing, readUrlMinutes, serverUrlMinutes)
  const [chosenMinutes, setChosenMinutes] = useState<number | null>(null)
  const selectedMinutes = chosenMinutes ?? urlMinutes ?? DEFAULT_MINUTES
  const [intervalType, setIntervalType] = useState<IntervalType>("30sec")

  const audio = useKidsAudio()
  const timer = useTimer({ initialMinutes: selectedMinutes, intervalType })
  const setup = timer.status === "idle"
  const celebrating = useDelayed(timer.isDone, CELEBRATION_DELAY_MS)
  const flashing = timer.isRunning && timer.completedIntervals > 0 && timer.intervalElapsedSeconds < FLASH_SECONDS

  useWakeLock(timer.isRunning)
  useTimerFeedback({ timer, theme, intervalType, audio, celebrating })

  const handleStart = () => {
    audio.getContext()
    timer.start()
  }

  const handleIntervalChange = (type: IntervalType) => {
    setIntervalType(type)
    setChosenMinutes(snapMinutes(selectedMinutes, type))
  }

  const spec = THEMES[theme]
  const muteButton = (
    <IconButton label={audio.muted ? "Unmute sounds" : "Mute sounds"} pressed={audio.muted} onClick={audio.toggleMuted}>
      {audio.muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
    </IconButton>
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-foreground">
      <AnimatePresence mode="wait" initial={false}>
        {setup ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={VIEW_FADE}
            className="flex min-h-0 flex-1 flex-col"
          >
            <header className="flex shrink-0 items-center justify-between px-4 py-2 sm:py-3 short:py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                {theme === "mouse" ? <Mouse className="size-9 shrink-0" /> : <RaceCar className="h-7 w-11 shrink-0" />}
                <h1 className="truncate text-xl font-extrabold tracking-tight">{spec.title}</h1>
              </div>
              {muteButton}
            </header>

            {/*
              One column on phones and tablets. Landscape phones have no height to
              spare, so the time controls move into a second column and the
              preview is dropped.
            */}
            <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4">
              <div className="mx-auto my-auto grid w-full max-w-lg grid-cols-1 justify-items-center gap-3 py-1 sm:gap-5 md:max-w-xl short:max-w-4xl short:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] short:items-center short:gap-x-8 short:gap-y-3">
                <div className="w-full min-w-0 short:col-start-1 short:row-start-1">
                  <ThemeSelector theme={theme} onThemeChange={setTheme} />
                </div>
                <div className="short:col-start-1 short:row-start-2">
                  <IntervalToggle value={intervalType} onChange={handleIntervalChange} />
                </div>
                <div className="w-full min-w-0 short:col-start-2 short:row-span-3 short:row-start-1">
                  <TimeSelector minutes={selectedMinutes} onMinutesChange={setChosenMinutes} intervalType={intervalType} />
                </div>
                <div className="w-full min-w-0 short:col-start-1 short:row-start-3">
                  <p className="mb-2 text-center text-base font-semibold text-foreground-strong short:mb-0">{spec.hint}</p>
                  <div className="h-16 w-full sm:h-24 md:h-28 short:hidden">
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

            <div className="flex shrink-0 justify-center px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] short:pt-1 short:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <motion.button
                type="button"
                aria-label="Start timer"
                whileTap={{ scale: 0.96 }}
                onClick={handleStart}
                className="flex min-h-14 items-center gap-2 rounded-full bg-primary py-3 pr-6 pl-8 text-xl font-extrabold text-primary-foreground shadow-[0_5px_0_rgba(46,26,8,0.3)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong md:min-h-16 md:text-2xl short:min-h-12 short:py-2"
              >
                Start
                {theme === "mouse" ? <Cheese className="size-8 shrink-0" /> : <FinishFlag className="size-8 shrink-0" />}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={VIEW_FADE}
            className="flex min-h-0 flex-1 flex-col"
          >
            <h1 className="sr-only">{spec.title}</h1>
            <header className="flex shrink-0 items-center justify-between px-3 py-2 sm:px-5 sm:py-3 short:py-1">
              <div className="flex items-center gap-1">
                <IconButton label="Back to setup" onClick={timer.reset}>
                  <ArrowLeft className="size-7" strokeWidth={2.75} />
                </IconButton>
                {muteButton}
              </div>
              <p className="pr-2 text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl md:text-5xl short:text-3xl">
                <span className="sr-only">Time left </span>
                <span data-testid="remaining-time">{formatClock(timer.remainingSeconds)}</span>
              </p>
            </header>

            {/* The pause control sits under the grid, or beside it when the screen is short. */}
            <div className="flex min-h-0 flex-1 flex-col short:flex-row">
              <main className="min-h-0 flex-1 px-3 py-1 sm:px-8 short:px-4 short:py-2">
                <TimerGrid
                  totalIntervals={timer.totalIntervals}
                  completedIntervals={timer.completedIntervals}
                  theme={theme}
                  isRunning={timer.isRunning}
                  currentIntervalProgress={timer.currentIntervalProgress}
                />
              </main>

              <footer className="flex shrink-0 justify-center pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] short:items-center short:px-6 short:pt-0 short:pb-0">
                <PauseButton isRunning={timer.isRunning} onPause={timer.pause} onPlay={timer.start} />
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FlashOverlay active={flashing} flashKey={timer.completedIntervals} gradient={spec.flash} />

      <AnimatePresence>{celebrating && <CelebrationOverlay theme={theme} onClose={timer.reset} />}</AnimatePresence>
    </div>
  )
}
