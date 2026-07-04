import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/flags";
import { REWARDS, rewardById } from "@/lib/passport-rewards";

/* Rewards store. GET → catalogue + owned + spendable balance. POST → redeem
   (spends points via the atomic redeem_reward RPC; one-time rewards dedupe by
   redeem:<id>). Digital effects (badge/spotlight/early-access) are applied best-
   effort on success. */
export const dynamic = "force-dynamic";

async function balanceOf(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>, userId: string): Promise<number> {
  const { data } = await db.from("passport_points").select("delta").eq("user_id", userId).limit(2000);
  return (data || []).reduce((n, r) => n + (r.delta as number), 0);
}

export async function GET() {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const [{ data: owned }, balance] = await Promise.all([
    db.from("passport_redemptions").select("reward_id, created_at").eq("user_id", userId),
    balanceOf(db, userId),
  ]);
  const ownedIds = new Set((owned || []).map((r) => r.reward_id));
  return NextResponse.json({
    ok: true,
    balance,
    rewards: REWARDS.map((r) => ({ id: r.id, title: r.title, desc: r.desc, cost: r.cost, icon: r.icon, owned: ownedIds.has(r.id), repeatable: !!r.repeatable })),
  });
}

export async function POST(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const rl = await rateLimit(req, "redeem", 20, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let rewardId = "";
  try { rewardId = String(((await req.json()) as { rewardId?: string }).rewardId || ""); } catch { /* noop */ }
  const reward = rewardById(rewardId);
  if (!reward) return NextResponse.json({ ok: false, error: "unknown_reward" }, { status: 400 });

  const dedupe = reward.repeatable ? `redeem:${reward.id}:${Date.now()}` : `redeem:${reward.id}`;
  const { data: result } = await db.rpc("redeem_reward", {
    p_user_id: userId, p_reward_id: reward.id, p_cost: reward.cost, p_dedupe: dedupe, p_reason: `Redeemed: ${reward.title}`,
  });
  if (result === "insufficient") return NextResponse.json({ ok: false, error: "insufficient" }, { status: 402 });
  if (result === "duplicate") return NextResponse.json({ ok: false, error: "already_owned" }, { status: 409 });
  if (result !== "ok") return NextResponse.json({ ok: false, error: "redeem_failed" }, { status: 502 });

  // Best-effort digital effects.
  try {
    if (reward.effect === "early_access") {
      const { emailForUser } = await import("@/lib/emails/recipient");
      const { beehiivSubscribe } = await import("@/lib/beehiiv");
      const { email, name } = await emailForUser(db, userId);
      if (email) await beehiivSubscribe({ email, source: "passport", stage: "early-access", ...(name ? { name } : {}) });
    }
  } catch { /* effect best-effort */ }

  return NextResponse.json({ ok: true });
}
