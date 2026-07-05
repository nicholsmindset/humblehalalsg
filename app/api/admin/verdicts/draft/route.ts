import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getServerFlags } from "@/lib/feature-flags";
import {
  VerdictSchema, VERDICT_SYSTEM_PROMPT, verdictUserPrompt, verdictSlug,
  PAGE_TYPES, type PageType,
} from "@/lib/verdicts";

/* Admin-triggered AI verdict DRAFT. Generates a structured verdict with the
   LLM (via lib/ai → Vercel AI Gateway) and inserts it as status='pending'.
   It NEVER publishes — a human approves via /api/admin/verdicts. Uses the
   stronger model for reasoning quality; degrades gracefully when the gateway
   key or Supabase is absent. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await getServerFlags()).halalVerdicts) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let body: { pageType?: string; name?: string; ingredientList?: string; knownCertifications?: string; manufacturingCountries?: string } = {};
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const pageType = (PAGE_TYPES as readonly string[]).includes(body.pageType || "") ? (body.pageType as PageType) : "brand";
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "missing_name" }, { status: 422 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const { aiObject, aiConfigured, AI_MODEL } = await import("@/lib/ai");
  if (!aiConfigured) return NextResponse.json({ ok: false, error: "ai_not_configured" }, { status: 503 });

  const content = await aiObject(VerdictSchema, {
    model: AI_MODEL, // stronger model — verdicts need careful reasoning
    system: VERDICT_SYSTEM_PROMPT,
    prompt: verdictUserPrompt({
      pageType, name,
      ingredientList: body.ingredientList,
      knownCertifications: body.knownCertifications,
      manufacturingCountries: body.manufacturingCountries,
    }),
  });
  if (!content) return NextResponse.json({ ok: false, error: "draft_failed" }, { status: 502 });

  const slug = verdictSlug(name);
  const today = new Date().toISOString().slice(0, 10);

  const row = {
    slug,
    page_type: pageType,
    name,
    h1: content.h1,
    verdict: content.verdict,
    confidence: content.confidence,
    verdict_label: content.verdict_label,
    cert_status: content.cert_status,
    one_line_answer: content.one_line_answer,
    confidence_explainer: content.confidence_explainer,
    date_reviewed: today,
    why_verdict: content.why_verdict,
    ingredient_table: content.ingredient_table,
    look_for: content.look_for,
    alternatives: content.alternatives,
    official_sources: content.official_sources,
    scholarly_views: content.scholarly_views,
    internal_links: content.internal_links,
    faq_answer: content.faq_jsonld_answer,
    source_input: {
      ingredientList: body.ingredientList || null,
      knownCertifications: body.knownCertifications || null,
      manufacturingCountries: body.manufacturingCountries || null,
    },
    status: "pending",
    drafted_by: "ai",
  };

  const { data, error } = await db.from("halal_verdicts").insert(row).select("id").maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: "insert_failed", detail: error.message }, { status: 502 });

  await logAudit(db, { actor: gate.userId, action: "Drafted halal verdict (AI)", target: data?.id, meta: { slug, verdict: content.verdict } });
  return NextResponse.json({ ok: true, id: data?.id, slug, verdict: content.verdict, confidence: content.confidence });
}
