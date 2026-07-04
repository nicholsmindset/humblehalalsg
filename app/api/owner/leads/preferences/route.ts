import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/feature-flags";
import { LEAD_VERTICAL_IDS } from "@/lib/lead-verticals";
import { HHData } from "@/lib/data";

/* Owner lead preferences — which verticals + areas a business wants leads for.
   GET returns the first owned business's prefs (or defaults); PUT upserts them.
   Values validated against the fixed vertical ids + directory area names. */
export const dynamic = "force-dynamic";

const AREA_NAMES = new Set(HHData.areas.map((a) => a.name));
type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function firstOwnedBusiness(db: Db, userId: string) {
  const { data } = await db
    .from("businesses").select("id, name, cat_id, area")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  return data;
}

export async function GET() {
  if (!(await getServerFlags()).leadRouting) return NextResponse.json({ ok: true, enabled: false });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const biz = await firstOwnedBusiness(db, userId);
  if (!biz) return NextResponse.json({ ok: true, enabled: true, business: null });

  const { data: pref } = await db.from("lead_preferences").select("verticals, areas, active").eq("business_id", biz.id).maybeSingle();
  return NextResponse.json({
    ok: true, enabled: true,
    business: { id: biz.id, name: biz.name, area: biz.area },
    preferences: pref || { verticals: [], areas: [], active: true },
    options: { verticals: LEAD_VERTICAL_IDS, areas: [...AREA_NAMES] },
  });
}

export async function PUT(req: Request) {
  if (!(await getServerFlags()).leadRouting) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const biz = await firstOwnedBusiness(db, userId);
  if (!biz) return NextResponse.json({ ok: false, error: "no_business" }, { status: 404 });

  let body: { verticals?: unknown; areas?: unknown; active?: unknown } = {};
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const verticals = Array.isArray(body.verticals) ? [...new Set(body.verticals.map(String).filter((v) => LEAD_VERTICAL_IDS.includes(v)))] : [];
  const areas = Array.isArray(body.areas) ? [...new Set(body.areas.map(String).filter((a) => AREA_NAMES.has(a)))] : [];
  const active = body.active !== false;

  const { error } = await db.from("lead_preferences").upsert({
    business_id: biz.id, verticals, areas, active, updated_at: new Date().toISOString(),
  }, { onConflict: "business_id" });
  if (error) return NextResponse.json({ ok: false, error: "could_not_save" }, { status: 502 });
  return NextResponse.json({ ok: true, preferences: { verticals, areas, active } });
}
