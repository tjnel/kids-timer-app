"use client"

import { useCallback, useRef, useSyncExternalStore } from "react"
import { THEMES, type ThemeType } from "@/components/theme"

const MUTE_STORAGE_KEY = "kidstimer-muted"

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext !== "function") return null
  return new window.AudioContext()
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
  const muted = useSyncExternalStore(subscribeMuted, readMuted, serverMuted)

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext()
    }
    const ctx = ctxRef.current
    if (ctx && ctx.state === "suspended") {
      void ctx.resume()
    }
    return ctx
  }, [])

  const toggleMuted = useCallback(() => {
    const next = !readMuted()
    writeMuted(next)
    if (!next) getContext()
  }, [getContext])

  const audible = useCallback(() => {
    if (readMuted()) return null
    return getContext()
  }, [getContext])

  const playChomp = useCallback(
    (theme: ThemeType) => {
      const ctx = audible()
      if (!ctx) return
      const { from, to } = THEMES[theme].chomp
      const { osc, gain } = voice(ctx, "sine")
      osc.frequency.setValueAtTime(from, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    },
    [audible],
  )

  const playFanfare = useCallback(() => {
    const ctx = audible()
    if (!ctx) return
    const playNote = (freq: number, startTime: number, duration: number) => {
      const { osc, gain } = voice(ctx, "triangle")
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }
    const now = ctx.currentTime
    playNote(523.25, now, 0.15)
    playNote(659.25, now + 0.15, 0.15)
    playNote(783.99, now + 0.3, 0.15)
    playNote(1046.5, now + 0.45, 0.4)
  }, [audible])

  const playTick = useCallback(
    (theme: ThemeType, remainingSeconds: number) => {
      const ctx = audible()
      if (!ctx) return

      const spec = THEMES[theme].tick
      const urgent = remainingSeconds <= 5
      const beat = remainingSeconds % 2 === 0 ? "tock" : "tick"
      const now = ctx.currentTime
      const duration = urgent ? 0.09 : 0.055
      const peak = urgent ? 0.08 : 0.045

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
    },
    [audible],
  )

  return { getContext, playChomp, playFanfare, playTick, muted, toggleMuted }
}

export type KidsAudio = ReturnType<typeof useKidsAudio>
