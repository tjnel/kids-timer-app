"use client"

import { useRef } from "react"

const STEP: Record<string, -1 | 1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/**
 * Keyboard behaviour for a radio group: the checked option is the group's one
 * Tab stop, and the arrow keys, Home and End move to another option and select
 * it. Spread `radioProps(value)` on each option.
 */
export function useRovingRadio<T extends string>(values: readonly T[], selected: T, onSelect: (value: T) => void) {
  const nodes = useRef(new Map<T, HTMLElement>())

  const move = (event: React.KeyboardEvent<HTMLElement>, from: T) => {
    const step = STEP[event.key]
    const index =
      step !== undefined
        ? (values.indexOf(from) + step + values.length) % values.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? values.length - 1
            : null
    const next = index === null ? undefined : values[index]
    if (next === undefined) return
    event.preventDefault()
    onSelect(next)
    nodes.current.get(next)?.focus()
  }

  return function radioProps(value: T) {
    return {
      role: "radio" as const,
      "aria-checked": value === selected,
      tabIndex: value === selected ? 0 : -1,
      ref: (node: HTMLElement | null) => {
        if (node) nodes.current.set(value, node)
        else nodes.current.delete(value)
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => move(event, value),
    }
  }
}
