import "server-only";
import type { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  POINTS, BADGES, tierFor, badgesFor, streakFrom, sgtDate, totalPoints,
  type PassportSource, type PassportStats,
} from "@/lib/passport";
import { emailForUser } from "@/lib/emails/recipient";
import { sendEmail } from "@/lib/email";
import {
  referralJoinedEmail, referralQualifiedEmail, badgeEarnedEmail, tierUpEmail,
} from "@/lib/emails/templates";

/* Server-only Halal Passport engine: award points (idempotent RPC), qualify
   referrals + reward both sides, and emit tier/badge notifications + emails.
   Everything here assumes the caller already checked getServerFlags().passport. */

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

const REFERRAL_REWARD_CAP = parseInt(process.env.REFERRAL_REWARD_CAP || "20", 10) || 20;

export async function award(
  db: Db,
  a: { userId: string; source: PassportSource; sourceId: string | null; points: number; reason: string; dedupeKey: string },
): Promise<boolean> {
  try {
    const { data } = await db.rpc("award_points", {
      p_user_id: a.userId, p_delta: a.points, p_reason: a.reason,
      p_source_type: a.source, p_source_id: a.sourceId, p_dedupe_key: a.dedupeKey,
    });
    return data === true;
  } catch {
    return false;
  }
}

/** Load a user's passport stats from the ledger (summed; no stored balance). */
export async function loadStats(db: Db, userId: string): Promise<PassportStats & { rows: LedgerRow[] }> {
  // The 500-row cap under-counted a heavy user's OWN total, tier, streak and
  // badge counts once they passed 500 ledger events (an active user reaches that
  // in ~1.5 years of daily activity) — the ledger is the only balance source, so
  // a truncated read shows the wrong number to the user (audit passport-01).
  // passport_points is per-user and small; read a generous cap that covers any
  // realistic lifetime rather than silently truncating.
  const { data } = await db
    .from("passport_points")
    .select("delta, source_type, source_id, reason, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20000);
  const rows = (data || []) as LedgerRow[];
  const count = (t: string) => rows.filter((r) => r.source_type === t).length;
  const visitIds = new Set(rows.filter((r) => r.source_type === "visit").map((r) => r.source_id));
  const activeDates = [...new Set(rows.map((r) => sgtDate(r.created_at)))];
  let qualifiedReferrals = 0;
  try {
    const { count: qc } = await db
      .from("referrals").select("id", { count: "exact", head: true })
      .eq("referrer_id", userId).eq("status", "qualified");
    qualifiedReferrals = qc || 0;
  } catch { /* table may be pre-migration */ }
  return {
    totalPoints: totalPoints(rows),
    reviewCount: count("review"),
    visitCount: visitIds.size,
    followCount: count("follow"),
    streakDays: streakFrom(activeDates, sgtDate(new Date())),
    qualifiedReferrals,
    rows,
  };
}

export interface LedgerRow { delta: number; source_type: string; source_id: string | null; reason: string; created_at: string }

/** Insert tier-up / badge-earned notifications (+ email) for crossings between two stat snapshots. */
export async function emitProgress(db: Db, userId: string, before: PassportStats, after: PassportStats): Promise<void> {
  const beforeTier = tierFor(before.totalPoints).key;
  const afterTier = tierFor(after.totalPoints);
  if (afterTier.key !== beforeTier && after.totalPoints > before.totalPoints) {
    await notify(db, userId, "tier_up", `You reached ${afterTier.label}`, "Keep going to reach the next tier.", `tier:${afterTier.key}`);
    await emailUser(db, userId, (n) => tierUpEmail({ name: n, tier: afterTier.label }));
  }
  const newBadges = badgesFor(after).filter((k) => !badgesFor(before).includes(k));
  for (const key of newBadges) {
    const badge = BADGES.find((b) => b.key === key);
    if (!badge) continue;
    await notify(db, userId, "badge_earned", `You unlocked ${badge.label}`, badge.desc, `badge:${key}`);
    await emailUser(db, userId, (n) => badgeEarnedEmail({ name: n, badge: badge.label }));
  }
}

/** On the referred user's first qualifying action, flip pending→qualified and
   reward both sides (idempotent by referral id). Call from review/visit awards. */
export async function qualifyReferralIfPending(db: Db, referredId: string): Promise<void> {
  let row: { referral_id: string; referrer_id: string } | null = null;
  try {
    const { data } = await db.rpc("qualify_referral", { p_referred_id: referredId });
    row = Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
  } catch { return; }
  if (!row) return;

  // Referrer reward — capped per referrer.
  let underCap = true;
  try {
    const { count } = await db
      .from("passport_points").select("id", { count: "exact", head: true })
      .eq("user_id", row.referrer_id).eq("source_type", "referral");
    underCap = (count || 0) < REFERRAL_REWARD_CAP;
  } catch { /* fall through, award */ }
  if (underCap) {
    const awarded = await award(db, {
      userId: row.referrer_id, source: "referral", sourceId: row.referral_id,
      points: POINTS.referralReferrer, reason: "Friend you referred joined in",
      dedupeKey: `referral:${row.referral_id}:referrer`,
    });
    if (awarded) {
      await notify(db, row.referrer_id, "referral_joined", "Referral reward unlocked", `You earned ${POINTS.referralReferrer} points.`, `referral_qualified:${row.referral_id}`);
      await emailUser(db, row.referrer_id, (n) => referralQualifiedEmail({ name: n, points: POINTS.referralReferrer }));
    }
  }
  // Referred user's welcome bonus (always granted).
  await award(db, {
    userId: referredId, source: "referral", sourceId: row.referral_id,
    points: POINTS.referralReferred, reason: "Welcome bonus", dedupeKey: `referral:${row.referral_id}:referred`,
  });
}

/** Insert a notification for a referrer when a friend signs up (pre-qualify). */
export async function notifyReferralJoined(db: Db, referrerId: string): Promise<void> {
  await notify(db, referrerId, "referral_joined", "A friend joined with your invite", "You'll both earn points on their first review or stamp.", `referral_signup:${referrerId}:${Date.now()}`.slice(0, 120));
  await emailUser(db, referrerId, (n) => referralJoinedEmail({ name: n }));
}

async function notify(db: Db, userId: string, type: string, title: string, body: string, dedupeKey: string): Promise<void> {
  try {
    await db.from("notifications").insert({ user_id: userId, type, title, body, link: "/passport", dedupe_key: dedupeKey });
  } catch { /* dedupe/RLS — ignore */ }
}

async function emailUser(db: Db, userId: string, build: (name: string | null) => { subject: string; html: string }): Promise<void> {
  try {
    const { email, name } = await emailForUser(db, userId);
    if (!email) return;
    const t = build(name);
    await sendEmail({ to: email, subject: t.subject, html: t.html, template: "passport" });
  } catch { /* email best-effort */ }
}
