import { FAQS, FEATURES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const dynamic = "force-static"

/** A plain-text summary for AI answer engines, in the llms.txt layout. */
export function GET() {
  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Pages",
    "",
    `- [Kids Timer](${SITE_URL}/): The timer itself. Choose a theme and a length, then press Start.`,
    `- [About Kids Timer](${SITE_URL}/about): What it is, how it works and answers to common questions.`,
    "",
    "## What it does",
    "",
    ...FEATURES.map((feature) => `- ${feature}`),
    "",
    "## Common questions",
    "",
    ...FAQS.flatMap(({ question, answer }) => [`### ${question}`, "", answer, ""]),
  ].join("\n")

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
