import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";
import { tierFor, nextTier, badgesFor, BADGES, TIERS, POINTS } from "@/lib/passport";

/* GET the signed-in user's Halal Passport: total points, tier + progress,
   streak, earned badges, and recent ledger activity. */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!getServerFlags().passport) return NextResponse.json({ ok: true, enabled: false });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const { loadStats, questsState } = await import("@/lib/passport-server");
  const stats = await loadStats(db, userId);
  const tier = tierFor(stats.totalPoints);
  const next = nextTier(stats.totalPoints);
  const earned = badgesFor(stats);
  const quests = await questsState(db, userId, stats.rows);

  return NextResponse.json({
    ok: true,
    enabled: true,
    stats: {
      totalPoints: stats.totalPoints, // lifetime earned (tier/badges)
      balance: stats.balance,          // spendable wallet
      reviewCount: stats.reviewCount,
      visitCount: stats.visitCount,
      followCount: stats.followCount,
      streakDays: stats.streakDays,
      qualifiedReferrals: stats.qualifiedReferrals,
    },
    tier,
    nextTier: next,
    tiers: TIERS,
    badges: BADGES.map((b) => ({ key: b.key, label: b.label, icon: b.icon, desc: b.desc, earned: earned.includes(b.key) })),
    quests,
    points: POINTS,
    recent: stats.rows.slice(0, 20).map((r) => ({ delta: r.delta, reason: r.reason, at: r.created_at })),
  });
}
