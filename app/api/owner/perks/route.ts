import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";

/* Owner perk management. GET → the caller's businesses + their perks. POST →
   create a perk on a business the caller owns. PATCH → edit / (de)activate.
   Ownership = owner_id OR claimed_by === Clerk userId; service role after. */
export const dynamic = "force-dynamic";

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function ownedBusinesses(db: Db, userId: string) {
  const { data } = await db.from("businesses").select("id, name").or(`owner_id.eq.${userId},claimed_by.eq.${userId}`);
  return data || [];
}
async function ownsBusiness(db: Db, businessId: string, userId: string): Promise<boolean> {
  const { data } = await db.from("businesses").select("id").eq("id", businessId).or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
  return !!data;
}

export async function GET() {
  if (!getServerFlags().passport) return NextResponse.json({ ok: true, enabled: false });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const biz = await ownedBusinesses(db, userId);
  if (biz.length === 0) return NextResponse.json({ ok: true, enabled: true, businesses: [], perks: [] });
  const { data: perks } = await db.from("business_perks").select("*").in("business_id", biz.map((b) => b.id)).order("created_at", { ascending: false });
  return NextResponse.json({ ok: true, enabled: true, businesses: biz, perks: perks || [] });
}

export async function POST(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: { businessId?: string; title?: string; description?: string; terms?: string; pointsCost?: number } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const businessId = String(b.businessId || "");
  const title = String(b.title || "").trim().slice(0, 80);
  const cost = Math.round(Number(b.pointsCost) || 0);
  if (!businessId || !title || !(cost >= 1 && cost <= 100000)) return NextResponse.json({ ok: false, error: "bad_input" }, { status: 422 });
  if (!(await ownsBusiness(db, businessId, userId))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { error } = await db.from("business_perks").insert({
    business_id: businessId, title, description: String(b.description || "").trim().slice(0, 400) || null,
    terms: String(b.terms || "").trim().slice(0, 400) || null, points_cost: cost,
  });
  if (error) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: { id?: string; title?: string; description?: string; terms?: string; pointsCost?: number; active?: boolean } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  const { data: perk } = await db.from("business_perks").select("business_id").eq("id", id).maybeSingle();
  if (!perk) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!(await ownsBusiness(db, perk.business_id, userId))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b.active === "boolean") patch.active = b.active;
  if (typeof b.title === "string") patch.title = b.title.trim().slice(0, 80);
  if (typeof b.description === "string") patch.description = b.description.trim().slice(0, 400) || null;
  if (typeof b.terms === "string") patch.terms = b.terms.trim().slice(0, 400) || null;
  if (b.pointsCost != null) { const c = Math.round(Number(b.pointsCost)); if (c >= 1 && c <= 100000) patch.points_cost = c; }

  const { error } = await db.from("business_perks").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
