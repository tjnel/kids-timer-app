"use client"

import { motion } from "framer-motion"
import type { IntervalType } from "@/hooks/use-timer"

const OPTIONS: Array<{ value: IntervalType; label: string }> = [
  { value: "30sec", label: "30 sec" },
  { value: "1min", label: "1 min" },
]

/** Picks how long one piece lasts. Lives outside TimeSelector so landscape layouts can place it separately. */
export function IntervalToggle({ value, onChange }: { value: IntervalType; onChange: (type: IntervalType) => void }) {
  return (
    <div role="radiogroup" aria-label="Piece length" className="flex gap-1 rounded-full bg-card p-1">
      {OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <motion.button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(option.value)}
            className={`min-h-12 min-w-24 rounded-full px-4 py-2 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-foreground-strong sm:min-h-11 ${
              selected ? "bg-primary text-primary-foreground" : "text-card-foreground"
            }`}
          >
            {option.label}
          </motion.button>
        )
      })}
    </div>
  )
}
