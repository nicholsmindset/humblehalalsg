import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getStripe } from "@/lib/stripe";
import { getServerFlags } from "@/lib/feature-flags";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Admin pre-flight: is Stripe actually ready for the paid flags?
   Answers, with live probes rather than static copy (audit
   ads-stripe-testmode-03 — "nothing warns if a paid flag is enabled while
   STRIPE_SECRET_KEY is sk_test_"):
     - key present + which mode (sk_live / sk_test / wrong key type)
     - webhook secret present
     - every STRIPE_PRICE_* env id resolves on THIS key (a test-mode price id
       paired with a live key is exactly the go-live failure that shipped)
     - Connect activated on the platform + how many organisers can be paid
     - warnings whenever a paid flag is ON while any of the above is broken
   Read-only; never mutates Stripe or the DB. Admin-gated. */
export const dynamic = "force-dynamic";

const PRICE_LABELS = [
  "STRIPE_PRICE_VERIFIED_M",
  "STRIPE_PRICE_VERIFIED_Y",
  "STRIPE_PRICE_VERIFIED_FOUNDING_Y",
  "STRIPE_PRICE_FEATURED_M",
  "STRIPE_PRICE_FEATURED_Y",
  "STRIPE_PRICE_PREMIUM_M",
  "STRIPE_PRICE_PREMIUM_Y",
  "STRIPE_PRICE_LEADS_M",
  "STRIPE_PRICE_LEADS_FOUNDING_M",
] as const;

type KeyMode = "live" | "test" | "wrong_key_type" | "missing";

function keyMode(): KeyMode {
  const k = process.env.STRIPE_SECRET_KEY || "";
  if (!k) return "missing";
  if (k.startsWith("sk_live_") || k.startsWith("rk_live_")) return "live";
  if (k.startsWith("sk_test_") || k.startsWith("rk_test_")) return "test";
  return "wrong_key_type"; // pk_* / whsec_* / garbage — cannot make server calls
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const warnings: string[] = [];
  const mode = keyMode();
  const stripe = mode === "live" || mode === "test" ? getStripe() : null;

  if (mode === "missing") warnings.push("STRIPE_SECRET_KEY is not set — every checkout will refuse.");
  if (mode === "wrong_key_type") warnings.push("STRIPE_SECRET_KEY is not a secret key (sk_…) — publishable keys can't make server calls. Every checkout will fail.");

  // Webhook secret — without it fulfillment never runs (payments succeed but
  // plans/tickets are never granted).
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").startsWith("whsec_");
  if (!webhookSecret) warnings.push("STRIPE_WEBHOOK_SECRET missing/invalid — payments would succeed but never fulfil (no plan/ticket granted).");

  // Each configured price id must resolve on THIS key. A test-mode id on a
  // live key comes back resource_missing — the classic go-live mismatch.
  const prices: Record<string, { configured: boolean; exists?: boolean; active?: boolean; amount?: number | null; currency?: string; interval?: string; error?: string }> = {};
  if (stripe) {
    await Promise.all(
      PRICE_LABELS.map(async (label) => {
        const id = process.env[label];
        if (!id) { prices[label] = { configured: false }; return; }
        try {
          const p = await stripe.prices.retrieve(id);
          prices[label] = { configured: true, exists: true, active: p.active, amount: p.unit_amount != null ? p.unit_amount / 100 : null, currency: p.currency, interval: p.recurring?.interval || "one_time" };
          if (!p.active) warnings.push(`${label} points at an ARCHIVED price — that checkout will fail.`);
        } catch (e) {
          prices[label] = { configured: true, exists: false, error: e instanceof Error ? e.message.slice(0, 120) : "retrieve failed" };
          warnings.push(`${label} does not resolve in ${mode} mode (${id.slice(0, 14)}…) — likely a ${mode === "live" ? "test" : "live"}-mode id.`);
        }
      }),
    );
  } else {
    for (const label of PRICE_LABELS) prices[label] = { configured: !!process.env[label] };
  }

  // Connect: can this platform manage Express accounts in the current mode?
  // accounts.list throws until Connect is activated on the platform profile.
  let connect: { activated: boolean; error?: string } = { activated: false };
  if (stripe) {
    try {
      await stripe.accounts.list({ limit: 1 });
      connect = { activated: true };
    } catch (e) {
      connect = { activated: false, error: e instanceof Error ? e.message.slice(0, 160) : "accounts probe failed" };
    }
  }

  // Organisers who can actually receive ticket payouts right now.
  let payoutReadyOrganisers: number | null = null;
  const db = getSupabaseAdmin();
  if (db) {
    const { count } = await db.from("stripe_accounts").select("business_id", { count: "exact", head: true }).eq("payouts_enabled", true);
    payoutReadyOrganisers = count ?? 0;
  }

  // Paid flags vs reality — the checks above only matter for streams that are ON.
  const flags = await getServerFlags();
  const paidOn = (["paidTickets", "paidAds", "paidPlans", "paidHotels", "paidFlights", "payNow", "paidLeads"] as const).filter((k) => flags[k]);
  if (paidOn.length && mode === "test") warnings.push(`Paid flags ON (${paidOn.join(", ")}) while the Stripe key is TEST mode — buyers get fake checkouts.`);
  if (flags.paidPlans) {
    const planLabels = PRICE_LABELS.filter((l) => l.includes("VERIFIED") || l.includes("FEATURED") || l.includes("PREMIUM"));
    if (planLabels.some((l) => prices[l] && (!prices[l].configured || prices[l].exists === false))) {
      warnings.push("paidPlans is ON but at least one plan price is missing/unresolvable — those checkouts will fail.");
    }
  }
  if (flags.paidTickets && !connect.activated) warnings.push("paidTickets is ON but Connect isn't usable on this key — organiser onboarding will fail.");
  if (flags.paidTickets && payoutReadyOrganisers === 0) warnings.push("paidTickets is ON but no organiser has completed payout onboarding — every paid checkout will refuse (business_not_onboarded).");

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    key: { present: mode !== "missing", mode },
    webhookSecret,
    prices,
    connect: { ...connect, payoutReadyOrganisers },
    paidFlagsOn: paidOn,
    warnings,
  });
}
