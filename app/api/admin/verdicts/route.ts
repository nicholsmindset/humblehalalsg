import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getServerFlags } from "@/lib/feature-flags";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { revalidatePublic } from "@/lib/revalidate";
import { verdictBlocksApproval } from "@/lib/verdicts";
import { submitIndexNow } from "@/lib/indexnow";
import { SITE } from "@/lib/seo";

/* Admin halal-verdict review queue.
   GET  ?status=pending|approved|rejected  → verdicts for review
   POST { id, action: 'approve'|'reject', note? }
   Approve enforces the compliance gate: a 'halal' verdict must cite an official
   source (verdictBlocksApproval). Approving flips status→approved and, because
   the unique index allows one approved verdict per slug, first supersedes any
   previously-approved verdict for the same slug. Admin-gated; service role after. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const status = new URL(req.url).searchParams.get("status") || "pending";
  const { data, error } = await db
    .from("halal_verdicts")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
  return NextResponse.json({ ok: true, verdicts: data || [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  // Kill-switch is authoritative on the WRITE path too — with the flag off, the
  // whole feature is inert, not just the public render (audit halalVerdicts-02).
  if (!(await getServerFlags()).halalVerdicts) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let id = "", action = "", note = "";
  try {
    const b = (await req.json()) as { id?: string; action?: string; note?: string };
    id = String(b.id || ""); action = String(b.action || ""); note = String(b.note || "").slice(0, 400);
  } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  if (!id || (action !== "approve" && action !== "reject")) return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });

  const { data: v } = await db.from("halal_verdicts").select("id, slug, verdict, official_sources").eq("id", id).maybeSingle();
  if (!v) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  if (action === "approve") {
    // Compliance gate: never publish a 'halal' verdict without a cited source.
    const blocked = verdictBlocksApproval({
      verdict: v.verdict,
      official_sources: (v.official_sources as { url?: string }[]) || [],
    });
    if (blocked) return NextResponse.json({ ok: false, error: "compliance_blocked", reason: blocked }, { status: 409 });

    // Atomic supersede + promote in ONE transaction: retire any previously-
    // approved sibling AND flip this row to approved together, so a reader never
    // sees the slug with zero approved and a partial failure can't strand it
    // with no live page (the two-statement version could).
    const { data: slug, error } = await db.rpc("approve_verdict", { p_id: id, p_reviewer: gate.userId, p_note: note || null });
    if (error || !slug) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });

    await logAudit(db, { actor: gate.userId, action: "Halal verdict approved", target: id, meta: { slug: v.slug, verdict: v.verdict } });
    revalidatePublic([`/is-halal/${v.slug}`, "/is-halal"]);
    // Ping IndexNow so Bing & partners crawl the newly-published page within
    // minutes instead of the next sitemap sweep. Fails soft (no key → no-op).
    await submitIndexNow([`${SITE.url}/is-halal/${v.slug}`]);
    return NextResponse.json({ ok: true, status: "approved" });
  }

  const { error } = await db
    .from("halal_verdicts")
    .update({ status: "rejected", reviewed_by: gate.userId, reviewed_at: new Date().toISOString(), review_note: note || null })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });

  await logAudit(db, { actor: gate.userId, action: "Halal verdict rejected", target: id, meta: { slug: v.slug, verdict: v.verdict } });
  return NextResponse.json({ ok: true, status: "rejected" });
}
