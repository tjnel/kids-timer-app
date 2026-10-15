"use client"

import { motion } from "framer-motion"
import type { ThemeType } from "./theme"
import { Cheese, FinishFlag, Mouse, RaceCar } from "./timer-icons"

interface ThemeSelectorProps {
  theme: ThemeType
  onThemeChange: (theme: ThemeType) => void
}

const OPTIONS: Array<{ value: ThemeType; label: string; art: React.ReactNode }> = [
  {
    value: "mouse",
    label: "Mouse & Cheese",
    art: (
      <>
        <Mouse className="size-10 sm:size-12" />
        <Cheese className="size-8 sm:size-10" />
      </>
    ),
  },
  {
    value: "racecar",
    label: "Race Car",
    art: (
      <>
        <RaceCar className="h-8 w-12 sm:h-10 sm:w-14" />
        <FinishFlag className="size-8 sm:size-10" />
      </>
    ),
  },
]

export function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Theme" className="flex w-full justify-center gap-3">
      {OPTIONS.map((option) => {
        const selected = theme === option.value
        return (
          <motion.button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            whileTap={{ scale: 0.97 }}
            onClick={() => onThemeChange(option.value)}
            className={`flex min-h-16 flex-1 flex-col items-center gap-1 rounded-2xl bg-card p-2 text-card-foreground ring-4 sm:min-h-20 sm:gap-2 sm:p-3 ${
              selected ? "ring-primary shadow-[0_4px_0_rgba(46,26,8,0.25)]" : "ring-transparent opacity-80"
            } focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong`}
          >
            <div className="flex items-center gap-2">{option.art}</div>
            <p className="text-base font-bold">{option.label}</p>
          </motion.button>
        )
      })}
    </div>
  )
}
