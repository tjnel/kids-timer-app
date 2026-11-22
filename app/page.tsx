import type { Metadata } from "next"
import { preload } from "react-dom"
import { KidsTimer } from "@/components/kids-timer"
import { SETUP_SPRITES } from "@/components/sprite-sheets"
import { FEATURES, jsonLd, SHARE_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  image: `${SITE_URL}${SHARE_IMAGE.url}`,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  inLanguage: "en",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: FEATURES,
}

export default function Home() {
  // The art on the setup screen is fetched with the page instead of after it.
  for (const sprite of SETUP_SPRITES) preload(sprite, { as: "image" })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <KidsTimer />
    </>
  )
}
