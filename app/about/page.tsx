import type { Metadata } from "next"
import Link from "next/link"
import { FAQS, FEATURES, jsonLd, SHARE_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site"

const TITLE = "About Kids Timer: How the Visual Countdown Timer Works"
const DESCRIPTION =
  "How Kids Timer works: a free visual countdown timer where a mouse eats cheese or a race car passes cones, so young children can see how much time is left."

export const metadata: Metadata = {
  title: "About: How the Visual Countdown Timer Works",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "article",
    url: "/about",
    siteName: SITE_NAME,
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [SHARE_IMAGE] },
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url: `${SITE_URL}/about`,
  mainEntity: FAQS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
}

const STEPS = [
  "Pick a theme: Mouse & Cheese or Race Car.",
  "Choose how long one piece lasts: 30 seconds or 1 minute.",
  "Set the time with the slider or a preset, from 30 seconds up to 15 minutes.",
  "Press Start. The mouse eats one piece of cheese at a time, or the car passes one cone at a time.",
  "When the last piece is gone the mouse runs home, or the car reaches the finish flag, and the screen celebrates.",
]

const USES = [
  "Brushing teeth",
  "Tidying up before the next activity",
  "Getting dressed or getting shoes on",
  "Taking turns with a toy",
  "Counting down to the end of screen time",
  "Quiet time or a short wait",
]

const linkClass =
  "inline-flex min-h-12 items-center rounded-full bg-primary px-8 py-3 text-lg font-extrabold text-primary-foreground shadow-[0_4px_0_rgba(46,26,8,0.3)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-foreground-strong"

export default function About() {
  return (
    <div className="min-h-dvh bg-background px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-card-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <main className="mx-auto flex max-w-2xl flex-col gap-6 rounded-[1.75rem] bg-card p-6 text-lg leading-relaxed sm:p-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl">
            Kids Timer: a visual countdown timer for young children
          </h1>
          <p>
            Kids Timer turns waiting into something a child can watch. The time is shown as a grid of pieces. A mouse
            eats its way through the cheese and then runs home, or a race car passes cone after cone to the finish
            flag. When the pieces are gone, time is up.
          </p>
          <p>
            <Link href="/" className={linkClass}>
              Open the timer
            </Link>
          </p>
        </header>

        <section aria-labelledby="how-it-works" className="flex flex-col gap-3">
          <h2 id="how-it-works" className="text-2xl font-extrabold tracking-tight">
            How it works
          </h2>
          <ol className="flex list-decimal flex-col gap-2 pl-6">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="good-for" className="flex flex-col gap-3">
          <h2 id="good-for" className="text-2xl font-extrabold tracking-tight">
            What parents and teachers use it for
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-6">
            {USES.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="features" className="flex flex-col gap-3">
          <h2 id="features" className="text-2xl font-extrabold tracking-tight">
            What it does
          </h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            {FEATURES.map((feature) => (
              <li key={feature}>{feature}.</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="questions" className="flex flex-col gap-4">
          <h2 id="questions" className="text-2xl font-extrabold tracking-tight">
            Questions parents ask
          </h2>
          {FAQS.map(({ question, answer }) => (
            <div key={question} className="flex flex-col gap-1">
              <h3 className="text-xl font-extrabold">{question}</h3>
              <p>{answer}</p>
            </div>
          ))}
        </section>

        <p>
          <Link href="/" className={linkClass}>
            Open the timer
          </Link>
        </p>
      </main>
    </div>
  )
}
