import { expect, test } from "./fixtures"

interface Manifest {
  icons: Array<{ src: string; purpose?: string }>
  theme_color: string
}

test.describe("PWA assets", () => {
  test("manifest, every icon it lists, the favicon and the service worker resolve", async ({ request, baseURL }) => {
    const manifestResponse = await request.get("/manifest.json")
    expect(manifestResponse.ok()).toBe(true)
    const manifest = (await manifestResponse.json()) as Manifest
    expect(manifest.theme_color).toBe("#a08260")
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true)

    for (const path of [...manifest.icons.map((icon) => icon.src), "/icon.svg", "/apple-icon.png", "/sw.js"]) {
      const response = await request.get(new URL(path, baseURL).toString())
      expect(response.status(), path).toBe(200)
    }
  })
})
