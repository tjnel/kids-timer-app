"use client"

import { useSyncExternalStore } from "react"

export type SpriteStatus = "loading" | "ready" | "error"

const cache = new Map<string, SpriteStatus>()
const listeners = new Map<string, Set<() => void>>()

function notify(src: string) {
  const set = listeners.get(src)
  if (!set) return
  for (const listener of set) listener()
}

function loadSprite(src: string) {
  const existing = cache.get(src)
  if (existing === "ready" || existing === "error" || existing === "loading") return

  cache.set(src, "loading")
  const img = new Image()
  img.onload = () => {
    cache.set(src, "ready")
    notify(src)
  }
  img.onerror = () => {
    cache.set(src, "error")
    notify(src)
  }
  img.src = src
}

export function useSpriteStatus(src: string): SpriteStatus {
  return useSyncExternalStore(
    (onStoreChange) => {
      let set = listeners.get(src)
      if (!set) {
        set = new Set()
        listeners.set(src, set)
      }
      set.add(onStoreChange)
      loadSprite(src)
      return () => {
        set.delete(onStoreChange)
      }
    },
    () => cache.get(src) ?? "loading",
    () => "loading",
  )
}
