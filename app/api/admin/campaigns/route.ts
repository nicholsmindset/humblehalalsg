import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Admin sponsored-ad manager. GET → rate card + campaigns with real performance
   (impressions/clicks). POST → create a campaign (sales team books a sponsor).
   PATCH → update a campaign (status/dates/creative). Admin-only. */

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const [{ data: placements }, { data: perf }, { data: reviews }] = await Promise.all([
    sb.from("ad_placements").select("*").order("sort"),
    sb.from("v_campaign_performance").select("*"),
    sb.from("ad_campaigns").select("*"),
  ]);
  // The performance view predates the review gate; merge review_status + creative
  // image in from ad_campaigns so the admin can approve/reject and preview.
  const meta = new Map((reviews || []).map((r) => [r.id, r]));
  const rows = (perf || []).map((p) => ({
    ...p,
    review_status: meta.get(p.campaign_id)?.review_status ?? "approved",
    image_url: meta.get(p.campaign_id)?.image_url ?? null,
    created_via: meta.get(p.campaign_id)?.created_via ?? "admin",
    starts_on: meta.get(p.campaign_id)?.starts_on ?? null,
    ends_on: meta.get(p.campaign_id)?.ends_on ?? null,
    ctr: p.impressions > 0 ? Math.round((p.clicks / p.impressions) * 1000) / 10 : 0,
  }));
  // Revenue booked = sum of agreed rates across non-draft campaigns.
  const revenueCents = rows
    .filter((r) => r.status !== "draft")
    .reduce((s, r) => s + (Number(r.rate_cents) || 0), 0);
  return NextResponse.json({ ok: true, placements: placements || [], campaigns: rows, revenueCents });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const title = String(b.title || "").trim();
  const placement_key = String(b.placementKey || "").trim();
  if (!title || !placement_key) return NextResponse.json({ ok: false, error: "title + placement required" }, { status: 422 });

  const { data, error } = await sb.from("ad_campaigns").insert({
    title,
    placement_key,
    business_id: b.businessId ? String(b.businessId) : null,
    advertiser_name: b.advertiserName ? String(b.advertiserName).slice(0, 120) : null,
    body: b.body ? String(b.body).slice(0, 280) : null,
    image_url: b.imageUrl ? String(b.imageUrl).slice(0, 500) : null,
    target_url: b.targetUrl ? String(b.targetUrl).slice(0, 500) : null,
    status: ["draft", "scheduled", "active", "paused", "ended"].includes(String(b.status)) ? String(b.status) : "draft",
    starts_on: b.startsOn ? String(b.startsOn) : null,
    ends_on: b.endsOn ? String(b.endsOn) : null,
    rate_cents: Math.max(0, Math.round(Number(b.rateCents) || 0)),
    budget_cents: b.budgetCents != null ? Math.max(0, Math.round(Number(b.budgetCents))) : null,
    notes: b.notes ? String(b.notes).slice(0, 500) : null,
    // Review gate: a new creative is 'pending' until an admin approves it — even
    // if created with status 'active', it won't serve until review_status='approved'.
    review_status: "pending",
    created_by: gate.userId,
  }).select("id").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 422 });

  const patch: Record<string, unknown> = {};
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim();
  if (["draft", "scheduled", "active", "paused", "ended"].includes(String(b.status))) patch.status = b.status;
  if (["pending", "approved", "rejected"].includes(String(b.reviewStatus))) patch.review_status = b.reviewStatus;
  if (typeof b.body === "string") patch.body = b.body.slice(0, 280);
  if (typeof b.imageUrl === "string") patch.image_url = b.imageUrl.slice(0, 500);
  if (typeof b.targetUrl === "string") patch.target_url = b.targetUrl.slice(0, 500);
  if (b.startsOn !== undefined) patch.starts_on = b.startsOn ? String(b.startsOn) : null;
  if (b.endsOn !== undefined) patch.ends_on = b.endsOn ? String(b.endsOn) : null;
  if (b.rateCents !== undefined) patch.rate_cents = Math.max(0, Math.round(Number(b.rateCents) || 0));
  if (b.notes !== undefined) patch.notes = b.notes ? String(b.notes).slice(0, 500) : null;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 422 });

  const { error } = await sb.from("ad_campaigns").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
