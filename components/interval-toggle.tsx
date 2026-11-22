"use client"

import { m } from "framer-motion"
import { useRovingRadio } from "@/hooks/use-roving-radio"
import type { IntervalType } from "@/hooks/use-timer"

const OPTIONS: Array<{ value: IntervalType; label: string }> = [
  { value: "30sec", label: "30 sec" },
  { value: "1min", label: "1 min" },
]
const VALUES = OPTIONS.map((option) => option.value)

/** Picks how long one piece lasts. Lives outside TimeSelector so landscape layouts can place it separately. */
export function IntervalToggle({
  value,
  onChange,
  unit,
}: {
  value: IntervalType
  onChange: (type: IntervalType) => void
  /** What the theme calls one piece: "piece", "cone". */
  unit: string
}) {
  const radioProps = useRovingRadio(VALUES, value, onChange)

  return (
    <div className="flex items-center justify-center gap-2">
      {/*
        Sits beside the toggle so it costs no height. The smallest phones and
        landscape phones have no room beside it; the group keeps its name there.
      */}
      <p aria-hidden="true" className="text-base font-semibold text-foreground-strong max-[22rem]:hidden short:hidden">
        Each {unit}
      </p>
      <div role="radiogroup" aria-label="Piece length" className="flex gap-1 rounded-full bg-card p-1">
        {OPTIONS.map((option) => {
          const selected = value === option.value
          return (
            <m.button
              key={option.value}
              type="button"
              {...radioProps(option.value)}
              whileTap={{ scale: 0.96 }}
              onClick={() => onChange(option.value)}
              className={`min-h-12 min-w-24 rounded-full px-4 py-2 text-base font-bold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-foreground-strong sm:min-h-11 ${
                selected ? "bg-primary text-primary-foreground" : "text-card-foreground"
              }`}
            >
              {option.label}
            </m.button>
          )
        })}
      </div>
    </div>
  )
}
