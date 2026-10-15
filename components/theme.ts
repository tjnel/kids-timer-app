export type ThemeType = "mouse" | "racecar"

export interface ThemeSpec {
  title: string
  hint: string
  doneTitle: string
  doneBody: string
  /** Accessible grid status: "<n> of <total> <piece>" */
  piece: { singular: string; plural: string }
  /** Full-screen glow when a piece is finished. */
  flash: string
  /** Character placement inside a grid cell, as fractions of the cell size. */
  place: { left: number; bottom: number; size: number }
  chomp: { from: number; to: number }
  tick: { wave: OscillatorType; high: { tock: number; tick: number }; low: { tock: number; tick: number } }
}

export const THEMES: Record<ThemeType, ThemeSpec> = {
  mouse: {
    title: "Mouse Timer",
    hint: "The mouse eats cheese, then runs home.",
    doneTitle: "All done!",
    doneBody: "The mouse ate every piece and went home.",
    piece: { singular: "cheese piece eaten", plural: "cheese pieces eaten" },
    flash: "radial-gradient(circle at center, rgba(244,185,28,0.55) 0%, transparent 70%)",
    place: { left: -0.06, bottom: -0.04, size: 0.6 },
    chomp: { from: 600, to: 300 },
    tick: { wave: "triangle", high: { tock: 880, tick: 1174 }, low: { tock: 660, tick: 784 } },
  },
  racecar: {
    title: "Race Timer",
    hint: "The car passes a cone each interval.",
    doneTitle: "Winner!",
    doneBody: "You crossed the finish line.",
    piece: { singular: "cone passed", plural: "cones passed" },
    flash: "radial-gradient(circle at center, rgba(255,107,0,0.45) 0%, transparent 70%)",
    place: { left: 0.08, bottom: 0.08, size: 0.84 },
    chomp: { from: 150, to: 400 },
    tick: { wave: "square", high: { tock: 220, tick: 330 }, low: { tock: 165, tick: 247 } },
  },
}
