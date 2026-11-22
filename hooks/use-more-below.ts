"use client"

import { useCallback, useState } from "react"

/**
 * True while a scroll container has content hidden below its bottom edge.
 * Attach the returned ref to the scroller.
 */
export function useMoreBelow<T extends HTMLElement>() {
  const [moreBelow, setMoreBelow] = useState(false)

  const ref = useCallback((node: T | null) => {
    if (!node) return
    const update = () => setMoreBelow(node.scrollHeight - node.clientHeight - node.scrollTop > 1)
    const observer = new ResizeObserver(update)
    observer.observe(node)
    for (const child of node.children) observer.observe(child)
    node.addEventListener("scroll", update, { passive: true })
    return () => {
      observer.disconnect()
      node.removeEventListener("scroll", update)
    }
  }, [])

  return [ref, moreBelow] as const
}
