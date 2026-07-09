import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { revalidatePublic } from "@/lib/revalidate";
import { enrichComplianceIssue, type Enrichment } from "@/lib/listing-enrich";

/* Admin listing-enrichment review queue.
   GET  ?status=pending|approved|rejected → drafts for review
   POST { id, action: 'approve'|'reject', note?, description?, seoTitle?, seoDescription? }
   Approve runs a compliance gate (no unverified halal-certified claims), then
   writes the reviewed description + SEO back to the live business row. Optional
   per-field overrides let the admin tweak before publishing. Admin-gated. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const status = new URL(req.url).searchParams.get("status") || "pending";
  const { data, error } = await db
    .from("listing_enrichments")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
  return NextResponse.json({ ok: true, enrichments: data || [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: { id?: string; action?: string; note?: string; description?: string; seoTitle?: string; seoDescription?: string } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const id = String(b.id || "");
  const action = String(b.action || "");
  const note = String(b.note || "").slice(0, 400);
  if (!id || (action !== "approve" && action !== "reject")) return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });

  const { data: row } = await db.from("listing_enrichments").select("id, business_id, business_slug, generated").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  if (action === "approve") {
    const gen = row.generated as Enrichment;
    // Apply optional admin edits over the AI draft.
    const description = (b.description ?? gen.description ?? "").toString().trim();
    const seoTitle = (b.seoTitle ?? gen.seoTitle ?? "").toString().trim();
    const seoDescription = (b.seoDescription ?? gen.seoDescription ?? "").toString().trim();

    // Compliance gate — never publish an unverified halal-certified claim.
    const { data: biz } = await db.from("businesses").select("halal_tier, slug").eq("id", row.business_id).maybeSingle();
    const issue = enrichComplianceIssue({ ...gen, description, seoTitle, seoDescription }, biz?.halal_tier);
    if (issue) return NextResponse.json({ ok: false, error: "compliance_blocked", reason: issue }, { status: 409 });

    const { error: upErr } = await db.from("businesses")
      .update({ description: description || null, seo_title: seoTitle || null, seo_description: seoDescription || null })
      .eq("id", row.business_id);
    if (upErr) return NextResponse.json({ ok: false, error: "listing_update_failed", detail: upErr.message }, { status: 502 });

    const { error } = await db.from("listing_enrichments")
      .update({ status: "approved", reviewed_by: gate.userId, reviewed_at: new Date().toISOString(), review_note: note || null })
      .eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });

    await logAudit(db, { actor: gate.userId, action: "Listing enrichment approved", target: id, meta: { businessId: row.business_id, slug: row.business_slug } });
    const slug = biz?.slug || row.business_slug;
    revalidatePublic([`/business/${slug}`, "/explore"]);
    return NextResponse.json({ ok: true, status: "approved" });
  }

  // reject
  const { error } = await db.from("listing_enrichments")
    .update({ status: "rejected", reviewed_by: gate.userId, reviewed_at: new Date().toISOString(), review_note: note || null })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  await logAudit(db, { actor: gate.userId, action: "Listing enrichment rejected", target: id, meta: { businessId: row.business_id } });
  return NextResponse.json({ ok: true, status: "rejected" });
}
