import path from "node:path"

import { expect, type Page, SHORT_RUN_TIMEOUT, SHORT_RUN_URL, test } from "./fixtures"

/**
 * Sweeps real phone and tablet sizes in both orientations and checks the
 * layout invariants on each: nothing scrolls sideways, the primary control is
 * on screen without scrolling, touch targets are big enough, grid cells stay
 * legible and the celebration dialog fits. Runs on the desktop project only;
 * the device projects already cover their own sizes.
 */

const PHONES = [
  { name: "iphone-se1", width: 320, height: 568 },
  { name: "android-small", width: 360, height: 640 },
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-13", width: 390, height: 844 },
  { name: "iphone-pro-max", width: 430, height: 932 },
]
const TABLETS = [
  { name: "ipad-mini", width: 768, height: 1024 },
  { name: "ipad-air", width: 820, height: 1180 },
  { name: "ipad-pro-11", width: 834, height: 1194 },
]
const landscape = (list: typeof PHONES) =>
  list.map(({ name, width, height }) => ({ name: `${name}-landscape`, width: height, height: width }))

const ALL = [...PHONES, ...landscape(PHONES), ...TABLETS, ...landscape(TABLETS)]
const MIN_TARGET = 44
const MIN_CELL = 40

async function noHorizontalOverflow(page: Page) {
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflowX, "horizontal overflow").toBeLessThanOrEqual(1)
}

async function fullyInViewport(page: Page, selector: ReturnType<Page["locator"]>, label: string) {
  const inView = await selector.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth
  })
  expect(inView, `${label} fully in viewport`).toBe(true)
}

async function touchTargetsAreBigEnough(page: Page) {
  const small = await page.evaluate((min) => {
    const nodes = document.querySelectorAll<HTMLElement>('button, [role="radio"], [role="slider"]')
    const offenders: string[] = []
    nodes.forEach((el) => {
      if (el.closest("[aria-hidden='true']")) return
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      // Icon buttons extend their hit area with an invisible child on touch screens.
      const hit = el.querySelector<HTMLElement>("[data-hit-area]")
      const hr = hit?.getBoundingClientRect()
      const w = Math.max(r.width, hr?.width ?? 0)
      const h = Math.max(r.height, hr?.height ?? 0)
      if (w < min || h < min) offenders.push(`${el.getAttribute("aria-label") ?? el.textContent?.trim()} ${Math.round(w)}x${Math.round(h)}`)
    })
    return offenders
  }, MIN_TARGET)
  expect(small, "touch targets below 44px").toEqual([])
}

async function shoot(page: Page, name: string, outputDir: string) {
  const dir = process.env.SHOTS_DIR ?? outputDir
  await page.screenshot({ path: path.join(dir, "viewports", `${name}.png`), fullPage: false })
}

test.describe("Viewport sweep", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "sweep runs once, on the desktop project")
  })

  for (const vp of ALL) {
    test(`${vp.name} ${vp.width}x${vp.height}: setup and running fit`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })

      const short = vp.height <= 480

      await page.goto("/")
      const start = page.getByRole("button", { name: "Start timer" })
      await expect(start).toBeVisible()
      await page.waitForTimeout(400)
      await noHorizontalOverflow(page)
      await fullyInViewport(page, start, "Start")
      await fullyInViewport(page, page.getByRole("heading", { name: "Mouse Timer" }), "title")
      await touchTargetsAreBigEnough(page)
      // Everything but the smallest screens should show the whole setup without scrolling.
      if (vp.height >= 640 || (short && vp.height >= 360)) {
        const scroll = await page.locator("main").evaluate((el) => el.scrollHeight - el.clientHeight)
        expect(scroll, "setup scroll distance").toBeLessThanOrEqual(0)
      }
      if (short) {
        // The `short:` variant must win over `sm:` for the side-by-side layout to hold.
        const clockSize = await page
          .getByText(/^\d+:\d\d$/)
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
        expect(clockSize, "clock shrinks on short screens").toBeLessThanOrEqual(36)
      }
      await shoot(page, `${vp.name}-setup`, testInfo.outputDir)

      await page.goto("/?minutes=10")
      await page.getByRole("button", { name: "Start timer" }).click()
      await expect(page.getByTestId("remaining-time")).toBeVisible()
      await page.waitForTimeout(400)
      await noHorizontalOverflow(page)
      await fullyInViewport(page, page.getByRole("button", { name: "Hold to pause" }), "pause")
      await fullyInViewport(page, page.getByRole("button", { name: "Back to setup" }), "back")
      await fullyInViewport(page, page.getByTestId("remaining-time"), "time")
      await fullyInViewport(page, page.getByTestId("goal"), "goal cell")
      await touchTargetsAreBigEnough(page)
      const cell = await page.getByTestId("goal").evaluate((el) => el.getBoundingClientRect().width)
      expect(cell, "grid cell size").toBeGreaterThanOrEqual(MIN_CELL)
      if (short) {
        const pause = await page.getByRole("button", { name: "Hold to pause" }).boundingBox()
        expect(pause && pause.x + pause.width / 2, "pause sits beside the grid on short screens").toBeGreaterThan(
          vp.width * 0.7,
        )
      }
      await shoot(page, `${vp.name}-running`, testInfo.outputDir)
    })
  }

  for (const vp of [PHONES[0], landscape(PHONES)[2], TABLETS[0]]) {
    if (!vp) continue
    test(`${vp.name} ${vp.width}x${vp.height}: celebration fits`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(SHORT_RUN_URL)
      await page.getByRole("button", { name: "Start timer" }).click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible({ timeout: SHORT_RUN_TIMEOUT })
      await page.waitForTimeout(1_000)
      await noHorizontalOverflow(page)
      await fullyInViewport(page, dialog, "dialog")
      await fullyInViewport(page, page.getByTestId("play-again"), "Play Again")
      await shoot(page, `${vp.name}-celebration`, testInfo.outputDir)
    })
  }
})
