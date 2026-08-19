"use client"

import { useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"

const COLORS = ["#E53935", "#FFD93D", "#4CAF50", "#2196F3", "#FF6B00", "#9C27B0", "#FF8FAB", "#7C4DFF"] as const
const SHAPES = ["square", "circle", "triangle"] as const

type BurstPiece = {
  id: number
  shape: (typeof SHAPES)[number]
  color: string
  kind: "burst" | "rain"
  startX: string
  startY: string
  x: string
  y: string
  rotate: number
  size: number
  duration: number
  delay: number
}

export function ConfettiBurst({ pieceCount = 80 }: { pieceCount?: number }) {
  const reduceMotion = useReducedMotion()
  const pieces = useMemo<BurstPiece[]>(() => {
    return Array.from({ length: pieceCount }, (_, i) => {
      const rain = i % 5 !== 0
      const angle = ((i / pieceCount) * 360 + ((i * 19) % 48)) * (Math.PI / 180)
      const reach = 38 + (i % 8) * 9
      return {
        id: i,
        kind: rain ? "rain" : "burst",
        shape: SHAPES[i % SHAPES.length] ?? "square",
        color: COLORS[i % COLORS.length] ?? "#FFD93D",
        startX: rain ? `${(i * 13 + (i % 7) * 5) % 100}%` : "50%",
        startY: rain ? `${-8 - (i % 12)}%` : "45%",
        x: rain ? `${((i * 17) % 36) - 18}vw` : `${Math.cos(angle) * reach}vw`,
        y: rain ? "115vh" : `${Math.sin(angle) * reach + 18}vh`,
        rotate: (i % 2 === 0 ? 1 : -1) * (280 + i * 21),
        size: 8 + (i % 8),
        duration: rain ? 1.35 + (i % 6) * 0.18 : 0.85 + (i % 5) * 0.12,
        delay: rain ? (i % 10) * 0.04 : (i % 8) * 0.02,
      }
    })
  }, [pieceCount])

  if (reduceMotion) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className={`absolute ${piece.shape === "circle" ? "rounded-full" : "rounded-sm"}`}
          style={{
            left: piece.startX,
            top: piece.startY,
            width: piece.shape === "triangle" ? 0 : piece.size,
            height: piece.shape === "triangle" ? 0 : piece.size,
            backgroundColor: piece.shape === "triangle" ? "transparent" : piece.color,
            borderLeft: piece.shape === "triangle" ? "6px solid transparent" : undefined,
            borderRight: piece.shape === "triangle" ? "6px solid transparent" : undefined,
            borderBottom: piece.shape === "triangle" ? `12px solid ${piece.color}` : undefined,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{
            x: piece.x,
            y: piece.y,
            opacity: [1, 1, 0],
            scale: [0.4, 1.15, 0.9],
            rotate: piece.rotate,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
            type: "tween",
          }}
        />
      ))}
    </div>
  )
}
