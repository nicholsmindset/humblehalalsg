import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { revalidatePublic } from "@/lib/revalidate";
import { getServerFlags } from "@/lib/feature-flags";
import { findRealPhoto, upscaleImage, rehostImage, firecrawlConfigured } from "@/lib/enrich-image";

/* Admin listing image enrichment (Phase 2 upscale + Phase 3 acquisition).
   POST { businessId, action: 'find' }               → find a real photo (Firecrawl),
     optionally upscale (fal), re-host to storage, return a candidate URL. Does NOT
     touch the live listing.
   POST { businessId, action: 'apply', candidateUrl } → set the candidate as the
     listing's cover photo. Admin + listingEnrichment flag gated. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await getServerFlags()).listingEnrichment) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: { businessId?: string; action?: string; candidateUrl?: string } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const businessId = String(b.businessId || "").trim();
  const action = String(b.action || "find");
  if (!businessId) return NextResponse.json({ ok: false, error: "missing_business" }, { status: 422 });

  const { data: biz } = await db.from("businesses").select("id, slug, name, website, photos").eq("id", businessId).maybeSingle();
  if (!biz) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  if (action === "find") {
    if (!firecrawlConfigured) return NextResponse.json({ ok: false, error: "firecrawl_not_configured" }, { status: 503 });
    const found = await findRealPhoto(biz.name, biz.website);
    if (!found) return NextResponse.json({ ok: false, error: "no_photo_found" }, { status: 404 });
    const upscaled = await upscaleImage(found); // Phase 2 — graceful no-op without FAL_KEY
    const candidateUrl = await rehostImage(db, biz.slug || businessId, upscaled);
    if (!candidateUrl) return NextResponse.json({ ok: false, error: "rehost_failed" }, { status: 502 });
    await logAudit(db, { actor: gate.userId, action: "Found listing photo (AI/Firecrawl)", target: businessId, meta: { slug: biz.slug } });
    return NextResponse.json({ ok: true, candidateUrl, upscaled: upscaled !== found });
  }

  if (action === "apply") {
    const candidateUrl = String(b.candidateUrl || "").trim();
    if (!/^https:\/\//.test(candidateUrl)) return NextResponse.json({ ok: false, error: "bad_candidate" }, { status: 422 });
    const rest = Array.isArray(biz.photos) ? (biz.photos as { url: string; caption?: string }[]).filter((p) => p.url !== candidateUrl) : [];
    const photos = [{ url: candidateUrl, caption: biz.name }, ...rest].slice(0, 8);
    const { error } = await db.from("businesses").update({ photos }).eq("id", businessId);
    if (error) return NextResponse.json({ ok: false, error: "update_failed", detail: error.message }, { status: 502 });
    await logAudit(db, { actor: gate.userId, action: "Applied enriched listing photo", target: businessId, meta: { slug: biz.slug } });
    revalidatePublic([`/business/${biz.slug}`, "/explore"]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
}
