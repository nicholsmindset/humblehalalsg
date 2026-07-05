import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bustFlagCache } from "@/lib/feature-flags";

const FEATURES = ["paidPlans", "paidAds", "certVault", "leadRouting", "paidLeads"];

export async function POST(req: Request) {
  // Same admin gate as every other /api/admin/* route (requireAdmin), rather
  // than the earlier inline Clerk+profiles check — one pattern everywhere.
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, reason: gate.error }, { status: gate.status });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const businessId = String(b.businessId || "");
  const feature = String(b.feature || "");
  if (!businessId || !FEATURES.includes(feature)) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  if (typeof b.enabled !== "boolean" && b.enabled !== null) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  // enabled === null  → clear the override (defer to global)
  if (b.enabled === null) {
    const { error } = await admin.from("business_feature_overrides")
      .delete().eq("business_id", businessId).eq("feature_key", feature);
    if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  } else {
    const { error } = await admin.from("business_feature_overrides")
      .upsert({ business_id: businessId, feature_key: feature, enabled: !!b.enabled, updated_at: new Date().toISOString() }, { onConflict: "business_id,feature_key" });
    if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }
  bustFlagCache();
  return NextResponse.json({ ok: true });
}
