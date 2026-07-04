import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";
import { POINTS } from "@/lib/passport";

/* Server sync for saved places (was localStorage-only). GET → the caller's
   saved business ids. POST { businessId, saved } → upsert/delete, and award a
   Halal Passport point the first time a place is saved (dedupe = no farming). */
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: true, saved: [] });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, saved: [] });
  const { data } = await db.from("saved_places").select("business_id").eq("user_id", userId);
  return NextResponse.json({ ok: true, saved: (data || []).map((r) => r.business_id as string) });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let b: { businessId?: string; saved?: boolean } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }
  const businessId = String(b.businessId || "");
  if (!businessId) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 422 });
  const save = b.saved !== false;

  try {
    if (save) {
      await db.from("saved_places").upsert({ user_id: userId, business_id: businessId }, { onConflict: "user_id,business_id" });
      if (getServerFlags().passport) {
        try {
          const { awardDailyCapped, loadStats, emitProgress } = await import("@/lib/passport-server");
          const before = await loadStats(db, userId);
          // Capped per day (anti-farm: no earning by saving hundreds of places).
          await awardDailyCapped(db, { userId, source: "save", sourceId: businessId, points: POINTS.save, reason: "Saved a place", dedupeKey: `save:${businessId}`, dailyCap: 10 });
          await emitProgress(db, userId, before, await loadStats(db, userId));
        } catch { /* passport best-effort */ }
      }
    } else {
      await db.from("saved_places").delete().eq("user_id", userId).eq("business_id", businessId);
    }
  } catch {
    return NextResponse.json({ ok: false, reason: "write_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, saved: save });
}
