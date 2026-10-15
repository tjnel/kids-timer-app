import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = `http://127.0.0.1:${PORT}`

// The gate runs against the production build, which is what ships.
// Set E2E_DEV=1 to iterate against `next dev` instead.
const useDevServer = !!process.env.E2E_DEV
const command = useDevServer
  ? `pnpm exec next dev --hostname 127.0.0.1 --port ${PORT}`
  : `pnpm exec next build && pnpm exec next start --hostname 127.0.0.1 --port ${PORT}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command,
    url: baseURL,
    reuseExistingServer: useDevServer && !process.env.CI,
    timeout: 240_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
    {
      name: "phone",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "small-phone",
      use: { ...devices["Pixel 7"], viewport: { width: 320, height: 640 } },
    },
  ],
})
