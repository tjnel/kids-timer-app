/**
 * QA polish pass: fix mouse-run leap offset, flag-wave grid/pole, car-drive slide.
 * Does not rebuild the rest of the sprite set.
 * Run: node scripts/polish-sprite-cycles.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { PNG } from "pngjs"
import {
  OUT_DIR,
  SRC_DIR,
  readPng,
  concatHorizontal,
  splitStrip,
  cellMassCentroid,
  shiftPng,
  loadPrepared,
  fitFramesToCells,
  saveSprite,
} from "./composite-sprites.mjs"

function isCarBody(r, g, b, _a) {
  return r > 140 && r > g + 30 && r > b + 30
}

function polishMouseRun() {
  const file = path.join(OUT_DIR, "mouse-run.png")
  const strip = readPng(file)
  const cells = splitStrip(strip, 4, 128, 128)
  const centroids = cells.map((cell) => cellMassCentroid(cell))
  const targetCx =
    (centroids[0].cx + centroids[2].cx + centroids[3].cx) / 3
  const dx = Math.round(targetCx - centroids[1].cx)
  console.log(
    `mouse-run leap cx ${centroids[1].cx.toFixed(2)} -> shift ${dx}px (target ${targetCx.toFixed(2)})`,
  )
  shiftPng(cells[1], dx, 0)
  saveSprite("mouse-run.png", concatHorizontal(cells))
}

function polishCarDrive() {
  const file = path.join(OUT_DIR, "car-drive.png")
  const strip = readPng(file)
  const cells = splitStrip(strip, 3, 160, 96)
  const red = cells.map((cell) => cellMassCentroid(cell, 16, isCarBody))
  const targetCx = red[0].cx
  for (let i = 1; i < cells.length; i++) {
    const dx = Math.round(targetCx - red[i].cx)
    console.log(
      `car-drive frame ${i} redCx ${red[i].cx.toFixed(2)} -> shift ${dx}px (target ${targetCx.toFixed(2)})`,
    )
    shiftPng(cells[i], dx, 0)
  }
  saveSprite("car-drive.png", concatHorizontal(cells))
}

function polishFlagWave() {
  const flags = [
    loadPrepared("flag-idle-source.png"),
    loadPrepared("flag-wave-2-source.png"),
    loadPrepared("flag-wave-3-source.png"),
  ]
  saveSprite("flag-wave.png", concatHorizontal(fitFramesToCells(flags, 128, 128, 0.08)))
}

function logCentroids(rel, frames, cellW, cellH, predicate) {
  const png = readPng(path.join(OUT_DIR, rel))
  const cells = splitStrip(png, frames, cellW, cellH)
  for (let i = 0; i < cells.length; i++) {
    const c = cellMassCentroid(cells[i], 16, predicate)
    const cornerA = [
      cells[i].data[3],
      cells[i].data[(cellW - 1) * 4 + 3],
      cells[i].data[((cellH - 1) * cellW) * 4 + 3],
      cells[i].data[((cellH - 1) * cellW + cellW - 1) * 4 + 3],
    ]
    console.log(
      `  ${rel}[${i}] cx=${c.cx.toFixed(2)} cy=${c.cy.toFixed(2)} cornerA=${cornerA.join(",")}`,
    )
  }
}

const wave2Src = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-Users-TJ-Development-Projects-kidstimer/assets/flag-wave-2-source.png",
)
const wave3Src = path.join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-Users-TJ-Development-Projects-kidstimer/assets/flag-wave-3-source.png",
)
const dest2 = path.join(SRC_DIR, "flag-wave-2-source.png")
const dest3 = path.join(SRC_DIR, "flag-wave-3-source.png")
if (fs.existsSync(wave2Src)) {
  fs.copyFileSync(wave2Src, dest2)
  console.log("copied flag-wave-2-source.png")
}
if (fs.existsSync(wave3Src)) {
  fs.copyFileSync(wave3Src, dest3)
  console.log("copied flag-wave-3-source.png")
}

polishMouseRun()
polishCarDrive()
polishFlagWave()

console.log("\nverify")
logCentroids("mouse-run.png", 4, 128, 128)
logCentroids("car-drive.png", 3, 160, 96, isCarBody)
logCentroids("flag-wave.png", 3, 128, 128)
console.log("polish done")
