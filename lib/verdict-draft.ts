import "server-only";
import {
  VerdictSchema, VERDICT_SYSTEM_PROMPT, verdictUserPrompt, verdictSlug,
  type PageType,
} from "@/lib/verdicts";

/* Shared AI-draft step for halal verdicts — one implementation for the admin
   "Draft with AI" button AND the verdict-drafts cron, so the prompt, schema
   and row shape can never drift apart. Generates a structured verdict and
   returns the halal_verdicts row to insert as status='pending'. It NEVER
   publishes — a human approves via /api/admin/verdicts. Returns null when the
   AI gateway is absent or generation fails (callers degrade gracefully). */

export interface VerdictDraftInput {
  pageType: PageType;
  name: string;
  ingredientList?: string;
  knownCertifications?: string;
  manufacturingCountries?: string;
}

export async function generateVerdictRow(input: VerdictDraftInput): Promise<Record<string, unknown> | null> {
  const { aiObject, aiConfigured, AI_MODEL } = await import("@/lib/ai");
  if (!aiConfigured) return null;

  const content = await aiObject(VerdictSchema, {
    model: AI_MODEL, // stronger model — verdicts need careful reasoning
    system: VERDICT_SYSTEM_PROMPT,
    prompt: verdictUserPrompt(input),
  });
  if (!content) return null;

  return {
    slug: verdictSlug(input.name),
    page_type: input.pageType,
    name: input.name,
    h1: content.h1,
    verdict: content.verdict,
    confidence: content.confidence,
    verdict_label: content.verdict_label,
    cert_status: content.cert_status,
    one_line_answer: content.one_line_answer,
    confidence_explainer: content.confidence_explainer,
    date_reviewed: new Date().toISOString().slice(0, 10),
    why_verdict: content.why_verdict,
    ingredient_table: content.ingredient_table,
    look_for: content.look_for,
    alternatives: content.alternatives,
    official_sources: content.official_sources,
    scholarly_views: content.scholarly_views,
    internal_links: content.internal_links,
    faq_answer: content.faq_jsonld_answer,
    source_input: {
      ingredientList: input.ingredientList || null,
      knownCertifications: input.knownCertifications || null,
      manufacturingCountries: input.manufacturingCountries || null,
    },
    status: "pending",
    drafted_by: "ai",
  };
}
