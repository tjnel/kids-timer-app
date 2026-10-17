import { expect, type Page, SHORT_RUN_TIMEOUT, SHORT_RUN_URL, test } from "./fixtures"

function parseClock(text: string) {
  const [minutes, seconds] = text.split(":").map(Number)
  return (minutes ?? 0) * 60 + (seconds ?? 0)
}

async function readRemaining(page: Page) {
  return parseClock((await page.getByTestId("remaining-time").textContent()) ?? "0:00")
}

/**
 * Presses the pause control for `ms`. Touch projects drive a real touch
 * sequence through CDP so the long-press path (no trailing click) is exercised.
 */
async function pressNamed(page: Page, name: string, ms: number, hasTouch: boolean) {
  const button = page.getByRole("button", { name })
  await expect(button).toBeVisible()
  const box = await button.boundingBox()
  if (!box) {
    throw new Error(`${name} button has no box`)
  }
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  if (hasTouch) {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] })
    await page.waitForTimeout(ms)
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
    await cdp.detach()
  } else {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.waitForTimeout(ms)
    await page.mouse.up()
  }
}

function pressPause(page: Page, ms: number, hasTouch: boolean) {
  return pressNamed(page, "Hold to pause", ms, hasTouch)
}

async function activate(page: Page, name: string, hasTouch: boolean) {
  const target = page.getByRole("button", { name })
  if (hasTouch) await target.tap()
  else await target.click()
}

async function startTimer(page: Page) {
  await page.getByRole("button", { name: "Start timer" }).click()
  await expect(page.getByTestId("remaining-time")).toBeVisible()
  await expect(page.getByRole("button", { name: "Hold to pause" })).toBeVisible()
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflowX).toBeLessThanOrEqual(1)
}

test.describe("Kids mouse timer", () => {
  test("setup shows the 2:00 mouse timer", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("heading", { name: "Mouse Timer" })).toBeVisible()
    await expect(page.getByText("2:00")).toBeVisible()
    await expect(page.getByText("4 pieces")).toBeVisible()
    await expect(page.getByText("The mouse eats cheese, then runs home.")).toBeVisible()
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Mute sounds" })).toBeVisible()
    await expect(page.getByRole("radio", { name: "Mouse & Cheese" })).toBeChecked()
  })

  test("setup keeps Start on screen without scrolling", async ({ page }) => {
    await page.goto("/")
    const start = page.getByRole("button", { name: "Start timer" })
    await expect(start).toBeVisible()
    await expectNoHorizontalOverflow(page)

    const startInView = await start.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      return (
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.left >= 0 &&
        rect.right <= window.innerWidth
      )
    })
    expect(startInView).toBe(true)
  })

  test("minutes slider works from the keyboard and snaps when the piece length changes", async ({ page }) => {
    await page.goto("/")
    const slider = page.getByRole("slider", { name: "Minutes" })
    await expect(slider).toHaveAttribute("aria-valuenow", "2")

    await slider.focus()
    await page.keyboard.press("ArrowRight")
    await expect(slider).toHaveAttribute("aria-valuenow", "2.5")
    await expect(page.getByText("2:30")).toBeVisible()
    await expect(page.getByText("5 pieces")).toBeVisible()

    // Switching to 1-minute pieces re-snaps 2:30 onto the whole-minute grid.
    await page.getByRole("radio", { name: "1 min" }).click()
    await expect(slider).toHaveAttribute("aria-valuenow", "3")
    await expect(page.getByText("3 pieces")).toBeVisible()

    await slider.focus()
    await page.keyboard.press("Home")
    await expect(slider).toHaveAttribute("aria-valuenow", "1")
    await expect(page.getByText("1:00")).toBeVisible()
  })

  test("start, hold to pause, tap to resume keeps remaining time from snapping back", async ({ page }, testInfo) => {
    const hasTouch = Boolean(testInfo.project.use.hasTouch)
    await page.goto("/")
    await startTimer(page)

    await page.waitForTimeout(2500)
    const remainingAfterRun = await readRemaining(page)
    expect(remainingAfterRun).toBeLessThan(120)
    expect(remainingAfterRun).toBeGreaterThan(115)
    await expect(page.getByRole("img", { name: "0 of 4 cheese pieces eaten" })).toBeVisible()

    await pressPause(page, 900, hasTouch)
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible()
    const remainingAfterPause = await readRemaining(page)

    await page.waitForTimeout(2000)
    const remainingWhilePaused = await readRemaining(page)
    expect(Math.abs(remainingWhilePaused - remainingAfterPause)).toBeLessThanOrEqual(1)

    await activate(page, "Play", hasTouch)
    await expect(page.getByRole("button", { name: "Hold to pause" })).toBeVisible()
    await page.waitForTimeout(2000)
    const remainingAfterResume = await readRemaining(page)
    expect(remainingAfterResume).toBeLessThan(remainingWhilePaused)
    expect(remainingAfterResume).toBeGreaterThan(remainingWhilePaused - 4)
  })

  test("a press shorter than the hold does not pause", async ({ page }, testInfo) => {
    const hasTouch = Boolean(testInfo.project.use.hasTouch)
    await page.goto("/")
    await startTimer(page)

    await pressPause(page, 300, hasTouch)
    await page.waitForTimeout(300)
    await expect(page.getByRole("button", { name: "Hold to pause" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Play" })).toHaveCount(0)
  })

  test("running screen does not overflow and keeps controls in view", async ({ page }) => {
    await page.goto("/")
    await startTimer(page)
    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole("button", { name: "Hold to pause" })).toBeInViewport()
    await expect(page.getByRole("button", { name: "Hold to reset" })).toBeInViewport()
    await expect(page.getByTestId("remaining-time")).toBeInViewport()
    await expect(page.getByRole("button", { name: "Back to setup" })).toBeInViewport()
  })

  test("holding reset restores the full time and stays on the run", async ({ page }, testInfo) => {
    const hasTouch = Boolean(testInfo.project.use.hasTouch)
    await page.goto("/?minutes=10")
    await startTimer(page)
    await page.waitForTimeout(1500)
    expect(await readRemaining(page)).toBeLessThan(600)

    await pressNamed(page, "Hold to reset", 400, hasTouch)
    await page.waitForTimeout(200)
    expect(await readRemaining(page)).toBeLessThan(600)

    await pressNamed(page, "Hold to reset", 2200, hasTouch)
    await expect(page.getByTestId("remaining-time")).toHaveText("10:00")
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Start timer" })).toHaveCount(0)
  })

  test("completing the timer then Play Again returns to a full setup", async ({ page }) => {
    await page.goto(SHORT_RUN_URL)
    await expect(page.getByText("0:06")).toBeVisible()
    await startTimer(page)
    await expect(page.getByRole("img", { name: "0 of 1 cheese piece eaten" })).toBeVisible()

    await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible({
      timeout: SHORT_RUN_TIMEOUT,
    })
    await expect(page.getByText("The mouse ate every piece and went home.")).toBeVisible()
    await expect(page.getByTestId("play-again")).toBeFocused()

    // The mouse ends up inside the mouse hole's cell.
    await expect
      .poll(async () => {
        const runner = await page.getByTestId("runner").boundingBox()
        const goal = await page.getByTestId("goal").boundingBox()
        if (!runner || !goal) return false
        const cx = runner.x + runner.width / 2
        const cy = runner.y + runner.height / 2
        return cx >= goal.x && cx <= goal.x + goal.width && cy >= goal.y && cy <= goal.y + goal.height
      })
      .toBe(true)

    await page.getByTestId("play-again").click()

    await expect(page.getByRole("heading", { name: "All done!" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
    await expect(page.getByText("0:06", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("The mouse eats cheese, then runs home.")).toBeVisible()
  })

  test("Escape closes the celebration", async ({ page }) => {
    await page.goto(SHORT_RUN_URL)
    await startTimer(page)
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: SHORT_RUN_TIMEOUT })

    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
  })

  test("race theme start and back to setup", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("radio", { name: "Race Car" }).click()
    await expect(page.getByRole("heading", { name: "Race Timer" })).toBeVisible()
    await expect(page.getByText("The car passes a cone each interval.")).toBeVisible()

    await page.getByRole("button", { name: "Start timer" }).click()
    await expect(page.getByRole("button", { name: "Hold to pause" })).toBeVisible()
    await expect(page.getByRole("img", { name: "0 of 4 cones passed" })).toBeVisible()

    await page.getByRole("button", { name: "Back to setup" }).click()
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Race Timer" })).toBeVisible()
  })
})
