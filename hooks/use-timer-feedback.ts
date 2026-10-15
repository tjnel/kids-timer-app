"use client"

import { useEffect, useRef } from "react"
import type { ThemeType } from "@/components/theme"
import type { KidsAudio } from "./use-kids-audio"
import { intervalSeconds, type IntervalType, type Timer } from "./use-timer"

function vibrate(pattern: number | number[]) {
  if ("vibrate" in navigator) navigator.vibrate(pattern)
}

/** Sound and haptics that follow the timer: a tick each second, a chomp per piece, a fanfare at the end. */
export function useTimerFeedback({
  timer,
  theme,
  intervalType,
  audio,
  celebrating,
}: {
  timer: Timer
  theme: ThemeType
  intervalType: IntervalType
  audio: KidsAudio
  celebrating: boolean
}) {
  const { playTick, playChomp, playFanfare } = audio
  const lastTickSecond = useRef<number | null>(null)

  useEffect(() => {
    if (!timer.isRunning) {
      lastTickSecond.current = null
      return
    }
    const remaining = timer.remainingSeconds
    if (remaining <= 0 || lastTickSecond.current === remaining) return
    lastTickSecond.current = remaining
    if (remaining % intervalSeconds(intervalType) === 0) return
    playTick(theme, remaining)
  }, [timer.isRunning, timer.remainingSeconds, intervalType, theme, playTick])

  useEffect(() => {
    if (timer.completedIntervals === 0) return
    vibrate([50, 30, 50])
    playChomp(theme)
  }, [timer.completedIntervals, theme, playChomp])

  useEffect(() => {
    if (!celebrating) return
    vibrate([100, 50, 100, 50, 200, 100, 300])
    playFanfare()
  }, [celebrating, playFanfare])
}
