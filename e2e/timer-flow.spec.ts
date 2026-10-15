import { expect, type Page, test } from "@playwright/test"

function trackFailedAssets(page: Page) {
  const failed: string[] = []
  page.on("response", (response) => {
    const url = response.url()
    const isAsset =
      url.includes("/sprites/") ||
      url.includes("/icon-") ||
      url.includes("/apple-icon")
    if (isAsset && response.status() >= 400) {
      failed.push(`${response.status()} ${url}`)
    }
  })
  return failed
}

function parseClock(text: string) {
  const [minutes, seconds] = text.split(":").map(Number)
  return (minutes ?? 0) * 60 + (seconds ?? 0)
}

async function slideToPause(page: Page) {
  const thumb = page.getByRole("slider", { name: "Slide to pause" })
  await expect(thumb).toBeVisible()
  const box = await thumb.boundingBox()
  if (!box) {
    throw new Error("Pause slider has no box")
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 240, box.y + box.height / 2, { steps: 16 })
  await page.mouse.up()
}

async function startTimer(page: Page) {
  await page.getByRole("button", { name: "Start timer" }).click()
  await expect(page.getByTestId("remaining-time")).toBeVisible()
  await expect(page.getByText("Slide to pause")).toBeVisible()
}

test.describe("Kids mouse timer", () => {
  test("setup shows 2:00 mouse timer and sprites load", async ({ page }) => {
    const failed = trackFailedAssets(page)
    await page.goto("/")

    await expect(page.getByRole("heading", { name: "Mouse Timer" })).toBeVisible()
    await expect(page.getByText("2:00")).toBeVisible()
    await expect(page.getByText("The mouse eats cheese, then runs home.")).toBeVisible()
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Mute sounds" })).toBeVisible()
    await expect(page.getByText("Mouse & Cheese")).toBeVisible()

    await expect.poll(() => failed.slice()).toEqual([])
  })

  test("phone-width setup keeps Start on screen without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto("/")
    const start = page.getByRole("button", { name: "Start timer" })
    await expect(start).toBeVisible()

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflowX).toBeLessThanOrEqual(1)

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

  test("start, pause, resume keeps remaining time from snapping back", async ({
    page,
  }) => {
    await page.goto("/")
    await startTimer(page)

    await page.waitForTimeout(2500)
    const remainingAfterRun = parseClock(
      (await page.getByTestId("remaining-time").textContent()) ?? "2:00",
    )
    expect(remainingAfterRun).toBeLessThan(120)
    expect(remainingAfterRun).toBeGreaterThan(110)
    await expect(page.getByText("0 of 4 pieces")).toBeVisible()

    await slideToPause(page)
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible()
    const remainingAfterPause = parseClock(
      (await page.getByTestId("remaining-time").textContent()) ?? "0:00",
    )
    await expect(page.getByText("0 of 4 pieces")).toBeVisible()

    await page.waitForTimeout(2000)
    const remainingWhilePaused = parseClock(
      (await page.getByTestId("remaining-time").textContent()) ?? "0:00",
    )
    expect(Math.abs(remainingWhilePaused - remainingAfterPause)).toBeLessThanOrEqual(1)

    await page.getByRole("button", { name: "Play" }).click()
    await expect(page.getByText("Slide to pause")).toBeVisible()
    await page.waitForTimeout(2000)
    const remainingAfterResume = parseClock(
      (await page.getByTestId("remaining-time").textContent()) ?? "0:00",
    )
    expect(remainingAfterResume).toBeLessThan(remainingWhilePaused)
    expect(remainingAfterResume).toBeGreaterThan(remainingWhilePaused - 5)
  })

  test("running at phone width does not overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto("/")
    await startTimer(page)

    const overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflowX).toBeLessThanOrEqual(1)
    await expect(page.getByRole("slider", { name: "Slide to pause" })).toBeVisible()
  })

  test("completing the timer then Play Again returns to a full setup", async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.goto("/?minutes=0.5")
    await expect(page.getByText("0:30")).toBeVisible()
    await startTimer(page)

    await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible({
      timeout: 40_000,
    })
    await expect(
      page.getByText("The mouse ate every piece and went home."),
    ).toBeVisible()

    await page.getByTestId("play-again").click()

    await expect(page.getByRole("heading", { name: "All done!" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
    await expect(page.getByText("0:30", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("The mouse eats cheese, then runs home.")).toBeVisible()
  })

  test("race theme start and back to setup", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Race Car" }).click()
    await expect(page.getByRole("heading", { name: "Race Timer" })).toBeVisible()
    await expect(
      page.getByText("The car passes a cone each interval."),
    ).toBeVisible()

    await page.getByRole("button", { name: "Start timer" }).click()
    await expect(page.getByText("Slide to pause")).toBeVisible()

    await page.getByRole("button", { name: "Back to setup" }).click()
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Race Timer" })).toBeVisible()
  })
})
