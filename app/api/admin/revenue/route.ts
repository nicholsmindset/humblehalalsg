import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/feature-flags";
import { PLANS, planKey } from "@/lib/plans";

/* Unified revenue P&L across every stream, from OUR own ledger tables:
     • subscriptions   → recurring listing plans (est. MRR)
     • orders          → event-ticket booking fees (our commission) + GMV
     • ad_orders       → sponsored-ad / promo purchases
   Admin-gated. Graceful in mock mode (no Supabase keys) → zeroed shape so the
   dashboard still renders. SGD-native streams (events/ads) are summed exactly. */

const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const flags = await getServerFlags();
  const url = new URL(req.url);
  const windowDays = Math.min(365, Math.max(1, Number(url.searchParams.get("days")) || 30));

  const admin = getSupabaseAdmin();
  // Mock mode (pre-launch / no keys): return a fully-zeroed shape so the P&L
  // renders an honest empty state instead of erroring.
  if (!admin) {
    return NextResponse.json({
      ok: true, simulated: true, flags, windowDays,
      mrrCents: 0, activePlans: 0, plansByTier: {},
      windowSgdCents: { events: 0, ads: 0, total: 0 },
      eventGmvCents: 0, trend: [],
    });
  }

  const sinceTrend = new Date(Date.now() - 180 * 864e5).toISOString();
  const sinceWindow = new Date(Date.now() - windowDays * 864e5).toISOString();

  const [subsRes, ordersRes, adsRes] = await Promise.all([
    admin.from("subscriptions").select("plan, status"),
    admin.from("orders").select("fee_cents, amount_cents, status, created_at").gte("created_at", sinceTrend),
    admin.from("ad_orders").select("amount_cents, status, created_at").gte("created_at", sinceTrend),
  ]);

  // ── Recurring: est. MRR from active subscriptions (monthly list price). Note:
  // the row doesn't store billing interval, so yearly subs are valued at their
  // monthly-equivalent list price — an estimate, labelled in the UI.
  const plansByTier: Record<string, number> = {};
  let mrrCents = 0, activePlans = 0;
  for (const s of subsRes.data || []) {
    if (s.status !== "active" && s.status !== "trialing") continue;
    const key = planKey(s.plan);
    if (key === "free") continue;
    plansByTier[key] = (plansByTier[key] || 0) + 1;
    mrrCents += Math.round(PLANS[key].monthly * 100);
    activePlans++;
  }

  // ── Monthly buckets (transactional, realized) for the trend + window totals.
  type Bucket = { events: number; ads: number };
  const months: Record<string, Bucket> = {};
  const bucket = (iso: string): Bucket => (months[monthKey(iso)] ??= { events: 0, ads: 0 });

  let winEvents = 0, winAds = 0, eventGmvCents = 0;

  for (const o of ordersRes.data || []) {
    if (o.status !== "confirmed" || !o.created_at) continue;
    const fee = Number(o.fee_cents) || 0;
    bucket(o.created_at).events += fee;
    if (o.created_at >= sinceWindow) { winEvents += fee; eventGmvCents += Number(o.amount_cents) || 0; }
  }
  for (const a of adsRes.data || []) {
    if (a.status !== "paid" || !a.created_at) continue;
    const amt = Number(a.amount_cents) || 0;
    bucket(a.created_at).ads += amt;
    if (a.created_at >= sinceWindow) winAds += amt;
  }
  const trend = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, b]) => ({ month, ...b, total: b.events + b.ads }));

  return NextResponse.json({
    ok: true, flags, windowDays,
    mrrCents, activePlans, plansByTier,
    windowSgdCents: { events: winEvents, ads: winAds, total: winEvents + winAds },
    eventGmvCents,
    trend,
  });
}
