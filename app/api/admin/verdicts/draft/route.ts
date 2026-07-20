import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getServerFlags } from "@/lib/feature-flags";
import { PAGE_TYPES, type PageType } from "@/lib/verdicts";
import { generateVerdictRow } from "@/lib/verdict-draft";

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

  const { aiConfigured } = await import("@/lib/ai");
  if (!aiConfigured) return NextResponse.json({ ok: false, error: "ai_not_configured" }, { status: 503 });

  const row = await generateVerdictRow({
    pageType, name,
    ingredientList: body.ingredientList,
    knownCertifications: body.knownCertifications,
    manufacturingCountries: body.manufacturingCountries,
  });
  if (!row) return NextResponse.json({ ok: false, error: "draft_failed" }, { status: 502 });

  const { data, error } = await db.from("halal_verdicts").insert(row).select("id").maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: "insert_failed", detail: error.message }, { status: 502 });

  await logAudit(db, { actor: gate.userId, action: "Drafted halal verdict (AI)", target: data?.id, meta: { slug: row.slug, verdict: row.verdict } });
  return NextResponse.json({ ok: true, id: data?.id, slug: row.slug, verdict: row.verdict, confidence: row.confidence });
}
