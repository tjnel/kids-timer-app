/**
 * Regenerates apple + cheese sprite strips with real RGBA transparency.
 * Run from project root: node scripts/generate-pixel-sprites.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { PNG } from "pngjs"

const OUT_DIR = path.join(process.cwd(), "public", "sprites")

const RED = [226, 35, 35, 255]
const FLESH = [245, 220, 190, 255]
const STEM = [101, 67, 33, 255]
const LEAF = [76, 175, 80, 255]
const SEED = [93, 64, 42, 255]
const HI = [255, 190, 190, 255]
const BLACK = [0, 0, 0, 255]
const CLEAR = [0, 0, 0, 0]

const CHEESE = [255, 214, 80, 255]
const CHEESE_HOLE = [230, 170, 30, 255]

const FW = 32

function idx(w, x, y) {
  return (y * w + x) * 4
}

function get(data, w, x, y) {
  if (x < 0 || y < 0 || x >= w || y >= w) return null
  const i = idx(w, x, y)
  return [data[i], data[i + 1], data[i + 2], data[i + 3]]
}

function set(data, w, x, y, c) {
  if (x < 0 || y < 0 || x >= w || y >= w) return
  const i = idx(w, x, y)
  data[i] = c[0]
  data[i + 1] = c[1]
  data[i + 2] = c[2]
  data[i + 3] = c[3]
}

function fillCircle(data, w, ox, oy, cx, cy, r, c) {
  const r2 = r * r
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r2) set(data, w, ox + x, oy + y, c)
    }
  }
}

function clearCircle(data, w, ox, oy, cx, cy, r) {
  const r2 = r * r
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r2) set(data, w, ox + x, oy + y, CLEAR)
    }
  }
}

function fillRect(data, w, ox, oy, x0, y0, x1, y1, c) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      set(data, w, ox + x, oy + y, c)
    }
  }
}

function fillTriangle(data, w, ox, x1, y1, x2, y2, x3, y3, c) {
  const minX = Math.max(0, Math.min(x1, x2, x3))
  const maxX = Math.min(FW - 1, Math.max(x1, x2, x3))
  const minY = Math.max(0, Math.min(y1, y2, y3))
  const maxY = Math.min(FW - 1, Math.max(y1, y2, y3))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const v0x = x2 - x1
      const v0y = y2 - y1
      const v1x = x3 - x1
      const v1y = y3 - y1
      const v2x = x - x1
      const v2y = y - y1
      const den = v0x * v1y - v1x * v0y
      if (Math.abs(den) < 1e-9) continue
      const u = (v2x * v1y - v1x * v2y) / den
      const v = (v0x * v2y - v2x * v0y) / den
      if (u >= 0 && v >= 0 && u + v <= 1) set(data, w, ox + x, oy + y, c)
    }
  }
}

function isContent(c) {
  return c && c[3] > 0 && !(c[0] === 0 && c[1] === 0 && c[2] === 0)
}

function addOutline(data, sheetW, ox, oy) {
  const toPaint = new Set()
  for (let y = 0; y < FW; y++) {
    for (let x = 0; x < FW; x++) {
      const px = ox + x
      const py = oy + y
      const c = get(data, sheetW, px, py)
      if (!isContent(c)) continue
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        const nx = px + dx
        const ny = py + dy
        const nc = get(data, sheetW, nx, ny)
        if (!nc || nc[3] === 0) toPaint.add(`${nx},${ny}`)
      }
    }
  }
  for (const key of toPaint) {
    const [sx, sy] = key.split(",").map(Number)
    if (sx >= ox && sx < ox + FW && sy >= oy && sy < oy + FW) {
      const cur = get(data, sheetW, sx, sy)
      if (!cur || cur[3] === 0) set(data, sheetW, sx, sy, BLACK)
    }
  }
}

function drawAppleFrame(data, sheetW, frameIndex, fn) {
  const ox = frameIndex * FW
  fn(data, sheetW, ox, 0)
  addOutline(data, sheetW, ox, 0)
}

function buildApple() {
  const sheetW = 6 * FW
  const png = new PNG({ width: sheetW, height: FW })
  png.data.fill(0)

  // 0 whole
  drawAppleFrame(png.data, sheetW, 0, (d, w, ox, oy) => {
    fillCircle(d, w, ox, oy, 16, 19, 9, RED)
    fillRect(d, w, ox, oy, 14, 5, 17, 9, STEM)
    fillTriangle(d, w, ox, 18, 5, 22, 3, 20, 8, LEAF)
    set(d, w, ox + 11, oy + 15, HI)
  })

  // 1 cross-section
  drawAppleFrame(png.data, sheetW, 1, (d, w, ox, oy) => {
    fillCircle(d, w, ox, oy, 16, 18, 10, RED)
    for (let y = 7; y < 29; y++) {
      for (let x = 16; x < 27; x++) {
        const dx = x - 16
        const dy = y - 18
        if (dx * dx + dy * dy <= 100) set(d, w, ox + x, oy + y, FLESH)
      }
    }
    set(d, w, ox + 19, oy + 15, SEED)
    set(d, w, ox + 22, oy + 15, SEED)
    set(d, w, ox + 19, oy + 20, SEED)
    set(d, w, ox + 22, oy + 20, SEED)
    fillRect(d, w, ox, oy, 14, 5, 17, 9, STEM)
  })

  // 2 bite right
  drawAppleFrame(png.data, sheetW, 2, (d, w, ox, oy) => {
    fillCircle(d, w, ox, oy, 16, 18, 10, RED)
    clearCircle(d, w, ox, oy, 24, 17, 7)
    for (let y = oy + 9; y < oy + 27; y++) {
      for (let x = ox + 18; x < ox + 30; x++) {
        const g = get(d, w, x, y)
        if (g && g[3] === 0) set(d, w, x, y, FLESH)
      }
    }
    fillRect(d, w, ox, oy, 14, 5, 17, 9, STEM)
  })

  // 3 bigger bites
  drawAppleFrame(png.data, sheetW, 3, (d, w, ox, oy) => {
    fillCircle(d, w, ox, oy, 16, 18, 10, RED)
    clearCircle(d, w, ox, oy, 25, 17, 9)
    clearCircle(d, w, ox, oy, 7, 18, 7)
    for (let y = oy + 7; y < oy + 29; y++) {
      for (let x = ox + 6; x < ox + 28; x++) {
        const g = get(d, w, x, y)
        if (g && g[3] === 0) {
          const dx = x - ox - 16
          const dy = y - oy - 18
          if (dx * dx + dy * dy <= 110) set(d, w, x, y, FLESH)
        }
      }
    }
    fillRect(d, w, ox, oy, 14, 5, 17, 9, STEM)
  })

  // 4 column
  drawAppleFrame(png.data, sheetW, 4, (d, w, ox, oy) => {
    fillRect(d, w, ox, oy, 12, 10, 20, 26, FLESH)
    fillRect(d, w, ox, oy, 11, 10, 12, 26, RED)
    fillRect(d, w, ox, oy, 20, 10, 21, 26, RED)
    set(d, w, ox + 15, oy + 16, SEED)
    set(d, w, ox + 17, oy + 19, SEED)
    fillRect(d, w, ox, oy, 14, 5, 17, 9, STEM)
  })

  // 5 core
  drawAppleFrame(png.data, sheetW, 5, (d, w, ox, oy) => {
    fillRect(d, w, ox, oy, 13, 12, 19, 26, FLESH)
    set(d, w, ox + 15, oy + 15, SEED)
    set(d, w, ox + 17, oy + 18, SEED)
    fillRect(d, w, ox, oy, 14, 5, 17, 9, STEM)
  })

  return png
}

function drawCheeseFrame(data, sheetW, frameIndex, fn) {
  const ox = frameIndex * FW
  fn(data, sheetW, ox, 0)
  addOutline(data, sheetW, ox, 0)
}

function buildCheese() {
  const sheetW = 4 * FW
  const png = new PNG({ width: sheetW, height: FW })
  png.data.fill(0)

  function wedge(d, w, ox, oy, shrink) {
    const left = 6 + shrink
    const right = 26 - shrink
    const top = 8 + shrink
    const bot = 26
    fillTriangle(d, w, ox, left, bot, 16, top, right, bot, CHEESE)
    fillCircle(d, w, ox, oy, 13 + shrink, 17, 2, CHEESE_HOLE)
    fillCircle(d, w, ox, oy, 19 + shrink, 20, 2, CHEESE_HOLE)
  }

  // 0 full
  drawCheeseFrame(png.data, sheetW, 0, (d, w, ox, oy) => {
    wedge(d, w, ox, oy, 0)
  })

  // 1 bite corner
  drawCheeseFrame(png.data, sheetW, 1, (d, w, ox, oy) => {
    wedge(d, w, ox, oy, 0)
    clearCircle(d, w, ox, oy, 24, 14, 6)
  })

  // 2 smaller
  drawCheeseFrame(png.data, sheetW, 2, (d, w, ox, oy) => {
    wedge(d, w, ox, oy, 3)
    clearCircle(d, w, ox, oy, 22, 16, 5)
  })

  // 3 nub
  drawCheeseFrame(png.data, sheetW, 3, (d, w, ox, oy) => {
    fillRect(d, w, ox, oy, 12, 18, 20, 26, CHEESE)
    fillCircle(d, w, ox, oy, 16, 21, 2, CHEESE_HOLE)
  })

  return png
}

function writePng(name, png) {
  const out = path.join(OUT_DIR, name)
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(out, PNG.sync.write(png))
  console.log("Wrote", out, `${png.width}x${png.height}`)
}

writePng("apple-eat-sprites.png", buildApple())
writePng("cheese-eat-sprites.png", buildCheese())
