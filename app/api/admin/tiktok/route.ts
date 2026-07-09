import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { revalidatePublic } from "@/lib/revalidate";
import { tiktokComplianceIssue, type TiktokClassification } from "@/lib/tiktok";

/* Admin TikTok review queue.
   GET  ?status=pending|approved|rejected|removed → submissions for review
   POST { id, action:'approve'|'reject'|'remove', note?, businessSlug? }
   Approve runs a safety/relevance gate, resolves the matched business (AI match
   or admin override via businessSlug), sets matched_business_id, and flips the
   row to 'approved' so it renders on that listing. Admin-gated. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const status = new URL(req.url).searchParams.get("status") || "pending";
  const { data, error } = await db
    .from("tiktok_submissions").select("*").eq("status", status)
    .order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });

  // Attach the matched/claimed business names for the queue UI.
  const rows = data || [];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.matched_business_id, r.claimed_business_id]).filter(Boolean)));
  const names: Record<string, { name: string; slug: string }> = {};
  if (ids.length) {
    const { data: biz } = await db.from("businesses").select("id, name, slug").in("id", ids as string[]);
    for (const b of biz || []) names[String(b.id)] = { name: String(b.name), slug: String(b.slug) };
  }
  return NextResponse.json({ ok: true, submissions: rows, businesses: names });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: { id?: string; action?: string; note?: string; businessSlug?: string } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const id = String(b.id || "");
  const action = String(b.action || "");
  const note = String(b.note || "").slice(0, 400);
  if (!id || !["approve", "reject", "remove"].includes(action)) return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });

  const { data: row } = await db.from("tiktok_submissions").select("id, url, generated, claimed_business_id").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  if (action === "approve") {
    const gen = (row.generated || {}) as Partial<TiktokClassification>;
    // Safety / relevance gate (skippable only by fixing the source, not here).
    if (gen.safe !== undefined) {
      const issue = tiktokComplianceIssue(gen as TiktokClassification);
      if (issue && !b.businessSlug) return NextResponse.json({ ok: false, error: "compliance_blocked", reason: issue }, { status: 409 });
    }
    // Resolve the target business: admin override slug > AI-matched slug > claimed id.
    let matchedId: string | null = null;
    let slug = "";
    const wantSlug = String(b.businessSlug || gen.matchedBusinessSlug || "").trim();
    if (wantSlug) {
      const { data: biz } = await db.from("businesses").select("id, slug").eq("slug", wantSlug).maybeSingle();
      if (biz) { matchedId = String(biz.id); slug = String(biz.slug); }
    }
    if (!matchedId && row.claimed_business_id) {
      const { data: biz } = await db.from("businesses").select("id, slug").eq("id", row.claimed_business_id).maybeSingle();
      if (biz) { matchedId = String(biz.id); slug = String(biz.slug); }
    }
    if (!matchedId) return NextResponse.json({ ok: false, error: "no_match", reason: "No business matched — set a business before approving." }, { status: 422 });

    const { error } = await db.from("tiktok_submissions")
      .update({ status: "approved", matched_business_id: matchedId, reviewed_by: gate.userId, reviewed_at: new Date().toISOString(), review_note: note || null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: "update_failed", detail: error.message }, { status: 502 });

    await logAudit(db, { actor: gate.userId, action: "TikTok video approved", target: id, meta: { url: row.url, businessId: matchedId, slug } });
    if (slug) revalidatePublic([`/business/${slug}`]);
    return NextResponse.json({ ok: true, status: "approved" });
  }

  // reject / remove
  const next = action === "remove" ? "removed" : "rejected";
  const { error } = await db.from("tiktok_submissions")
    .update({ status: next, reviewed_by: gate.userId, reviewed_at: new Date().toISOString(), review_note: note || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  await logAudit(db, { actor: gate.userId, action: `TikTok video ${next}`, target: id, meta: { url: row.url } });
  return NextResponse.json({ ok: true, status: next });
}
