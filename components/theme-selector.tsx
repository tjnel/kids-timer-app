"use client"

import { motion } from "framer-motion"
import { Mouse, Cheese, RaceCar, FinishFlag } from "./timer-icons"
import type { ThemeType } from "./timer-grid"

interface ThemeSelectorProps {
  theme: ThemeType
  onThemeChange: (theme: ThemeType) => void
}

export function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="flex w-full justify-center gap-3">
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onThemeChange("mouse")}
        className={`relative flex min-h-16 min-w-32 flex-1 flex-col items-center gap-1 rounded-2xl p-2 ring-2 sm:min-h-20 sm:min-w-44 sm:gap-2 sm:p-4 ${
          theme === "mouse"
            ? "bg-card text-card-foreground shadow-md ring-primary"
            : "bg-card/80 text-card-foreground ring-black/5"
        }`}
      >
        <div className="flex items-center gap-2">
          <Mouse className="size-10 sm:size-14" />
          <Cheese className="size-8 sm:size-12" />
        </div>
        <p className="text-base font-semibold sm:text-base">Mouse & Cheese</p>
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onThemeChange("racecar")}
        className={`relative flex min-h-16 min-w-32 flex-1 flex-col items-center gap-1 rounded-2xl p-2 ring-2 sm:min-h-20 sm:min-w-44 sm:gap-2 sm:p-4 ${
          theme === "racecar"
            ? "bg-card text-card-foreground shadow-md ring-primary"
            : "bg-card/80 text-card-foreground ring-black/5"
        }`}
      >
        <div className="flex items-center gap-2">
          <RaceCar className="h-8 w-12 sm:h-12 sm:w-16" />
          <FinishFlag className="size-8 sm:size-12" />
        </div>
        <p className="text-base font-semibold sm:text-base">Race Car</p>
      </motion.button>
    </div>
  )
}
