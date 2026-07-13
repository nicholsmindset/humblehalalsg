import { postJson } from "./server-track";

/* GA4 Measurement Protocol — server-side events with authoritative values.
 * Used by the Stripe webhook to record purchases GA4's browser tag never sees
 * (the buyer is on Stripe's domain when payment completes).
 *
 * client_id comes from the _ga cookie captured at checkout start and threaded
 * through Stripe session metadata (see lib/analytics.ts getGaClientId), so the
 * server purchase lands in the SAME GA4 user journey/attribution as the
 * browser session. Falls back to a session-scoped synthetic id when absent —
 * the revenue still counts, only cross-session attribution is lost.
 *
 * No-op unless GA4_MEASUREMENT_ID + GA4_API_SECRET are set (project convention:
 * graceful when unconfigured). Never throws. */

const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const API_SECRET = process.env.GA4_API_SECRET;

export type Ga4Item = {
  item_id?: string;
  item_name?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

type Ga4Event = { name: string; params: Record<string, unknown> };

export function ga4Configured(): boolean {
  return !!(MEASUREMENT_ID && API_SECRET);
}

/** Send events to GA4 MP. `clientId` should be the browser _ga client id when
 *  available; `fallbackId` (e.g. our hh_sid session id) keeps the hit valid
 *  otherwise. Returns delivery boolean (MP replies 2xx even for soft errors —
 *  use the /debug/mp/collect endpoint during verification). */
export async function sendGa4Events(
  o: { clientId?: string | null; fallbackId?: string | null; userId?: string | null },
  events: Ga4Event[],
): Promise<boolean> {
  if (!ga4Configured() || events.length === 0) return false;
  const client_id = o.clientId || o.fallbackId || `srv.${Date.now()}`;
  const payload: Record<string, unknown> = {
    client_id,
    events: events.slice(0, 25), // MP hard limit per request
  };
  if (o.userId) payload.user_id = o.userId;
  return postJson(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(MEASUREMENT_ID!)}&api_secret=${encodeURIComponent(API_SECRET!)}`,
    payload,
  );
}

/** Authoritative purchase from the Stripe webhook. */
export async function sendGa4Purchase(o: {
  clientId?: string | null;
  fallbackId?: string | null;
  userId?: string | null;
  transactionId: string;
  value: number;
  currency: string;
  checkoutType?: string;
  items?: Ga4Item[];
}): Promise<boolean> {
  return sendGa4Events(o, [
    {
      name: "purchase",
      params: {
        transaction_id: o.transactionId,
        value: o.value,
        currency: o.currency,
        checkout_type: o.checkoutType,
        items: o.items && o.items.length ? o.items : undefined,
        // Flags the hit as server-sourced in GA4 explorations.
        event_source: "stripe_webhook",
      },
    },
  ]);
}

/** Refund mirror (charge.refunded). */
export async function sendGa4Refund(o: {
  clientId?: string | null;
  fallbackId?: string | null;
  transactionId: string;
  value?: number;
  currency?: string;
}): Promise<boolean> {
  return sendGa4Events(o, [
    {
      name: "refund",
      params: { transaction_id: o.transactionId, value: o.value, currency: o.currency, event_source: "stripe_webhook" },
    },
  ]);
}
