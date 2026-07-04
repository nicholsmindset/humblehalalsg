import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bustFlagCache } from "@/lib/feature-flags";

const FEATURES = ["paidPlans", "paidAds", "certVault", "leadRouting", "paidLeads"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" }, { status: 503 });
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const businessId = String(b.businessId || "");
  const feature = String(b.feature || "");
  if (!businessId || !FEATURES.includes(feature)) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }
  // enabled === null  → clear the override (defer to global)
  if (b.enabled === null) {
    const { error } = await admin.from("business_feature_overrides")
      .delete().eq("business_id", businessId).eq("feature_key", feature);
    if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  } else {
    const { error } = await admin.from("business_feature_overrides")
      .upsert({ business_id: businessId, feature_key: feature, enabled: !!b.enabled, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }
  bustFlagCache();
  return NextResponse.json({ ok: true });
}
