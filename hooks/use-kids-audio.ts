"use client"

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import { THEMES, type ThemeType } from "@/components/theme"

const MUTE_STORAGE_KEY = "kidstimer-muted"

function audioContextConstructor(): (new () => AudioContext) | null {
  if (typeof window === "undefined") return null
  // Older iOS only exposes the prefixed constructor.
  const scoped = window as unknown as {
    AudioContext?: new () => AudioContext
    webkitAudioContext?: new () => AudioContext
  }
  return scoped.AudioContext ?? scoped.webkitAudioContext ?? null
}

function createAudioContext(): AudioContext | null {
  const Ctor = audioContextConstructor()
  if (!Ctor) return null
  try {
    return new Ctor()
  } catch {
    return null
  }
}

/** A one-sample silent buffer. iOS will not play later sounds unless one starts inside the tap. */
function prime(ctx: AudioContext) {
  const rate = ctx.sampleRate || 44100
  const buffer = ctx.createBuffer(1, 1, rate)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  try {
    source.start()
  } catch {
    /* context is closing */
  }
}

/** One oscillator routed through its own gain to the output. */
function voice(ctx: AudioContext, type: OscillatorType) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.connect(gain)
  gain.connect(ctx.destination)
  return { osc, gain }
}

// Mute preference lives in localStorage and is read through an external store
// so the server render stays stable and the client picks up the saved value.
const muteListeners = new Set<() => void>()

function readMuted() {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function writeMuted(next: boolean) {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0")
  } catch {
    /* storage optional */
  }
  muteListeners.forEach((listener) => listener())
}

function subscribeMuted(listener: () => void) {
  muteListeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    muteListeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function serverMuted() {
  return false
}

export function useKidsAudio() {
  const ctxRef = useRef<AudioContext | null>(null)
  const resumeRef = useRef<Promise<void> | null>(null)
  const muted = useSyncExternalStore(subscribeMuted, readMuted, serverMuted)

  const resumeSafely = useCallback((ctx: AudioContext) => {
    if (ctx.state === "running") return Promise.resolve()
    if (resumeRef.current) return resumeRef.current
    const pending = ctx.resume().then(
      () => undefined,
      () => undefined,
    )
    resumeRef.current = pending
    void pending.finally(() => {
      if (resumeRef.current === pending) resumeRef.current = null
    })
    return pending
  }, [])

  useEffect(() => {
    const retry = () => {
      const ctx = ctxRef.current
      if (!ctx || ctx.state === "running" || ctx.state === "closed") return
      prime(ctx)
      void resumeSafely(ctx)
    }
    window.addEventListener("pointerdown", retry)
    window.addEventListener("touchend", retry)
    return () => {
      window.removeEventListener("pointerdown", retry)
      window.removeEventListener("touchend", retry)
      const ctx = ctxRef.current
      ctxRef.current = null
      resumeRef.current = null
      if (ctx && ctx.state !== "closed") {
        void ctx.close().then(
          () => undefined,
          () => undefined,
        )
      }
    }
  }, [resumeSafely])

  const getContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = createAudioContext()
    }
    return ctxRef.current
  }, [])

  /** Call from a tap. Starts the resume and the silent buffer in that gesture. */
  const unlock = useCallback(() => {
    const ctx = getContext()
    if (!ctx) return Promise.resolve()
    prime(ctx)
    return resumeSafely(ctx)
  }, [getContext, resumeSafely])

  const toggleMuted = useCallback(() => {
    const next = !readMuted()
    writeMuted(next)
    if (!next) void unlock()
  }, [unlock])

  // Play only on a context that is already running. Waiting on resume would
  // queue a tick per second and burst them all when the phone finally allows it.
  const runningContext = useCallback(() => {
    if (readMuted()) return null
    const ctx = getContext()
    if (!ctx || ctx.state !== "running") return null
    return ctx
  }, [getContext])

  const playChomp = useCallback(
    (theme: ThemeType) => {
      const ctx = runningContext()
      if (!ctx) return
      try {
        const { from, to } = THEMES[theme].chomp
        const { osc, gain } = voice(ctx, "sine")
        const now = ctx.currentTime
        osc.frequency.setValueAtTime(from, now)
        osc.frequency.exponentialRampToValueAtTime(to, now + 0.1)
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
      } catch {
        /* a phone can reject a ramp; the timer still runs */
      }
    },
    [runningContext],
  )

  const playFanfare = useCallback(() => {
    const ctx = runningContext()
    if (!ctx) return
    try {
      const playNote = (freq: number, startTime: number, duration: number) => {
        const { osc, gain } = voice(ctx, "triangle")
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.2, startTime)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        osc.start(startTime)
        osc.stop(startTime + duration)
      }
      const now = ctx.currentTime
      playNote(523.25, now, 0.15)
      playNote(659.25, now + 0.15, 0.15)
      playNote(783.99, now + 0.3, 0.15)
      playNote(1046.5, now + 0.45, 0.4)
    } catch {
      /* a phone can reject a ramp; the timer still runs */
    }
  }, [runningContext])

  const playTick = useCallback(
    (theme: ThemeType, remainingSeconds: number) => {
      const ctx = runningContext()
      if (!ctx) return
      try {
        const spec = THEMES[theme].tick
        const urgent = remainingSeconds <= 5
        const beat = remainingSeconds % 2 === 0 ? "tock" : "tick"
        const now = ctx.currentTime
        const duration = urgent ? 0.09 : 0.055
        const peak = urgent ? 0.16 : 0.12
        const { osc, gain } = voice(ctx, spec.wave)
        osc.frequency.setValueAtTime(spec.high[beat], now)
        osc.frequency.exponentialRampToValueAtTime(spec.low[beat], now + duration)
        gain.gain.setValueAtTime(peak, now)
        gain.gain.exponentialRampToValueAtTime(0.008, now + duration)
        osc.start(now)
        osc.stop(now + duration)

        if (urgent) {
          // Same voice, 1.5x the pitch, 120 ms later.
          const echo = voice(ctx, spec.wave)
          const later = now + 0.12
          echo.osc.frequency.value = spec.high[beat] * 1.5
          echo.gain.gain.setValueAtTime(peak * 0.7, later)
          echo.gain.gain.exponentialRampToValueAtTime(0.008, later + 0.06)
          echo.osc.start(later)
          echo.osc.stop(later + 0.06)
        }
      } catch {
        /* a phone can reject a ramp; the timer still runs */
      }
    },
    [runningContext],
  )

  return { getContext, unlock, playChomp, playFanfare, playTick, muted, toggleMuted }
}

export type KidsAudio = ReturnType<typeof useKidsAudio>
