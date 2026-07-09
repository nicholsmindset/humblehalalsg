import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { getServerFlags } from "@/lib/feature-flags";
import { categories } from "@/lib/data";
import { TiktokSchema, TIKTOK_SYSTEM_PROMPT, tiktokUserPrompt } from "@/lib/tiktok";

/* Admin-triggered AI classification for one TikTok submission. Classifies the
   video (food-related? safe?) and place-matches it to ONE candidate business,
   writing the result onto the submission row as a DRAFT (never approves). A
   human approves via /api/admin/tiktok. Graceful when AI/Supabase absent. */
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const catLabel = (id: unknown) => categories.find((c) => c.id === String(id))?.label || null;

export async function POST(req: Request) {
  if (!(await getServerFlags()).tiktokUgc) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let id = "";
  try { const b = (await req.json()) as { id?: string }; id = String(b.id || "").trim(); }
  catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 422 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const { data: sub } = await db.from("tiktok_submissions")
    .select("id, url, handle, note, claimed_business_id, status").eq("id", id).maybeSingle();
  if (!sub) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  // Build candidate businesses: the submitter's claimed business first, then a
  // few name-matched published businesses (from the note / handle keywords).
  const candidates: { slug: string; name: string; area?: string | null; category?: string | null }[] = [];
  let claimedName: string | null = null;
  if (sub.claimed_business_id) {
    const { data: biz } = await db.from("businesses")
      .select("slug, name, area, cat_id").eq("id", sub.claimed_business_id).maybeSingle();
    if (biz) { claimedName = String(biz.name); candidates.push({ slug: String(biz.slug), name: String(biz.name), area: biz.area as string, category: catLabel(biz.cat_id) }); }
  }
  const keywords = `${sub.note || ""} ${sub.handle || ""}`.replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4).slice(0, 4);
  for (const kw of keywords) {
    if (candidates.length >= 12) break;
    const { data: hits } = await db.from("businesses")
      .select("slug, name, area, cat_id").eq("status", "published").ilike("name", `%${kw}%`).limit(6);
    for (const h of (hits as Row[]) || []) {
      const slug = String(h.slug);
      if (!candidates.some((c) => c.slug === slug)) candidates.push({ slug, name: String(h.name), area: h.area as string, category: catLabel(h.cat_id) });
    }
  }

  const { aiObject, aiConfigured, AI_MODEL_FAST } = await import("@/lib/ai");
  if (!aiConfigured) return NextResponse.json({ ok: false, error: "ai_not_configured" }, { status: 503 });

  const generated = await aiObject(TiktokSchema, {
    model: AI_MODEL_FAST,
    system: TIKTOK_SYSTEM_PROMPT,
    prompt: tiktokUserPrompt({ url: String(sub.url), handle: sub.handle as string, note: sub.note as string, claimedBusinessName: claimedName, candidates }),
  });
  if (!generated) return NextResponse.json({ ok: false, error: "draft_failed" }, { status: 502 });

  const { error } = await db.from("tiktok_submissions")
    .update({ generated, model: AI_MODEL_FAST, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed", detail: error.message }, { status: 502 });

  await logAudit(db, { actor: gate.userId, action: "Drafted TikTok classification (AI)", target: id, meta: { url: sub.url, match: generated.matchedBusinessSlug } });
  return NextResponse.json({ ok: true, id, generated, candidates });
}
