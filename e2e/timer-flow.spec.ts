import { expect, type Page, SHORT_RUN_TIMEOUT, SHORT_RUN_URL, test } from "./fixtures"

function parseClock(text: string) {
  const [minutes, seconds] = text.split(":").map(Number)
  return (minutes ?? 0) * 60 + (seconds ?? 0)
}

async function readRemaining(page: Page) {
  return parseClock((await page.getByTestId("remaining-time").textContent()) ?? "0:00")
}

async function holdToPause(page: Page) {
  const button = page.getByRole("button", { name: "Hold to pause" })
  await expect(button).toBeVisible()
  const box = await button.boundingBox()
  if (!box) {
    throw new Error("Pause button has no box")
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(900)
  await page.mouse.up()
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

  test("minutes slider works from the keyboard", async ({ page }) => {
    await page.goto("/")
    const slider = page.getByRole("slider", { name: "Minutes" })
    await expect(slider).toHaveAttribute("aria-valuenow", "2")

    await slider.focus()
    await page.keyboard.press("ArrowRight")
    await expect(slider).toHaveAttribute("aria-valuenow", "2.5")
    await expect(page.getByText("2:30")).toBeVisible()
    await expect(page.getByText("5 pieces")).toBeVisible()

    await page.keyboard.press("Home")
    await expect(slider).toHaveAttribute("aria-valuenow", "0.5")
    await expect(page.getByText("0:30")).toBeVisible()
  })

  test("start, pause, resume keeps remaining time from snapping back", async ({ page }) => {
    await page.goto("/")
    await startTimer(page)

    await page.waitForTimeout(2500)
    const remainingAfterRun = await readRemaining(page)
    expect(remainingAfterRun).toBeLessThan(120)
    expect(remainingAfterRun).toBeGreaterThan(110)
    await expect(page.getByRole("img", { name: "0 of 4 cheese pieces eaten" })).toBeVisible()

    await holdToPause(page)
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible()
    const remainingAfterPause = await readRemaining(page)

    await page.waitForTimeout(2000)
    const remainingWhilePaused = await readRemaining(page)
    expect(Math.abs(remainingWhilePaused - remainingAfterPause)).toBeLessThanOrEqual(1)

    await page.getByRole("button", { name: "Play" }).click()
    await expect(page.getByRole("button", { name: "Hold to pause" })).toBeVisible()
    await page.waitForTimeout(2000)
    const remainingAfterResume = await readRemaining(page)
    expect(remainingAfterResume).toBeLessThan(remainingWhilePaused)
    expect(remainingAfterResume).toBeGreaterThan(remainingWhilePaused - 5)
  })

  test("a quick tap while running does not pause", async ({ page }) => {
    await page.goto("/")
    await startTimer(page)

    await page.getByRole("button", { name: "Hold to pause" }).click()
    await page.waitForTimeout(300)
    await expect(page.getByRole("button", { name: "Hold to pause" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Play" })).toHaveCount(0)
  })

  test("running screen does not overflow and keeps controls in view", async ({ page }) => {
    await page.goto("/")
    await startTimer(page)
    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole("button", { name: "Hold to pause" })).toBeInViewport()
    await expect(page.getByTestId("remaining-time")).toBeInViewport()
    await expect(page.getByRole("button", { name: "Back to setup" })).toBeInViewport()
  })

  test("completing the timer then Play Again returns to a full setup", async ({ page }) => {
    await page.goto(SHORT_RUN_URL)
    await expect(page.getByText("0:06")).toBeVisible()
    await startTimer(page)

    await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible({
      timeout: SHORT_RUN_TIMEOUT,
    })
    await expect(page.getByText("The mouse ate every piece and went home.")).toBeVisible()
    await expect(page.getByTestId("play-again")).toBeFocused()

    await page.getByTestId("play-again").click()

    await expect(page.getByRole("heading", { name: "All done!" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
    await expect(page.getByText("0:06", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("The mouse eats cheese, then runs home.")).toBeVisible()
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
