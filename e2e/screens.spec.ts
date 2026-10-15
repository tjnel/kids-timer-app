import path from "node:path"

import { expect, fastForward, type Page, test } from "./fixtures"

/**
 * Walks every screen, runs axe on it, and saves a screenshot per viewport.
 * Set SHOTS_DIR to collect the images somewhere stable; otherwise they land
 * in the Playwright output directory for the test.
 */

async function shoot(page: Page, name: string, projectName: string, outputDir: string) {
  const dir = process.env.SHOTS_DIR ?? outputDir
  await page.screenshot({ path: path.join(dir, projectName, `${name}.png`), fullPage: false })
}

test.describe("Screens", () => {
  test("setup", async ({ page, checkA11y }, testInfo) => {
    await page.goto("/")
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
    await page.waitForTimeout(600)
    await shoot(page, "setup", testInfo.project.name, testInfo.outputDir)
    await checkA11y("setup")
  })

  test("running", async ({ page, checkA11y }, testInfo) => {
    await page.goto("/?minutes=10")
    await page.getByRole("button", { name: "Start timer" }).click()
    await expect(page.getByTestId("remaining-time")).toBeVisible()
    await page.waitForTimeout(600)
    await shoot(page, "running", testInfo.project.name, testInfo.outputDir)
    await checkA11y("running")
  })

  test("celebration", async ({ page, checkA11y }, testInfo) => {
    await page.clock.install()
    await page.goto("/?minutes=0.5")
    await page.getByRole("button", { name: "Start timer" }).click()
    await expect(page.getByTestId("remaining-time")).toBeVisible()
    await fastForward(page, 31_000)
    await expect(page.getByRole("heading", { name: "All done!" })).toBeVisible()
    await fastForward(page, 1_200)
    await shoot(page, "celebration", testInfo.project.name, testInfo.outputDir)
    await checkA11y("celebration")
  })
})
