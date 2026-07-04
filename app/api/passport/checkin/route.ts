import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/flags";
import { POINTS, sgtDate } from "@/lib/passport";

/* Daily check-in: awards a small "active today" point once per SGT day so a
   streak survives browse-only days. Fired once per PassportScreen mount. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const rl = await rateLimit(req, "checkin", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const day = sgtDate(new Date());
  const { award, loadStats, emitProgress, evaluateQuests } = await import("@/lib/passport-server");
  const before = await loadStats(db, userId);
  const awarded = await award(db, { userId, source: "checkin", sourceId: day, points: POINTS.checkin, reason: "Daily visit", dedupeKey: `checkin:${day}` });
  // Bank any completed weekly-quest bonuses (this is the reliable evaluation
  // point — the dashboard fires check-in on every mount).
  await evaluateQuests(db, userId, before.rows);
  if (awarded) await emitProgress(db, userId, before, await loadStats(db, userId));
  return NextResponse.json({ ok: true, awarded });
}
