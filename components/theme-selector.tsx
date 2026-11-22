"use client"

import { m } from "framer-motion"
import { useRovingRadio } from "@/hooks/use-roving-radio"
import type { ThemeType } from "./theme"
import { THEME_ART } from "./theme-art"

interface ThemeSelectorProps {
  theme: ThemeType
  onThemeChange: (theme: ThemeType) => void
}

const OPTIONS: Array<{ value: ThemeType; label: string }> = [
  { value: "mouse", label: "Mouse & Cheese" },
  { value: "racecar", label: "Race Car" },
]
const VALUES = OPTIONS.map((option) => option.value)

export function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  const radioProps = useRovingRadio(VALUES, theme, onThemeChange)

  return (
    <div role="radiogroup" aria-label="Theme" className="flex w-full justify-center gap-3">
      {OPTIONS.map((option) => {
        const selected = theme === option.value
        const { Character, Badge, pickerClass } = THEME_ART[option.value]
        return (
          <m.button
            key={option.value}
            type="button"
            {...radioProps(option.value)}
            whileTap={{ scale: 0.97 }}
            onClick={() => onThemeChange(option.value)}
            className={`flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-card p-2 text-card-foreground ring-4 sm:min-h-20 sm:gap-2 sm:p-3 short:min-h-14 short:gap-1 short:p-2 ${
              selected ? "ring-primary shadow-[0_4px_0_rgba(46,26,8,0.25)]" : "ring-transparent opacity-80"
            } focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong`}
          >
            <div className="flex shrink-0 items-center gap-2">
              <Character className={pickerClass} />
              <Badge className="size-8 sm:size-10" />
            </div>
            <p className="text-base/5 font-bold">{option.label}</p>
          </m.button>
        )
      })}
    </div>
  )
}
