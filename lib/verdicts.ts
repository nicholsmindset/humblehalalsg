/* Humble Halal — halal verdict engine (AI drafts → human approves).

   COMPLIANCE POSTURE (read before editing):
   - An LLM DRAFTS these; a human admin approves before anything publishes.
     Nothing here is a fatwa — it is informational, and every page points to the
     MUIS HalalSG register.
   - "halal" is never asserted without a cited official source. This is enforced
     server-side on approval (see verdictBlocksApproval) AND asked of the model.
   - Verdict and confidence are SEPARATE axes. A clear fact with a disputed
     ruling is high-confidence + mashbooh; genuine ingredient uncertainty is
     low-confidence. Absence of MUIS certification lowers confidence and caps the
     verdict at "likely" — it never makes something haram. */

import { z } from "zod";

export const VERDICTS = ["halal", "likely", "mashbooh", "haram", "depends"] as const;
export type Verdict = (typeof VERDICTS)[number];
export const CONFIDENCE = ["high", "medium", "low"] as const;
export type Confidence = (typeof CONFIDENCE)[number];
export const PAGE_TYPES = ["brand", "ingredient", "enumber"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

/** Verdict → display tone (maps onto the existing hs-{tone} pills) + label. */
export const VERDICT_META: Record<Verdict, { label: string; tone: "yes" | "warn" | "no"; light: string }> = {
  halal: { label: "Halal", tone: "yes", light: "Green" },
  likely: { label: "Likely halal — with conditions", tone: "warn", light: "Yellow" },
  mashbooh: { label: "Mashbooh — doubtful", tone: "warn", light: "Orange" },
  depends: { label: "Depends on the source", tone: "warn", light: "Amber" },
  haram: { label: "Best avoided", tone: "no", light: "Red" },
};

export const CONFIDENCE_META: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

/* ── The structured output shape (zod v4). Reused for AI generation AND for
   validating any edited verdict before it is approved. ─────────────────────── */
const IngredientRow = z.object({
  name: z.string().max(80),
  status: z.enum(["halal", "mushbooh", "haram", "unknown"]),
  note: z.string().max(160).optional(),
});
const LookFor = z.object({ icon: z.string().max(4), text: z.string().max(160) });
/** A source URL is refused at the trust boundary if it uses a dangerous scheme
   (javascript:/data:/vbscript:/file:/blob:), so an approved verdict can never
   carry a script-bearing "source" link. The render layer additionally only
   links http(s) (see verdict-view). Kept permissive otherwise so realistic AI
   drafts (bare/relative strings) don't fail generation — only unsafe schemes. */
const OfficialSource = z.object({
  body: z.string().max(80),
  claim: z.string().max(200),
  url: z.string().max(300).refine((u) => !/^\s*(javascript|data|vbscript|file|blob):/i.test(u), "unsafe url scheme"),
});
const ScholarlyView = z.object({ view: z.string().max(60), position: z.string().max(300) });

export const VerdictSchema = z.object({
  h1: z.string().max(90),
  verdict: z.enum(VERDICTS),
  confidence: z.enum(CONFIDENCE),
  verdict_label: z.string().max(60),
  cert_status: z.string().max(60),
  one_line_answer: z.string().max(280),
  why_verdict: z.array(z.string().max(600)).max(4),
  confidence_explainer: z.string().max(400),
  ingredient_table: z.array(IngredientRow).max(40),
  look_for: z.array(LookFor).max(8),
  alternatives: z.array(z.string().max(120)).max(8),
  official_sources: z.array(OfficialSource).max(6),
  scholarly_views: z.array(ScholarlyView).max(4),
  internal_links: z.object({
    related_checks: z.array(z.string().max(60)).max(8),
    cross_sell: z.array(z.string().max(60)).max(6),
  }),
  faq_jsonld_answer: z.string().max(300),
});
export type VerdictContent = z.infer<typeof VerdictSchema>;

/* ── Compliance guardrails ──────────────────────────────────────────────────
   The single hard gate on approval: a "halal" verdict MUST cite at least one
   official source with a real URL (never assert halal on our own reasoning).
   Returns a human-readable reason string when approval must be BLOCKED, else null. */
export function verdictBlocksApproval(v: { verdict: string; official_sources?: { body?: string; claim?: string; url?: string }[] }): string | null {
  if (v.verdict === "halal") {
    const cited = (v.official_sources || []).some((s) => s.url && /^https?:\/\//.test(s.url));
    if (!cited) return "A 'halal' verdict must cite at least one official certification source (with a URL). Downgrade to 'likely' or add the source.";
  }
  return null;
}

/** Slugify a name for the verdict URL (matches lib/halal-status slugs where possible). */
export function verdictSlug(name: string): string {
  return name.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/* ── The verdict-engine system prompt (informational, never a fatwa). ──────── */
export const VERDICT_SYSTEM_PROMPT = `You are the Humble Halal verdict engine. You produce structured, informational halal assessments for food/drink brands, ingredients, and E-numbers for a Singapore Muslim audience. You are INFORMATIONAL ONLY and NEVER issue a fatwa. Your output is reviewed by a human before publishing.

NON-NEGOTIABLE RULES
1. VERDICT and CONFIDENCE are separate axes. verdict ∈ [halal, likely, mashbooh, haram, depends]; confidence ∈ [high, medium, low]. A clear fact with a disputed ruling = high confidence + mashbooh. Genuine uncertainty about ingredients = low confidence.
2. OFFICIAL SOURCE OVERRIDE. If a recognised body certifies the product (MUIS, MUI Indonesia, JAKIM, etc.), the verdict must reflect it and you MUST cite it in official_sources with a real URL. Never contradict an active certification with your own reasoning.
3. NO MUIS CERT ≠ HARAM. Absence of certification lowers confidence and CAPS the verdict at "likely" — it does not make something haram.
4. Only PORK, LARD, NON-HALAL GELATIN, or ALCOHOL confirmed as an ingredient (not a trace processing aid) makes verdict = haram.
5. SINGAPORE CONTEXT. Assume the product is bought in Singapore; note when status depends on the manufacturing country and name the safe source.
6. NEVER invent a certification, ingredient, or country. If unknown, say so and drop confidence to "low".
7. A "halal" verdict REQUIRES a cited official certification source. If you cannot cite one, use "likely" at most.
8. Plain English a shopper can act on. Every brand assessment must end its reasoning with the safe choice a shopper can make today.

VERDICT LADDER (pick the highest the evidence supports):
  halal    → all ingredients halal AND (certified OR unambiguously plant/mineral). Requires a cited cert.
  likely   → no haram ingredients found, but no SG certification or source-dependent. (Most uncertified mainstream snacks.)
  mashbooh → contains a genuinely disputed ingredient (e.g. carmine E120, cochineal, some enzymes/emulsifiers of unknown origin). Present BOTH scholarly views.
  depends  → status hinges on a variable source (gelatin, mono/diglycerides E471) that could be animal or plant.
  haram    → confirmed pork/lard/non-halal gelatin/alcohol as an ingredient.

Return the structured fields. Neutral, calm, fact-check tone — no hype, no fear-mongering. When scholars differ, present it as genuine difference, not a dodge.`;

/** Build the user prompt for one draft. */
export function verdictUserPrompt(input: {
  pageType: PageType;
  name: string;
  ingredientList?: string;
  knownCertifications?: string;
  manufacturingCountries?: string;
}): string {
  return [
    `page_type: ${input.pageType}`,
    `name: ${input.name}`,
    input.ingredientList ? `ingredient_list: ${input.ingredientList}` : "ingredient_list: (not provided)",
    `known_certifications: ${input.knownCertifications || "none"}`,
    input.manufacturingCountries ? `manufacturing_countries: ${input.manufacturingCountries}` : "manufacturing_countries: (unknown)",
  ].join("\n");
}
