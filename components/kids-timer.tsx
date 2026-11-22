"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { AnimatePresence, m } from "framer-motion"
import { ArrowLeft, Volume2, VolumeX } from "lucide-react"
import { useKidsAudio } from "@/hooks/use-kids-audio"
import { useMoreBelow } from "@/hooks/use-more-below"
import { preloadSprites } from "@/hooks/use-sprite-status"
import {
  formatClock,
  intervalsFor,
  type IntervalType,
  MAX_MINUTES,
  MIN_URL_MINUTES,
  snapMinutes,
  useTimer,
} from "@/hooks/use-timer"
import { useTimerFeedback } from "@/hooks/use-timer-feedback"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { CelebrationOverlay } from "./celebration-overlay"
import { FlashOverlay } from "./flash-overlay"
import { IconButton } from "./icon-button"
import { IntervalToggle } from "./interval-toggle"
import { MotionProvider } from "./motion-provider"
import { PauseButton } from "./pause-button"
import { ResetButton } from "./reset-button"
import { RUNNING_SPRITES } from "./sprite-sheets"
import { THEMES, type ThemeType } from "./theme"
import { THEME_ART } from "./theme-art"
import { ThemeSelector } from "./theme-selector"
import { TimeSelector } from "./time-selector"
import { TimerGrid } from "./timer-grid"

const DEFAULT_MINUTES = 2
const CELEBRATION_DELAY_MS = 800
const FLASH_SECONDS = 0.8
const VIEW_FADE = { duration: 0.18 }

// `?minutes=` lets a parent bookmark a length. Unlike the slider it accepts
// tenths (down to six seconds) so a whole run can be exercised quickly.
// Zero, negative and non-numeric values are not a length and fall back to the default.
function subscribeToNothing() {
  return () => {}
}
function readUrlMinutes(): number | null {
  const raw = new URLSearchParams(window.location.search).get("minutes")
  if (!raw) return null
  const mins = Number(raw)
  if (!Number.isFinite(mins) || mins <= 0) return null
  return Math.max(MIN_URL_MINUTES, Math.min(MAX_MINUTES, Math.round(mins * 10) / 10))
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

/**
 * Focus arrives on these buttons from another screen, so a key still held
 * down from the press that changed screens must not press them too.
 */
function ignoreHeldKey(event: React.KeyboardEvent<HTMLButtonElement>) {
  if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault()
}

type FocusTarget = "start" | "pause"

/** The timer, with the animation features its screens use. */
export function KidsTimer() {
  return (
    <MotionProvider>
      <TimerScreens />
    </MotionProvider>
  )
}

function TimerScreens() {
  const [theme, setTheme] = useState<ThemeType>("mouse")
  const urlMinutes = useSyncExternalStore(subscribeToNothing, readUrlMinutes, serverUrlMinutes)
  const [chosenMinutes, setChosenMinutes] = useState<number | null>(null)
  const selectedMinutes = chosenMinutes ?? urlMinutes ?? DEFAULT_MINUTES
  const [intervalType, setIntervalType] = useState<IntervalType>("30sec")

  const audio = useKidsAudio()
  const timer = useTimer({ initialMinutes: selectedMinutes, intervalType })
  const setup = timer.status === "idle"
  const paused = timer.status === "paused"
  const celebrating = useDelayed(timer.isDone, CELEBRATION_DELAY_MS)
  const flashing = timer.isRunning && timer.completedIntervals > 0 && timer.intervalElapsedSeconds < FLASH_SECONDS
  const [setupScrollRef, moreSetupBelow] = useMoreBelow<HTMLElement>()

  useWakeLock(timer.isRunning)
  useTimerFeedback({ timer, theme, intervalType, audio, celebrating })

  // The sheets a run needs are fetched while the parent is still choosing.
  useEffect(() => {
    const warm = () => preloadSprites(RUNNING_SPRITES)
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm)
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(warm, 300)
    return () => window.clearTimeout(id)
  }, [])

  // Changing screens removes the button that was pressed. Focus moves to the
  // new screen's main control once it mounts, so keyboard users keep their place.
  const focusNext = useRef<FocusTarget | null>(null)
  const { reset: resetTimer, start: startTimer } = timer
  const takeFocus = useCallback((target: FocusTarget, node: HTMLButtonElement | null) => {
    if (!node || focusNext.current !== target) return
    focusNext.current = null
    node.focus({ preventScroll: true })
  }, [])
  const startButtonRef = useCallback((node: HTMLButtonElement | null) => takeFocus("start", node), [takeFocus])
  const pauseButtonRef = useCallback((node: HTMLButtonElement | null) => takeFocus("pause", node), [takeFocus])

  const backToSetup = useCallback(() => {
    focusNext.current = "start"
    resetTimer()
  }, [resetTimer])

  const handleStart = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Pointer taps already unlocked on pointerdown. A keyboard click did not.
    if (event.detail === 0) void audio.unlock()
    focusNext.current = "pause"
    startTimer()
  }

  const handleIntervalChange = (type: IntervalType) => {
    setIntervalType(type)
    setChosenMinutes(snapMinutes(selectedMinutes, type))
  }

  const spec = THEMES[theme]
  const { Character, Badge, headerClass } = THEME_ART[theme]
  const muteButton = (
    <IconButton label={audio.muted ? "Unmute sounds" : "Mute sounds"} onClick={audio.toggleMuted}>
      {audio.muted ? <VolumeX className="size-6" /> : <Volume2 className="size-6" />}
    </IconButton>
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-foreground">
      {/* Nothing behind the celebration can be reached while it is open. */}
      <div inert={celebrating} className="flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          {setup ? (
            <m.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={VIEW_FADE}
              className="flex min-h-0 flex-1 flex-col"
            >
              <header className="flex shrink-0 items-center justify-between gap-2 px-4 py-2 sm:py-3 short:py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Character className={`${headerClass} shrink-0`} />
                  <h1 className="truncate text-xl font-extrabold tracking-tight">{spec.title}</h1>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href="/about"
                    prefetch={false}
                    className="flex min-h-12 items-center rounded-full px-2 text-base font-bold text-foreground-strong underline decoration-2 underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-0 focus-visible:outline-foreground-strong"
                  >
                    About
                  </Link>
                  {muteButton}
                </div>
              </header>

              {/*
                One column on phones and tablets. Landscape phones have no height to
                spare, so the time controls move into a second column and the
                preview is dropped. Screens that are not much taller (`compact`)
                keep one column and tighten up instead. Where the content still
                does not fit, the bottom edge fades to show there is more to scroll to.
              */}
              <main
                ref={setupScrollRef}
                className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 ${
                  moreSetupBelow ? "mask-[linear-gradient(to_bottom,black_calc(100%-3rem),transparent)]" : ""
                }`}
              >
                <div className="mx-auto my-auto grid w-full max-w-lg grid-cols-1 justify-items-center gap-3 py-1 sm:gap-5 md:max-w-xl compact:gap-2 sm:compact:gap-3 short:max-w-4xl short:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] short:items-center short:gap-x-8 short:gap-y-3">
                  <div className="w-full min-w-0 short:col-start-1 short:row-start-1">
                    <ThemeSelector theme={theme} onThemeChange={setTheme} />
                  </div>
                  <div className="short:col-start-1 short:row-start-2">
                    <IntervalToggle value={intervalType} onChange={handleIntervalChange} unit={spec.unit.singular} />
                  </div>
                  <div className="w-full min-w-0 short:col-start-2 short:row-span-3 short:row-start-1">
                    <TimeSelector
                      minutes={selectedMinutes}
                      onMinutesChange={setChosenMinutes}
                      intervalType={intervalType}
                      unit={spec.unit}
                    />
                  </div>
                  <div className="w-full min-w-0 short:col-start-1 short:row-start-3">
                    <p className="mb-2 text-center text-base font-semibold text-foreground-strong compact:mb-1 short:mb-0">
                      {spec.hint}
                    </p>
                    {/* Grows with the screen height so the setup fits without scrolling on laptops. */}
                    <div className="h-16 w-full sm:h-[clamp(4rem,calc(100dvh-41rem),6rem)] md:h-[clamp(4rem,calc(100dvh-41rem),7rem)] compact:h-11 short:hidden">
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
                <m.button
                  ref={startButtonRef}
                  type="button"
                  aria-label="Start timer"
                  whileTap={{ scale: 0.96 }}
                  onPointerDown={() => void audio.unlock()}
                  onKeyDown={ignoreHeldKey}
                  onClick={handleStart}
                  className="flex min-h-14 items-center gap-2 rounded-full bg-primary py-3 pr-6 pl-8 text-xl font-extrabold text-primary-foreground shadow-[0_5px_0_rgba(46,26,8,0.3)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong md:min-h-16 md:text-2xl short:min-h-12 short:py-2"
                >
                  Start
                  <Badge className="size-8 shrink-0" />
                </m.button>
              </div>
            </m.div>
          ) : (
            <m.div
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={VIEW_FADE}
              className="flex min-h-0 flex-1 flex-col"
            >
              <header className="flex shrink-0 items-center px-3 py-2 sm:px-5 sm:py-3 short:py-1">
                <h1 className="sr-only">{spec.title}</h1>
                <div className="flex items-center gap-1">
                  <IconButton label="Back to setup" onClick={backToSetup}>
                    <ArrowLeft className="size-7" strokeWidth={2.75} />
                  </IconButton>
                  {muteButton}
                </div>
              </header>

              {/*
                The clock leads on a tall screen. On a short landscape phone it sits
                in the side column so the grid keeps the height.
              */}
              <div className="flex min-h-0 flex-1 flex-col short:flex-row">
                <main className="flex min-h-0 flex-1 flex-col short:flex-row">
                  <p className="shrink-0 py-1 text-center text-6xl leading-none font-extrabold tracking-tight text-foreground-strong tabular-nums sm:text-7xl md:text-8xl short:order-2 short:self-center short:px-2 short:py-0 short:text-5xl">
                    <span className="sr-only">Time left </span>
                    <span data-testid="remaining-time">{formatClock(timer.remainingSeconds)}</span>
                  </p>
                  <p role="status" className="sr-only">
                    {paused ? "Paused" : timer.isRunning ? "Running" : ""}
                  </p>

                  {/* The pieces fade back while paused; the clock stays at full strength to be read across a room. */}
                  <div
                    className={`min-h-0 flex-1 px-3 py-1 transition-opacity duration-200 sm:px-8 short:order-1 short:px-4 short:py-2 ${
                      paused ? "opacity-70" : ""
                    }`}
                  >
                    <TimerGrid
                      totalIntervals={timer.totalIntervals}
                      completedIntervals={timer.completedIntervals}
                      theme={theme}
                      isRunning={timer.isRunning}
                      currentIntervalProgress={timer.currentIntervalProgress}
                    />
                  </div>
                </main>

                {/* Pause sits on the screen's centre line with reset beside it; landscape stacks them in a side column. */}
                <footer className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-end gap-x-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-x-5 short:flex short:flex-col short:items-center short:justify-center short:gap-2 short:px-4 short:pt-0 short:pb-0">
                  <div className="col-start-2">
                    <PauseButton
                      ref={pauseButtonRef}
                      isRunning={timer.isRunning}
                      isDone={timer.isDone}
                      onPause={timer.pause}
                      onPlay={timer.start}
                      onPressStart={() => void audio.unlock()}
                      onKeyDown={ignoreHeldKey}
                    />
                  </div>
                  <div className="col-start-3 justify-self-start">
                    <ResetButton onReset={timer.restart} />
                  </div>
                </footer>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <FlashOverlay active={flashing} flashKey={timer.completedIntervals} gradient={spec.flash} />

      <AnimatePresence>{celebrating && <CelebrationOverlay theme={theme} onClose={backToSetup} />}</AnimatePresence>
    </div>
  )
}
