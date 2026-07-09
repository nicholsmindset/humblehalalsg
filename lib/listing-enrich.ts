import { z } from "zod";

/* AI listing-enrichment (Phase 1: text + SEO). Defines the structured-output
   schema the LLM must return and the prompts. Mirrors lib/verdicts.ts.

   HALAL-SAFETY: the model must never assert or imply halal *certification* — that
   status comes only from the MUIS verification workflow (never from AI). It only
   rewords owner-submitted facts and fills SEO; it must not invent menu items,
   awards, history, prices, or certification. Every draft is human-reviewed before
   it touches the live listing. */

export const EnrichmentSchema = z.object({
  tagline: z.string().describe("A short, factual one-liner (max ~60 chars). No halal-certified claims, no superlatives you can't ground."),
  description: z.string().describe("A clean 2-4 sentence description built ONLY from the provided facts. Warm, trustworthy, concise. Never claim halal certification; if the input says self-declared/Muslim-owned, you may say that plainly."),
  seoTitle: z.string().describe("SEO <title>, <= 60 chars. Include the business name + area + category where natural. No clickbait."),
  seoDescription: z.string().describe("Meta description, <= 155 chars. Factual summary that would earn a click. No halal-certified claim unless the input explicitly states MUIS certification."),
  cuisineTags: z.array(z.string()).max(6).describe("Up to 6 short cuisine/offering tags grounded in the input (e.g. 'Nasi Padang', 'Western', 'Cafe'). Empty if unknown."),
  highlights: z.array(z.string()).max(4).describe("Up to 4 short factual highlights grounded in the input (e.g. 'Prayer space nearby', 'Halal-friendly menu'). Empty if none are grounded."),
});

export type Enrichment = z.infer<typeof EnrichmentSchema>;

export const ENRICH_SYSTEM_PROMPT = `You are an editor for Humble Halal, Singapore's trusted halal & Muslim-owned business directory. You clean up owner-submitted listings so the directory reads consistently and professionally.

STRICT RULES — a halal directory is a trust product:
1. NEVER assert or imply halal *certification* ("MUIS-certified", "halal certified") unless the input explicitly says the business is MUIS-certified. Certification is verified elsewhere, never by you.
2. Use ONLY facts present in the input. Do NOT invent menu items, dishes, prices, awards, opening years, ratings, or claims. If a fact isn't given, omit it.
3. Neutral, warm, concise brand voice. No hype, no superlatives you can't ground ("best", "amazing").
4. If the input marks the business self-declared / Muslim-owned / not certified, you may state that plainly and honestly.
5. Keep it Singapore-appropriate and respectful of the Muslim community.

Return only the structured fields requested. Prefer empty arrays/short text over guessing.`;

export function enrichUserPrompt(input: {
  name: string;
  category?: string | null;
  area?: string | null;
  priceLevel?: string | null;
  halalTier?: string | null;
  attributes?: string[] | null;
  existingDescription?: string | null;
}): string {
  const facts: string[] = [
    `Business name: ${input.name}`,
    input.category ? `Category: ${input.category}` : "",
    input.area ? `Area: ${input.area}` : "",
    input.priceLevel ? `Price level: ${input.priceLevel}` : "",
    input.halalTier ? `Halal status (as recorded): ${input.halalTier}` : "",
    input.attributes?.length ? `Attributes/facilities: ${input.attributes.join(", ")}` : "",
    input.existingDescription ? `Owner-submitted description: ${input.existingDescription}` : "Owner-submitted description: (none provided)",
  ].filter(Boolean);

  return `Improve this listing for the directory. Rewrite the description, write SEO fields, and extract grounded tags/highlights — using ONLY the facts below. Do not invent anything.\n\n${facts.join("\n")}`;
}

/** Compliance gate run at approval time: block a draft that claims halal
 *  certification for a business not recorded as MUIS-certified. Returns a reason
 *  string when blocked, else null. */
export function enrichComplianceIssue(gen: Enrichment, halalTier?: string | null): string | null {
  const certified = ["certified", "muis"].includes(String(halalTier || "").toLowerCase());
  if (certified) return null;
  const text = `${gen.tagline} ${gen.description} ${gen.seoTitle} ${gen.seoDescription} ${gen.highlights.join(" ")} ${gen.cuisineTags.join(" ")}`.toLowerCase();
  if (/(muis[-\s]?certified|halal[-\s]?certified|certified\s+halal)/.test(text)) {
    return "Draft claims halal certification, but this business is not recorded as MUIS-certified. Edit the source or reject.";
  }
  return null;
}
