/**
 * Punch real alpha through illustration frames and composite sprite strips.
 * Run from repo root: node scripts/composite-sprites.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PNG } from "pngjs"

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, "scripts", "sprite-frames")
const OUT_DIR = path.join(ROOT, "public", "sprites")
const PUBLIC_DIR = path.join(ROOT, "public")

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath))
}

function writePng(filePath, png) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, PNG.sync.write(png))
}

function idx(width, x, y) {
  return (y * width + x) * 4
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function saturation(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b)
}

function isBackdropPixel(r, g, b, a) {
  if (a < 10) return true
  const sat = saturation(r, g, b)
  const lum = luminance(r, g, b)
  if (lum >= 226 && sat <= 24) return true
  if (sat <= 14 && lum >= 160) return true
  return false
}

function floodClearBackdrop(png) {
  const { width, height, data } = png
  const visited = new Uint8Array(width * height)
  const stack = []

  for (let x = 0; x < width; x++) {
    stack.push(x, 0, x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    stack.push(0, y, width - 1, y)
  }

  while (stack.length) {
    const y = stack.pop()
    const x = stack.pop()
    if (x < 0 || y < 0 || x >= width || y >= height) continue
    const p = y * width + x
    if (visited[p]) continue
    visited[p] = 1
    const i = p * 4
    if (!isBackdropPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue
    data[i] = 0
    data[i + 1] = 0
    data[i + 2] = 0
    data[i + 3] = 0
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }

  // Soft fringe: fade near-white pixels that touch transparency.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(width, x, y)
      if (data[i + 3] < 10) continue
      if (!isBackdropPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) continue
      let nextToClear = false
      if (x > 0 && data[idx(width, x - 1, y) + 3] < 10) nextToClear = true
      if (x < width - 1 && data[idx(width, x + 1, y) + 3] < 10) nextToClear = true
      if (y > 0 && data[idx(width, x, y - 1) + 3] < 10) nextToClear = true
      if (y < height - 1 && data[idx(width, x, y + 1) + 3] < 10) nextToClear = true
      if (nextToClear) {
        data[i] = 0
        data[i + 1] = 0
        data[i + 2] = 0
        data[i + 3] = 0
      }
    }
  }

  return png
}

function contentBBox(png, alphaThresh = 16) {
  const { width, height, data } = png
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[idx(width, x, y) + 3] > alphaThresh) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) {
    return { x: 0, y: 0, w: width, h: height }
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

function unionBoxes(boxes) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const box of boxes) {
    minX = Math.min(minX, box.x)
    minY = Math.min(minY, box.y)
    maxX = Math.max(maxX, box.x + box.w)
    maxY = Math.max(maxY, box.y + box.h)
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

function expandBoxToAspect(box, aspect, maxW, maxH, padRatio) {
  const pad = Math.round(Math.max(box.w, box.h) * padRatio)
  let x = box.x - pad
  let y = box.y - pad
  let w = box.w + pad * 2
  let h = box.h + pad * 2
  const current = w / h
  if (current < aspect) {
    const nw = h * aspect
    x -= (nw - w) / 2
    w = nw
  } else if (current > aspect) {
    const nh = w / aspect
    y -= (nh - h) / 2
    h = nh
  }
  x = Math.round(x)
  y = Math.round(y)
  w = Math.round(w)
  h = Math.round(h)
  if (x < 0) {
    w += x
    x = 0
  }
  if (y < 0) {
    h += y
    y = 0
  }
  if (x + w > maxW) w = maxW - x
  if (y + h > maxH) h = maxH - y
  return { x, y, w, h }
}

function crop(png, box) {
  const out = new PNG({ width: box.w, height: box.h })
  PNG.bitblt(png, out, box.x, box.y, box.w, box.h, 0, 0)
  return out
}

function resizeArea(src, dw, dh) {
  const dest = new PNG({ width: dw, height: dh })
  const xRatio = src.width / dw
  const yRatio = src.height / dh
  for (let dy = 0; dy < dh; dy++) {
    const sy0 = dy * yRatio
    const sy1 = (dy + 1) * yRatio
    for (let dx = 0; dx < dw; dx++) {
      const sx0 = dx * xRatio
      const sx1 = (dx + 1) * xRatio
      let rAcc = 0
      let gAcc = 0
      let bAcc = 0
      let aAcc = 0
      let weight = 0
      const ix0 = Math.floor(sx0)
      const ix1 = Math.min(src.width, Math.ceil(sx1))
      const iy0 = Math.floor(sy0)
      const iy1 = Math.min(src.height, Math.ceil(sy1))
      for (let sy = iy0; sy < iy1; sy++) {
        const yCover = Math.min(sy1, sy + 1) - Math.max(sy0, sy)
        for (let sx = ix0; sx < ix1; sx++) {
          const xCover = Math.min(sx1, sx + 1) - Math.max(sx0, sx)
          const cov = xCover * yCover
          const i = idx(src.width, sx, sy)
          const a = src.data[i + 3]
          const pa = a / 255
          rAcc += src.data[i] * pa * cov
          gAcc += src.data[i + 1] * pa * cov
          bAcc += src.data[i + 2] * pa * cov
          aAcc += a * cov
          weight += cov
        }
      }
      const di = idx(dw, dx, dy)
      if (weight <= 0) continue
      const outA = aAcc / weight
      const pa = outA / 255
      dest.data[di] = pa > 0.002 ? Math.round(rAcc / weight / pa) : 0
      dest.data[di + 1] = pa > 0.002 ? Math.round(gAcc / weight / pa) : 0
      dest.data[di + 2] = pa > 0.002 ? Math.round(bAcc / weight / pa) : 0
      dest.data[di + 3] = Math.round(outA)
    }
  }
  return dest
}

function loadPrepared(name) {
  const png = readPng(path.join(SRC_DIR, name))
  floodClearBackdrop(png)
  return png
}

function fitFramesToCells(frames, cellW, cellH, padRatio) {
  const boxes = frames.map((frame) => contentBBox(frame))
  const union = unionBoxes(boxes)
  const cropBox = expandBoxToAspect(
    union,
    cellW / cellH,
    frames[0].width,
    frames[0].height,
    padRatio,
  )
  return frames.map((frame) => resizeArea(crop(frame, cropBox), cellW, cellH))
}

function concatHorizontal(cells) {
  const cellW = cells[0].width
  const cellH = cells[0].height
  const out = new PNG({ width: cellW * cells.length, height: cellH })
  cells.forEach((cell, i) => {
    PNG.bitblt(cell, out, 0, 0, cellW, cellH, i * cellW, 0)
  })
  return out
}

function splitStrip(png, frames, cellW, cellH) {
  const cells = []
  for (let i = 0; i < frames; i++) {
    const cell = new PNG({ width: cellW, height: cellH })
    PNG.bitblt(png, cell, i * cellW, 0, cellW, cellH, 0, 0)
    cells.push(cell)
  }
  return cells
}

function cellMassCentroid(png, alphaThresh = 16, predicate) {
  const { width, height, data } = png
  let sx = 0
  let sy = 0
  let w = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(width, x, y)
      const a = data[i + 3]
      if (a <= alphaThresh) continue
      if (predicate && !predicate(data[i], data[i + 1], data[i + 2], a)) continue
      const wt = a / 255
      sx += x * wt
      sy += y * wt
      w += wt
    }
  }
  if (w <= 0) {
    return { cx: width / 2, cy: height / 2, w: 0 }
  }
  return { cx: sx / w, cy: sy / w, w }
}

function shiftPng(png, dx, dy) {
  const { width, height, data } = png
  const src = Buffer.from(data)
  data.fill(0)
  const idxX = Math.round(dx)
  const idxY = Math.round(dy)
  for (let y = 0; y < height; y++) {
    const ny = y + idxY
    if (ny < 0 || ny >= height) continue
    for (let x = 0; x < width; x++) {
      const nx = x + idxX
      if (nx < 0 || nx >= width) continue
      const si = idx(width, x, y)
      const di = idx(width, nx, ny)
      data[di] = src[si]
      data[di + 1] = src[si + 1]
      data[di + 2] = src[si + 2]
      data[di + 3] = src[si + 3]
    }
  }
  return png
}

function edgeAlphaStats(png, inset = 0) {
  const { width, height, data } = png
  let minA = 255
  let maxA = 0
  let opaqueCorners = 0
  const samples = [
    [inset, inset],
    [width - 1 - inset, inset],
    [inset, height - 1 - inset],
    [width - 1 - inset, height - 1 - inset],
  ]
  for (const [x, y] of samples) {
    const a = data[idx(width, x, y) + 3]
    minA = Math.min(minA, a)
    maxA = Math.max(maxA, a)
    if (a > 8) opaqueCorners += 1
  }
  return { minA, maxA, opaqueCorners, width, height }
}

function saveSprite(rel, png) {
  const outPath = path.join(OUT_DIR, rel)
  writePng(outPath, png)
  const stats = fs.statSync(outPath)
  const edge = edgeAlphaStats(png)
  console.log(
    `${rel}  ${png.width}x${png.height}  ${stats.size} bytes  cornerAlpha=${edge.minA}-${edge.maxA} opaqueCorners=${edge.opaqueCorners}`,
  )
  return { rel, size: stats.size, ...edge }
}

function savePublic(rel, png) {
  const outPath = path.join(PUBLIC_DIR, rel)
  writePng(outPath, png)
  const stats = fs.statSync(outPath)
  console.log(`${rel}  ${png.width}x${png.height}  ${stats.size} bytes`)
  return stats.size
}

function resizeOpaque(src, dw, dh) {
  return resizeArea(src, dw, dh)
}

export {
  SRC_DIR,
  OUT_DIR,
  readPng,
  writePng,
  loadPrepared,
  fitFramesToCells,
  concatHorizontal,
  splitStrip,
  cellMassCentroid,
  shiftPng,
  saveSprite,
}

function buildAll() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const mouseIdle = loadPrepared("mouse-idle-source.png")
  const mouseEat = [
    loadPrepared("mouse-eat-1-source.png"),
    loadPrepared("mouse-eat-2-source.png"),
    loadPrepared("mouse-eat-3-source.png"),
    loadPrepared("mouse-eat-4-source.png"),
  ]
  const mouseRun = [
    loadPrepared("mouse-run-1-source.png"),
    loadPrepared("mouse-run-2-source.png"),
    loadPrepared("mouse-run-3-source.png"),
    loadPrepared("mouse-run-4-source.png"),
  ]
  const apples = [
    loadPrepared("apple-eat-1-source.png"),
    loadPrepared("apple-eat-2-source.png"),
    loadPrepared("apple-eat-3-source.png"),
    loadPrepared("apple-eat-4-source.png"),
    loadPrepared("apple-eat-5-source.png"),
    loadPrepared("apple-eat-6-source.png"),
  ]
  const cheeseIdle = loadPrepared("cheese-idle-source.png")
  const cheeses = [
    cheeseIdle,
    loadPrepared("cheese-eat-2-source.png"),
    loadPrepared("cheese-eat-3-source.png"),
    loadPrepared("cheese-eat-4-source.png"),
  ]
  const carIdle = loadPrepared("car-idle-source.png")
  const cars = [
    carIdle,
    loadPrepared("car-drive-2-source.png"),
    loadPrepared("car-drive-3-source.png"),
  ]
  const flagIdle = loadPrepared("flag-idle-source.png")
  const flags = [
    flagIdle,
    loadPrepared("flag-wave-2-source.png"),
    loadPrepared("flag-wave-3-source.png"),
  ]

  saveSprite("mouse-idle.png", fitFramesToCells([mouseIdle], 128, 128, 0.08)[0])
  saveSprite("mouse-eat.png", concatHorizontal(fitFramesToCells(mouseEat, 128, 128, 0.07)))
  saveSprite("mouse-run.png", concatHorizontal(fitFramesToCells(mouseRun, 128, 128, 0.06)))
  saveSprite("apple-eat.png", concatHorizontal(fitFramesToCells(apples, 128, 128, 0.1)))
  saveSprite("cheese-idle.png", fitFramesToCells([cheeseIdle], 128, 128, 0.12)[0])
  saveSprite("cheese-eat.png", concatHorizontal(fitFramesToCells(cheeses, 128, 128, 0.1)))
  saveSprite("car-idle.png", fitFramesToCells([carIdle], 160, 96, 0.08)[0])
  saveSprite("car-drive.png", concatHorizontal(fitFramesToCells(cars, 160, 96, 0.06)))
  saveSprite("flag-idle.png", fitFramesToCells([flagIdle], 128, 128, 0.1)[0])
  saveSprite("flag-wave.png", concatHorizontal(fitFramesToCells(flags, 128, 128, 0.08)))

  const iconSrc = readPng(path.join(SRC_DIR, "icon-mouse-source.png"))
  savePublic("icon-192.png", resizeOpaque(iconSrc, 192, 192))
  savePublic("icon-512.png", resizeOpaque(iconSrc, 512, 512))
  savePublic("apple-icon.png", resizeOpaque(iconSrc, 180, 180))

  console.log("done")
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isMain) {
  buildAll()
}
