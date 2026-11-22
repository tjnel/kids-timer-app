import { expect, test } from "./fixtures"

interface Manifest {
  id?: string
  scope?: string
  orientation?: string
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
    expect(manifest.id).toBe("/")
    expect(manifest.scope).toBe("/")
    // The app lays itself out for landscape too, so the install must not lock rotation.
    expect(manifest.orientation).toBeUndefined()

    const paths = [...manifest.icons.map((icon) => icon.src), "/icon.svg", "/apple-icon.png", "/favicon.ico", "/sw.js"]
    for (const path of paths) {
      const response = await request.get(new URL(path, baseURL).toString())
      expect(response.status(), path).toBe(200)
    }
  })

  test("everything the service worker precaches exists", async ({ request, baseURL }) => {
    const source = await (await request.get("/sw.js")).text()
    // The lists sit above the first event listener; paths below it are route prefixes.
    const lists = source.slice(0, source.indexOf("self.addEventListener"))
    const precached = [...lists.matchAll(/"(\/[^"]*)"/g)].map((match) => match[1] ?? "")
    expect(precached).toContain("/")
    expect(precached.filter((path) => path.startsWith("/sprites/"))).toHaveLength(8)

    for (const path of precached) {
      const response = await request.get(new URL(path, baseURL).toString())
      expect(response.status(), path).toBe(200)
    }
  })

  test("responses carry the security headers and sprites are cacheable", async ({ request }) => {
    const page = await request.get("/")
    expect(page.headers()["x-content-type-options"]).toBe("nosniff")
    expect(page.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin")
    expect(page.headers()["permissions-policy"]).toContain("camera=()")
    expect(page.headers()["x-powered-by"]).toBeUndefined()

    const sprite = await request.get("/sprites/mouse-idle.png")
    expect(sprite.headers()["cache-control"]).toContain("max-age=86400")
  })
})
