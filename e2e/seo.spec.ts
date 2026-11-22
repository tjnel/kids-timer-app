import { expect, type Page, test } from "./fixtures"

/**
 * What search engines and AI answer engines read: titles, descriptions,
 * canonical links, share cards, structured data, robots, sitemap and llms.txt.
 */

interface JsonLd {
  "@type": string
  url?: string
  mainEntity?: Array<{ name: string; acceptedAnswer: { text: string } }>
}

async function structuredData(page: Page) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  return blocks.map((block) => JSON.parse(block) as JsonLd)
}

function meta(page: Page, selector: string) {
  return page.locator(`head ${selector}`).first()
}

test.describe("SEO", () => {
  test("the timer page describes itself to crawlers and share cards", async ({ page, request }) => {
    await page.goto("/")

    await expect(page).toHaveTitle(/Kids Timer.*Visual Countdown Timer/)
    const description = await meta(page, 'meta[name="description"]').getAttribute("content")
    expect(description?.length ?? 0, "description length").toBeGreaterThan(70)
    expect(description?.length ?? 0, "description length").toBeLessThanOrEqual(160)

    const canonical = await meta(page, 'link[rel="canonical"]').getAttribute("href")
    expect(canonical).toMatch(/^https:\/\/[^/]+\/?$/)

    await expect(meta(page, 'meta[property="og:title"]')).toHaveAttribute("content", /Kids Timer/)
    await expect(meta(page, 'meta[property="og:image:alt"]')).toHaveAttribute("content", /mouse/)
    await expect(meta(page, 'meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image")
    const image = await meta(page, 'meta[property="og:image"]').getAttribute("content")
    expect(image).toBeTruthy()
    const imageResponse = await request.get(new URL(image ?? "").pathname)
    expect(imageResponse.status()).toBe(200)
    expect(imageResponse.headers()["content-type"]).toBe("image/png")

    const data = await structuredData(page)
    expect(data.map((block) => block["@type"])).toEqual(["WebApplication"])
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
  })

  test("the about page answers the common questions, visibly and as structured data", async ({ page, checkA11y }) => {
    await page.goto("/")
    await page.getByRole("link", { name: "About" }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page).toHaveTitle(/About.*Kids Timer/)
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)

    const canonical = await meta(page, 'link[rel="canonical"]').getAttribute("href")
    expect(canonical).toMatch(/\/about$/)
    await expect(meta(page, 'meta[property="og:image"]')).toHaveAttribute("content", /\.png/)

    // Every question in the structured data is on the page, with the same answer.
    const faq = (await structuredData(page)).find((block) => block["@type"] === "FAQPage")
    expect(faq?.mainEntity?.length ?? 0).toBeGreaterThanOrEqual(5)
    for (const entry of faq?.mainEntity ?? []) {
      await expect(page.getByRole("heading", { name: entry.name, exact: true })).toBeVisible()
      await expect(page.getByText(entry.acceptedAnswer.text, { exact: true })).toBeVisible()
    }
    await checkA11y("about")

    await page.getByRole("link", { name: "Open the timer" }).first().click()
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible()
  })

  test("robots, sitemap and llms.txt are served and agree on the address", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text()
    expect(robots).toMatch(/User-Agent: \*/i)
    expect(robots).not.toMatch(/Disallow: \//)
    const sitemapUrl = /Sitemap: (\S+)/.exec(robots)?.[1] ?? ""
    expect(sitemapUrl).toMatch(/^https:\/\/.+\/sitemap\.xml$/)
    const origin = new URL(sitemapUrl).origin

    const sitemap = await (await request.get("/sitemap.xml")).text()
    expect(sitemap).toContain(`<loc>${origin}/</loc>`)
    expect(sitemap).toContain(`<loc>${origin}/about</loc>`)

    const llms = await request.get("/llms.txt")
    expect(llms.status()).toBe(200)
    expect(llms.headers()["content-type"]).toContain("text/plain")
    const text = await llms.text()
    expect(text).toMatch(/^# Kids Timer/)
    expect(text).toContain(`${origin}/about`)
  })
})
