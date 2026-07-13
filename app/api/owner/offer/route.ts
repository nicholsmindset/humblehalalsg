import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { canUse } from "@/lib/plans";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { revalidatePublic } from "@/lib/revalidate";

/* Owner offer management — makes the Premium "Offers & promotions" promise
   real (the offers table existed since 0002 with nothing writing to it).
   Single-active model: saving a new offer deactivates the previous one.

   GET    → the business's current active offer (owner view)
   POST   {title, details?, endsAt?} → upsert (plan-gated: offers_block)
   DELETE → deactivate the current offer

   Public listings read via GET /api/offers?business=<id> — no auth. */
export const dynamic = "force-dynamic";

async function ownerBusiness(userId: string) {
  const db = getSupabaseAdmin();
  if (!db) return { db: null, biz: null };
  // limit(1), never .maybeSingle() — a multi-business owner must not error here
  // (that locked them out of offers entirely). Operates on their primary listing.
  const { data: rows } = await db
    .from("businesses")
    .select("id, slug, plan")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
    .limit(1);
  const biz = (rows?.[0] as { id: string; slug: string; plan: string | null } | undefined) ?? null;
  return { db, biz };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const { db, biz } = await ownerBusiness(userId);
  if (!db) return NextResponse.json({ ok: true, simulated: true, offer: null });
  if (!biz) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });

  const { data } = await db
    .from("offers")
    .select("id, title, details, ends_at, active, created_at")
    .eq("business_id", biz.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json({ ok: true, offer: data ?? null, canUse: canUse(biz, "offers_block") });
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "owner-offer", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const { db, biz } = await ownerBusiness(userId);
  if (!db) return NextResponse.json({ ok: true, simulated: true });
  if (!biz) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });
  if (!canUse(biz, "offers_block")) return NextResponse.json({ ok: false, error: "plan_required" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { title?: string; details?: string; endsAt?: string };
  const title = String(body.title || "").trim().slice(0, 80);
  if (title.length < 3) return NextResponse.json({ ok: false, error: "title_required" }, { status: 422 });
  const details = String(body.details || "").trim().slice(0, 500) || null;
  // Light content gate (audit O8): offers publish to the public listing instantly
  // with no review, so block off-platform links in the copy — the highest-value
  // guard against a Premium owner pushing a scammy redirect through a promo.
  if (/(https?:\/\/|www\.)/i.test(`${title} ${details || ""}`)) {
    return NextResponse.json({ ok: false, error: "no_links" }, { status: 422 });
  }
  const endsAt = /^\d{4}-\d{2}-\d{2}$/.test(String(body.endsAt || "")) ? body.endsAt : null;

  // Single active offer: retire the old one, insert the new.
  await db.from("offers").update({ active: false }).eq("business_id", biz.id).eq("active", true);
  const { data: created, error } = await db
    .from("offers")
    .insert({ business_id: biz.id, title, details, ends_at: endsAt, active: true })
    .select("id, title, details, ends_at, active")
    .single();
  if (error || !created) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });

  revalidatePublic([`/business/${biz.slug}`]);
  return NextResponse.json({ ok: true, offer: created });
}

export async function DELETE(req: Request) {
  const rl = await rateLimit(req, "owner-offer", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const { db, biz } = await ownerBusiness(userId);
  if (!db) return NextResponse.json({ ok: true, simulated: true });
  if (!biz) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });

  await db.from("offers").update({ active: false }).eq("business_id", biz.id).eq("active", true);
  revalidatePublic([`/business/${biz.slug}`]);
  return NextResponse.json({ ok: true });
}
