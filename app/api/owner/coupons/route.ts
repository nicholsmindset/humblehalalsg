import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { canUse } from "@/lib/plans";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { revalidatePublic } from "@/lib/revalidate";

export const dynamic = "force-dynamic";
type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function ownedBusiness(db: Db, businessId: string, userId: string) {
  const { data } = await db.from("businesses").select("id,name,slug,plan,status,owner_id,claimed_by")
    .eq("id", businessId).maybeSingle();
  if (!data || (data.owner_id !== userId && data.claimed_by !== userId)) return null;
  return data;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, businesses: [], promotions: [] });
  const requested = new URL(req.url).searchParams.get("business") || "";
  const { data: businesses } = await db.from("businesses").select("id,name,slug,plan,status")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).order("name");
  const allowedIds = (businesses || []).map((b) => String(b.id));
  const ids = requested && allowedIds.includes(requested) ? [requested] : allowedIds;
  if (!ids.length) return NextResponse.json({ ok: true, businesses: businesses || [], promotions: [] });
  const { data } = await db.from("business_promotions")
    .select("id,business_id,kind,title,details,discount_type,discount_value,reward_text,min_spend_cents,starts_at,ends_at,valid_days,redeem_start,redeem_end,per_user_limit,total_limit,claimed_count,redeemed_count,terms,status,rejection_reason,created_at,updated_at")
    .in("business_id", ids).order("created_at", { ascending: false });
  return NextResponse.json({ ok: true, businesses: businesses || [], promotions: data || [] });
}

function fields(body: Record<string, unknown>) {
  const discountType = ["percent", "fixed", "free_item", "bundle"].includes(String(body.discountType)) ? String(body.discountType) : "percent";
  const valueRaw = Number(body.discountValue);
  const discountValue = discountType === "fixed" ? Math.round(valueRaw * 100) : Math.round(valueRaw);
  const days = Array.isArray(body.validDays) ? body.validDays.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : [0,1,2,3,4,5,6];
  return {
    kind: "coupon",
    title: String(body.title || "").trim().slice(0, 90),
    details: String(body.details || "").trim().slice(0, 500) || null,
    discount_type: discountType,
    discount_value: ["percent", "fixed"].includes(discountType) ? discountValue : null,
    reward_text: String(body.rewardText || "").trim().slice(0, 100) || null,
    min_spend_cents: Math.max(0, Math.round(Number(body.minSpend || 0) * 100)),
    starts_at: body.startsAt ? new Date(String(body.startsAt)).toISOString() : new Date().toISOString(),
    ends_at: body.endsAt ? new Date(String(body.endsAt)).toISOString() : null,
    valid_days: days.length ? [...new Set(days)] : [0,1,2,3,4,5,6],
    redeem_start: /^\d{2}:\d{2}$/.test(String(body.redeemStart || "")) ? body.redeemStart : null,
    redeem_end: /^\d{2}:\d{2}$/.test(String(body.redeemEnd || "")) ? body.redeemEnd : null,
    per_user_limit: Math.min(20, Math.max(1, Number(body.perUserLimit) || 1)),
    total_limit: body.totalLimit ? Math.max(1, Number(body.totalLimit)) : null,
    terms: String(body.terms || "").trim().slice(0, 1000) || null,
  };
}

function validate(p: ReturnType<typeof fields>) {
  if (p.title.length < 3) return "title_required";
  if (/(https?:\/\/|www\.)/i.test(`${p.title} ${p.details || ""} ${p.terms || ""}`)) return "no_links";
  if (p.discount_type === "percent" && (!p.discount_value || p.discount_value > 100)) return "bad_discount";
  if (p.discount_type === "fixed" && (!p.discount_value || p.discount_value < 1)) return "bad_discount";
  if (["free_item", "bundle"].includes(p.discount_type) && !p.reward_text) return "reward_required";
  if (p.ends_at && new Date(p.ends_at) <= new Date(p.starts_at)) return "bad_dates";
  return null;
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "owner-coupon", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const biz = await ownedBusiness(db, String(body.businessId || ""), userId);
  if (!biz) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (!canUse(biz, "offers_block")) return NextResponse.json({ ok: false, error: "plan_required" }, { status: 403 });
  const p = fields(body); const invalid = validate(p);
  if (invalid) return NextResponse.json({ ok: false, error: invalid }, { status: 422 });
  const { data, error } = await db.from("business_promotions").insert({ ...p, business_id: biz.id, created_by: userId, status: "pending" }).select("*").single();
  if (error || !data) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, promotion: data });
}

export async function PATCH(req: Request) {
  const rl = await rateLimit(req, "owner-coupon", 30, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin(); if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { data: existing } = await db.from("business_promotions").select("id,business_id,status").eq("id", String(body.id || "")).maybeSingle();
  if (!existing) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  const biz = await ownedBusiness(db, String(existing.business_id), userId);
  if (!biz) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (body.action === "pause") {
    await db.from("business_promotions").update({ status: "paused" }).eq("id", existing.id);
    revalidatePublic(["/deals", `/business/${biz.slug}`]);
    return NextResponse.json({ ok: true, status: "paused" });
  }
  if (body.action === "resume") {
    await db.from("business_promotions").update({ status: "pending", rejection_reason: null }).eq("id", existing.id);
    return NextResponse.json({ ok: true, status: "pending" });
  }
  const p = fields(body); const invalid = validate(p);
  if (invalid) return NextResponse.json({ ok: false, error: invalid }, { status: 422 });
  const { data, error } = await db.from("business_promotions").update({ ...p, status: "pending", rejection_reason: null, reviewed_by: null, reviewed_at: null }).eq("id", existing.id).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  revalidatePublic(["/deals", `/business/${biz.slug}`]);
  return NextResponse.json({ ok: true, promotion: data });
}

export async function DELETE(req: Request) {
  const { userId } = await auth(); if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin(); if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });
  const id = String(new URL(req.url).searchParams.get("id") || "");
  const { data } = await db.from("business_promotions").select("id,business_id").eq("id", id).maybeSingle();
  if (!data || !(await ownedBusiness(db, String(data.business_id), userId))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { count } = await db.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("promotion_id", id);
  if ((count || 0) > 0) {
    await db.from("business_promotions").update({ status: "paused" }).eq("id", id);
    return NextResponse.json({ ok: true, archived: true });
  }
  await db.from("business_promotions").delete().eq("id", id);
  return NextResponse.json({ ok: true, deleted: true });
}
