import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { EMPTY_FLAGS, hotelHalalScore, type HotelFlags } from "@/lib/halal-hotels";

/* Admin/ustaz verification of a hotel's Muslim-friendly facilities → writes the
   muslim_friendly_hotels overlay (verified_by='ustaz'). This is the human gate:
   a verified row makes the hotel show a "Verified Muslim-friendly" badge and
   power the halal filters. Never asserts MUIS certification — facilities only. */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const body = (await req.json().catch(() => ({}))) as { liteapi_hotel_id?: string; city?: string; country?: string; flags?: Partial<HotelFlags>; halal_score?: number; near_mosque_m?: number; source_notes?: string };
  const id = String(body.liteapi_hotel_id || "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "Missing hotel id" }, { status: 422 });

  const flags: HotelFlags = { ...EMPTY_FLAGS, ...(body.flags || {}) };
  const score = body.halal_score != null ? Math.max(0, Math.min(100, Number(body.halal_score))) : hotelHalalScore(flags);

  const admin = getSupabaseAdmin()!;
  const { error } = await admin.from("muslim_friendly_hotels").upsert({
    liteapi_hotel_id: id,
    city: body.city || null,
    country: body.country || null,
    has_prayer_room: flags.has_prayer_room,
    halal_food_onsite: flags.halal_food_onsite,
    halal_food_nearby: flags.halal_food_nearby,
    alcohol_free: flags.alcohol_free,
    women_only_facilities: flags.women_only_facilities,
    qibla_direction: flags.qibla_direction,
    prayer_mat_available: flags.prayer_mat_available,
    near_mosque_m: body.near_mosque_m != null ? Number(body.near_mosque_m) : null,
    halal_score: score,
    verified_by: "ustaz",
    source_notes: body.source_notes || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ ok: false, error: "Save failed" }, { status: 502 });

  await logAudit(admin, { actor: gate.userId, action: "Verified Muslim-friendly hotel", target: id, meta: { score } });
  return NextResponse.json({ ok: true, halal_score: score });
}
