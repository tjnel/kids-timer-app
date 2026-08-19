"use client"

import { motion } from "framer-motion"

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, "0")
}

interface TimerDisplayRingProps {
  minutes: number
  seconds: number
  totalSeconds?: number
  initialTotal?: number
}

export function TimerDisplayRing({
  minutes,
  seconds,
  totalSeconds,
  initialTotal,
}: TimerDisplayRingProps) {
  const remaining = Math.max(0, totalSeconds ?? minutes * 60 + seconds)
  const total = Math.max(1, initialTotal ?? (remaining || 1))
  const progress = 1 - remaining / total
  const size = 112
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div className="relative size-28">
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.08, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p
          data-testid="remaining-time"
          className="text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl"
        >
          {Math.floor(minutes)}:{pad(seconds)}
        </p>
      </div>
    </div>
  )
}
