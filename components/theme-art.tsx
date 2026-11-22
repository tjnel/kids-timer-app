"use client"

import type { ThemeType } from "./theme"
import { Cheese, Cone, FinishFlag, Mouse, MouseHole, RaceCar } from "./timer-icons"

interface RunnerProps {
  className?: string
  /** Travelling between cells, or heading into the goal. */
  isMoving: boolean
  /** Working on the current piece. */
  isBusy: boolean
  isRunning: boolean
  arrived: boolean
}

interface PieceProps {
  className?: string
  done: boolean
  progress: number
  active: boolean
}

interface ThemeArt {
  /** The still character, for headers, pickers and the celebration. */
  Character: (props: { className?: string }) => React.ReactNode
  /** Small mark next to the title; the car is wider than it is tall. */
  headerClass: string
  pickerClass: string
  /** The character's box on the celebration card, cut to its own shape so the card has no dead space. */
  celebrationClass: string
  /** The character as it moves across the grid. */
  Runner: (props: RunnerProps) => React.ReactNode
  /** One grid piece: cheese to eat or a cone to pass. */
  Piece: (props: PieceProps) => React.ReactNode
  /** Where the character ends up. */
  Goal: (props: { className?: string; arrived?: boolean }) => React.ReactNode
  /** Shown beside the character in the picker and on the Start button. */
  Badge: (props: { className?: string }) => React.ReactNode
}

/** Which drawings each theme uses. Copy, sound and placement live in `theme.ts`. */
export const THEME_ART: Record<ThemeType, ThemeArt> = {
  mouse: {
    Character: ({ className }) => <Mouse className={className} />,
    headerClass: "size-9",
    pickerClass: "size-10 sm:size-12",
    celebrationClass: "size-28 sm:size-32 short:size-20",
    Runner: ({ className, isMoving, isBusy, isRunning, arrived }) => (
      <Mouse className={className} isMoving={isMoving} isEating={isBusy} playing={isRunning || arrived} />
    ),
    Piece: ({ className, done, progress, active }) => (
      <Cheese className={className} eaten={done} eatProgress={progress} isBeingEaten={active} />
    ),
    Goal: ({ className, arrived }) => <MouseHole className={className} arrived={arrived} />,
    Badge: ({ className }) => <Cheese className={className} />,
  },
  racecar: {
    Character: ({ className }) => <RaceCar className={className} />,
    headerClass: "h-7 w-11",
    pickerClass: "h-8 w-12 sm:h-10 sm:w-14",
    celebrationClass: "h-20 w-32 sm:h-24 sm:w-40 short:h-14 short:w-24",
    Runner: ({ className, isMoving, isBusy, isRunning }) => (
      <RaceCar className={className} isMoving={isMoving || isBusy} playing={isRunning} />
    ),
    Piece: ({ className, done, progress, active }) => (
      <Cone className={className} passed={done} passProgress={progress} isBeingPassed={active} />
    ),
    Goal: ({ className }) => <FinishFlag className={className} />,
    Badge: ({ className }) => <FinishFlag className={className} />,
  },
}
