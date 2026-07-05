import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/feature-flags";
import { PLANS, planKey } from "@/lib/plans";

/* Unified revenue P&L across every stream, from OUR own ledger tables:
     • subscriptions   → recurring listing plans (est. MRR)
     • orders          → event-ticket booking fees (our commission) + GMV
     • ad_orders       → sponsored-ad / promo purchases
     • hotel/flight_bookings → LiteAPI travel commission (native currency)
   Admin-gated. Graceful in mock mode (no Supabase keys) → zeroed shape so the
   dashboard still renders. SGD-native streams (events/ads) are summed exactly;
   travel commission arrives in the booking currency and is converted to an
   APPROX SGD figure with a fixed FX table (labelled as such in the UI). */

// Approx FX → SGD. Deliberately static (no live FX dependency); the LiteAPI
// dashboard remains the source of truth for actual payouts. Unknown → 1.
const FX_TO_SGD: Record<string, number> = { SGD: 1, USD: 1.35, EUR: 1.45, GBP: 1.7, MYR: 0.29, AUD: 0.89, AED: 0.37 };
const toSgd = (amount: number, currency?: string | null) =>
  amount * (FX_TO_SGD[String(currency || "SGD").toUpperCase()] ?? 1);

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
      windowSgdCents: { events: 0, ads: 0, travelApprox: 0, total: 0 },
      eventGmvCents: 0, travelByCurrency: [], trend: [],
    });
  }

  const sinceTrend = new Date(Date.now() - 180 * 864e5).toISOString();
  const sinceWindow = new Date(Date.now() - windowDays * 864e5).toISOString();

  const [subsRes, ordersRes, adsRes, hotelRes, flightRes] = await Promise.all([
    admin.from("subscriptions").select("plan, status"),
    admin.from("orders").select("fee_cents, amount_cents, status, created_at").gte("created_at", sinceTrend),
    admin.from("ad_orders").select("amount_cents, status, created_at").gte("created_at", sinceTrend),
    admin.from("hotel_bookings").select("currency, commission_amount, status, created_at").gte("created_at", sinceTrend),
    admin.from("flight_bookings").select("currency, commission_amount, status, created_at").gte("created_at", sinceTrend),
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
  type Bucket = { events: number; ads: number; travel: number };
  const months: Record<string, Bucket> = {};
  const bucket = (iso: string): Bucket => (months[monthKey(iso)] ??= { events: 0, ads: 0, travel: 0 });

  let winEvents = 0, winAds = 0, winTravel = 0, eventGmvCents = 0;
  const travelByCur: Record<string, { commission: number; count: number }> = {};

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
  for (const b of [...(hotelRes.data || []), ...(flightRes.data || [])]) {
    if (b.status !== "confirmed" || !b.created_at) continue;
    const native = Number(b.commission_amount) || 0;
    const sgdCents = Math.round(toSgd(native, b.currency) * 100);
    bucket(b.created_at).travel += sgdCents;
    if (b.created_at >= sinceWindow) {
      winTravel += sgdCents;
      const cur = String(b.currency || "USD").toUpperCase();
      travelByCur[cur] = travelByCur[cur] || { commission: 0, count: 0 };
      travelByCur[cur].commission += native;
      travelByCur[cur].count++;
    }
  }

  const trend = Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, b]) => ({ month, ...b, total: b.events + b.ads + b.travel }));

  return NextResponse.json({
    ok: true, flags, windowDays,
    mrrCents, activePlans, plansByTier,
    windowSgdCents: { events: winEvents, ads: winAds, travelApprox: winTravel, total: winEvents + winAds + winTravel },
    eventGmvCents,
    travelByCurrency: Object.entries(travelByCur).map(([currency, v]) => ({ currency, commission: Math.round(v.commission), count: v.count })),
    trend,
  });
}
