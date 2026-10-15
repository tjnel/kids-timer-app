"use client"

import { motion } from "framer-motion"
import { useCallback, useRef } from "react"

interface TimeSelectorProps {
  minutes: number
  seconds: number
  onMinutesChange: (minutes: number) => void
  intervalType: "30sec" | "1min"
  onIntervalTypeChange: (type: "30sec" | "1min") => void
}

export function TimeSelector({
  minutes,
  onMinutesChange,
  intervalType,
  onIntervalTypeChange,
}: TimeSelectorProps) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const maxMinutes = 15
  const minMinutes = intervalType === "1min" ? 1 : 0.5
  const step = intervalType === "1min" ? 1 : 0.5
  const sliderPosition = (minutes - minMinutes) / (maxMinutes - minMinutes)

  const formatTime = (mins: number) => {
    const totalMins = Math.floor(mins)
    const secs = Math.round((mins % 1) * 60)
    return `${totalMins}:${String(secs).padStart(2, "0")}`
  }

  const getMinuteLabel = (mins: number) => {
    if (mins < 1) return `${Math.round(mins * 60)}s`
    return `${mins}m`
  }

  const handleSliderInteraction = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return
      const rect = sliderRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const rawMinutes = minMinutes + percentage * (maxMinutes - minMinutes)
      const snappedMinutes = Math.round(rawMinutes / step) * step
      const clampedMinutes = Math.max(minMinutes, Math.min(maxMinutes, snappedMinutes))
      onMinutesChange(clampedMinutes)
    },
    [minMinutes, maxMinutes, step, onMinutesChange],
  )

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    handleSliderInteraction(e.clientX)

    const handlePointerMove = (event: PointerEvent) => {
      handleSliderInteraction(event.clientX)
    }

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
    }

    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerUp)
  }

  const tickMarks: Array<{ value: number; isMain: boolean; showLabel: boolean }> = []
  for (let i = minMinutes; i <= maxMinutes; i += step) {
    const isMainTick = i % 1 === 0
    const showLabel = i === minMinutes || i === 5 || i === 10 || i === maxMinutes
    tickMarks.push({ value: i, isMain: isMainTick, showLabel })
  }

  const intervalCount = Math.ceil((minutes * 60) / (intervalType === "1min" ? 60 : 30))

  return (
    <div className="flex w-full flex-col items-center gap-3 px-2 sm:gap-5 sm:px-4">
      <div className="flex gap-1 rounded-full bg-secondary p-1 ring-1 ring-black/5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            onIntervalTypeChange("30sec")
            const nearest = Math.max(0.5, Math.round(minutes * 2) / 2)
            onMinutesChange(nearest)
          }}
          className={`relative min-h-11 min-w-20 rounded-full px-4 py-2 text-sm font-semibold ${
            intervalType === "30sec"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          30 sec
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            onIntervalTypeChange("1min")
            const nearest = Math.max(1, Math.round(minutes))
            onMinutesChange(nearest)
          }}
          className={`relative min-h-11 min-w-20 rounded-full px-4 py-2 text-sm font-semibold ${
            intervalType === "1min"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          1 min
        </motion.button>
      </div>

      <div className="rounded-[1.75rem] bg-card px-8 py-2.5 shadow-sm ring-1 ring-black/5 sm:px-12 sm:py-5">
        <p className="text-center text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-6xl">
          {formatTime(minutes)}
        </p>
        <p className="mt-1 text-center text-base font-medium text-muted-foreground sm:text-sm">
          {intervalCount} {intervalCount === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div className="w-full max-w-md px-2">
        <div
          ref={sliderRef}
          className="relative h-12 cursor-pointer touch-none select-none sm:h-16"
          onPointerDown={handlePointerDown}
        >
          <div className="absolute top-1/2 right-0 left-0 h-3 -translate-y-1/2 rounded-full bg-muted" />
          <motion.div
            className="absolute top-1/2 left-0 h-3 -translate-y-1/2 rounded-full bg-primary"
            style={{ width: `${sliderPosition * 100}%` }}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <div className="absolute top-1/2 right-0 left-0 -translate-y-1/2">
            {tickMarks
              .filter((t) => t.isMain)
              .map(({ value, showLabel }) => {
                const pos = ((value - minMinutes) / (maxMinutes - minMinutes)) * 100
                return (
                  <div
                    key={value}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
                  >
                    <div
                      className={`h-3 w-0.5 rounded-full sm:h-4 ${
                        value <= minutes ? "bg-primary-foreground/60" : "bg-muted-foreground/30"
                      }`}
                    />
                    {showLabel && (
                      <p className="mt-3 text-[0.625rem] font-semibold whitespace-nowrap text-muted-foreground sm:mt-4 sm:text-xs">
                        {getMinuteLabel(value)}
                      </p>
                    )}
                  </div>
                )
              })}
          </div>
          <motion.div
            className="absolute top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full bg-primary shadow-lg ring-4 ring-card active:cursor-grabbing sm:size-12"
            style={{ left: `${sliderPosition * 100}%` }}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex size-full items-center justify-center text-sm font-semibold text-primary-foreground">
              {Math.floor(minutes) > 0 ? Math.floor(minutes) : ""}
            </span>
          </motion.div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 px-2">
        {[1, 2, 3, 5, 10, 15].map((mins) => (
          <motion.button
            type="button"
            key={mins}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMinutesChange(mins)}
            className={`relative min-h-11 min-w-11 rounded-full px-3 py-2 text-sm font-semibold sm:px-4 ${
              minutes === mins
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-card-foreground ring-1 ring-black/5"
            }`}
          >
            {mins}m
          </motion.button>
        ))}
      </div>
    </div>
  )
}
