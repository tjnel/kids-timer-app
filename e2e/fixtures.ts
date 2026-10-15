import AxeBuilder from "@axe-core/playwright"
import { test as base, expect, type Page } from "@playwright/test"

type Fixtures = {
  /** Fails the test if the page logged errors or any same-origin request failed. */
  cleanConsole: void
  /** Runs axe on the current page and asserts no serious or critical violations. */
  checkA11y: (label: string) => Promise<void>
}

export const test = base.extend<Fixtures>({
  cleanConsole: [
    async ({ page, baseURL }, provide) => {
      const problems: string[] = []
      const origin = baseURL ? new URL(baseURL).origin : null

      page.on("pageerror", (error) => {
        problems.push(`pageerror: ${error.message}`)
      })
      page.on("console", (message) => {
        if (message.type() === "error") {
          problems.push(`console.error: ${message.text()}`)
        }
      })
      page.on("requestfailed", (request) => {
        const url = request.url()
        if (!origin || url.startsWith(origin)) {
          problems.push(`requestfailed: ${url} ${request.failure()?.errorText ?? ""}`)
        }
      })
      page.on("response", (response) => {
        const url = response.url()
        if ((!origin || url.startsWith(origin)) && response.status() >= 400) {
          problems.push(`http ${response.status()}: ${url}`)
        }
      })

      await provide()

      expect(problems, "page must stay free of errors and failed requests").toEqual([])
    },
    { auto: true },
  ],

  checkA11y: async ({ page }, provide) => {
    await provide(async (label: string) => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "best-practice"])
        .analyze()
      const serious = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      )
      const summary = serious.map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.help} -> ${violation.nodes
            .map((node) => node.target.join(" "))
            .join(", ")}`,
      )
      expect(summary, `axe on ${label}`).toEqual([])
    })
  },
})

export { expect }
export type { Page }

/**
 * A six-second run reaches the celebration quickly. Playwright's fake clock
 * cannot be used instead: framer-motion drives exits through the Web
 * Animations API and syncs their start times to the faked performance.now(),
 * so after a clock jump every exit animation sits tens of seconds in the future.
 */
export const SHORT_RUN_URL = "/?minutes=0.1"
export const SHORT_RUN_TIMEOUT = 15_000
