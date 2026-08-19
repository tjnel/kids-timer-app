"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const MUTE_STORAGE_KEY = "kidstimer-muted"

type WebkitAudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor = window.AudioContext || (window as WebkitAudioContextWindow).webkitAudioContext
  if (!Ctor) return null
  return new Ctor()
}

export function useKidsAudio() {
  const ctxRef = useRef<AudioContext | null>(null)
  const mutedRef = useRef(false)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MUTE_STORAGE_KEY)
      if (stored === "1") {
        mutedRef.current = true
        setMuted(true)
      }
    } catch {
      /* storage optional */
    }
  }, [])

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
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0")
    } catch {
      /* storage optional */
    }
    if (!next) getContext()
  }, [getContext])

  const playChomp = useCallback(
    (theme: "mouse" | "racecar") => {
      if (mutedRef.current) return
      const ctx = getContext()
      if (!ctx) return
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      if (theme === "mouse") {
        oscillator.frequency.setValueAtTime(600, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1)
      } else {
        oscillator.frequency.setValueAtTime(150, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1)
      }
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)
    },
    [getContext],
  )

  const playFanfare = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getContext()
    if (!ctx) return
    const playNote = (freq: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.value = freq
      oscillator.type = "triangle"
      gain.gain.setValueAtTime(0.15, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    }
    const now = ctx.currentTime
    playNote(523.25, now, 0.15)
    playNote(659.25, now + 0.15, 0.15)
    playNote(783.99, now + 0.3, 0.15)
    playNote(1046.5, now + 0.45, 0.4)
  }, [getContext])

  const playTick = useCallback(
    (theme: "mouse" | "racecar", remainingSeconds: number) => {
      if (mutedRef.current) return
      const ctx = getContext()
      if (!ctx) return

      const urgent = remainingSeconds <= 5
      const tock = remainingSeconds % 2 === 0
      const now = ctx.currentTime
      const duration = urgent ? 0.09 : 0.055
      const peak = urgent ? 0.08 : 0.045

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.type = theme === "mouse" ? "triangle" : "square"

      const high =
        theme === "mouse" ? (tock ? 880 : 1174) : tock ? 220 : 330
      const low =
        theme === "mouse" ? (tock ? 660 : 784) : tock ? 165 : 247
      oscillator.frequency.setValueAtTime(high, now)
      oscillator.frequency.exponentialRampToValueAtTime(low, now + duration)

      gain.gain.setValueAtTime(peak, now)
      gain.gain.exponentialRampToValueAtTime(0.008, now + duration)
      oscillator.start(now)
      oscillator.stop(now + duration)

      if (urgent) {
        const echo = ctx.createOscillator()
        const echoGain = ctx.createGain()
        echo.connect(echoGain)
        echoGain.connect(ctx.destination)
        echo.type = oscillator.type
        echo.frequency.value = high * 1.5
        const later = now + 0.12
        echoGain.gain.setValueAtTime(peak * 0.7, later)
        echoGain.gain.exponentialRampToValueAtTime(0.008, later + 0.06)
        echo.start(later)
        echo.stop(later + 0.06)
      }
    },
    [getContext],
  )

  return { getContext, playChomp, playFanfare, playTick, muted, toggleMuted }
}
