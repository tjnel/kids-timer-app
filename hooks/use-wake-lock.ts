"use client"

import { useEffect } from "react"

/** Keeps the screen on while `active`; re-acquires after the tab returns to the foreground. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return
    let cancelled = false
    let sentinel: WakeLockSentinel | null = null

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request("screen")
        if (cancelled) {
          void next.release()
          return
        }
        void sentinel?.release()
        sentinel = next
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
      cancelled = true
      document.removeEventListener("visibilitychange", onVisible)
      void sentinel?.release()
    }
  }, [active])
}
