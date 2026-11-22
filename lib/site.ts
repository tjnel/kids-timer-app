/**
 * Where the site lives and how it describes itself. Everything a crawler or a
 * share card reads (metadata, robots, sitemap, structured data, llms.txt) comes
 * from here so the surfaces cannot drift apart.
 *
 * The address is the same on every deployment, previews included, so a preview
 * never names itself as the canonical page. Set NEXT_PUBLIC_SITE_URL to
 * override it if the site moves.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://timerfor.kids").replace(/\/+$/, "")

export const SITE_NAME = "Kids Timer"

export const SITE_TITLE = "Kids Timer – Visual Countdown Timer for Young Children"

export const SITE_DESCRIPTION =
  "Free visual countdown timer for toddlers and young children. Set up to 15 minutes and watch a mouse eat cheese or a race car pass cones. Works offline, no ads."

/** The card shown when a link to the site is shared. */
export const SHARE_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Kids Timer: a mouse sits beside three pieces of cheese, and a red race car drives towards a chequered finish flag.",
}

/** What the app does, in plain statements that hold for the app as it ships. */
export const FEATURES = [
  "Two themes: a mouse that eats cheese and runs home, and a race car that passes cones to a finish flag",
  "Timer lengths from 30 seconds to 15 minutes, with one-tap presets for 1, 2, 3, 5, 10 and 15 minutes",
  "Time shown as a grid of pieces, each lasting 30 seconds or 1 minute, so a child can see how much is left without reading a clock",
  "Pause and reset need a press-and-hold, so a child tapping the screen does not stop the timer",
  "Optional ticking, a sound as each piece finishes and a fanfare at the end, with a mute button that is remembered",
  "Keeps the screen awake while the timer runs, on devices that support it",
  "Works offline after the first visit and can be added to a phone or tablet home screen",
  "A length can be bookmarked by adding ?minutes= to the address, for example ?minutes=5",
  "Free to use, with no ads and no account",
] as const

export interface Faq {
  question: string
  answer: string
}

/** Shown on /about and mirrored word for word in that page's FAQ structured data. */
export const FAQS: Faq[] = [
  {
    question: "What is Kids Timer?",
    answer:
      "Kids Timer is a free visual countdown timer for toddlers and young children. Instead of only showing numbers, it shows the time as a grid of pieces. A mouse eats one piece of cheese at a time and then runs home, or a race car passes one cone at a time and reaches the finish flag.",
  },
  {
    question: "Why use a visual timer with a young child?",
    answer:
      "Most young children cannot read a clock yet. Watching pieces disappear one by one shows how much time is left and how close the end is, which makes waiting, tidying up or finishing an activity easier to understand.",
  },
  {
    question: "How long can the timer run?",
    answer:
      "From 30 seconds to 15 minutes. Drag the slider or tap a preset for 1, 2, 3, 5, 10 or 15 minutes. Each piece on the screen lasts either 30 seconds or 1 minute, whichever you choose.",
  },
  {
    question: "How do I pause, reset or stop the timer?",
    answer:
      "Press and hold the pause button for a moment to pause, then tap it to carry on. Press and hold the reset button to put the time back to the start. The arrow in the top corner goes back to the setup screen. Pause and reset need a hold on purpose, so a child tapping the screen does not stop the timer.",
  },
  {
    question: "Does it make sound?",
    answer:
      "Yes. It ticks each second, plays a short sound as each piece finishes and plays a fanfare at the end. The speaker button turns sound off and on, and the choice is remembered on that device.",
  },
  {
    question: "Does Kids Timer work offline?",
    answer:
      "Yes. After the first visit it keeps working without a connection, and it can be added to the home screen of a phone or tablet so it opens like an app.",
  },
  {
    question: "Can I save a timer length?",
    answer:
      "Yes. Add ?minutes= and a number to the address, for example ?minutes=5 for five minutes, then bookmark that page. Lengths up to 15 minutes are accepted.",
  },
  {
    question: "Is Kids Timer free?",
    answer: "Yes. Kids Timer is free to use, has no ads and does not need an account.",
  },
]

/** Serialises structured data for a script tag; `<` is escaped so the JSON cannot close the tag. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
