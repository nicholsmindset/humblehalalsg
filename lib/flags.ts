/* Humble Halal — monetization kill-switches.

   Server source of truth = env (later: Supabase `platform_settings`). All default
   OFF so the site launches free. The client/admin UI toggle (in app-context) only
   controls what paid affordances are SHOWN; real money routes always re-check the
   server flag here, so a client toggle can never enable charges on its own. */

export interface Flags {
  paidTickets: boolean;
  paidAds: boolean;
  paidPlans: boolean;
  paidHotels: boolean;
  paidFlights: boolean;
  payNow: boolean;
  certVault: boolean;
  semanticSearch: boolean;
  aiConcierge: boolean;
  leadRouting: boolean;
  paidLeads: boolean;
}

const truthy = (v: string | undefined) => v === "1" || v === "true" || v === "on";

/** Server-side flags (env-backed for now). Used to guard all payment API routes. */
export function getServerFlags(): Flags {
  return {
    paidTickets: truthy(process.env.PAID_TICKETS_ENABLED),
    paidAds: truthy(process.env.PAID_ADS_ENABLED),
    paidPlans: truthy(process.env.PAID_PLANS_ENABLED),
    paidHotels: truthy(process.env.PAID_HOTELS_ENABLED),
    paidFlights: truthy(process.env.PAID_FLIGHTS_ENABLED),
    // PayNow at ticket checkout (SGD, one-time payments only). Requires PayNow
    // activated on the Stripe account first — the checkout route retries
    // card-only if Stripe rejects the method, so flipping this early is safe.
    payNow: truthy(process.env.PAYNOW_ENABLED),
    // Halal Certificate Vault — owner upload + admin review. Default OFF for a
    // flag-gated pilot before GA. Not a payment route; gates the feature surface.
    certVault: truthy(process.env.CERT_VAULT_ENABLED),
    // LiteAPI semantic + room search (both beta). Default OFF; gates the "Describe
    // your stay" discovery surface. Not a payment route.
    semanticSearch: truthy(process.env.SEMANTIC_SEARCH_ENABLED),
    // AI travel concierge (agentic chat over hotels + flights). Default OFF; gates
    // the chat surface + /api/travel/concierge. Search/advise only — no payment.
    aiConcierge: truthy(process.env.AI_CONCIERGE_ENABLED),
    // Lead marketplace routing engine — owner leads tab, admin leads pipeline,
    // and quote→vendor routing. Default OFF (ship dark). Not a payment route;
    // when on but paidLeads off, leads route free during the beta.
    leadRouting: truthy(process.env.LEAD_ROUTING_ENABLED),
    // Paid lead subscriptions (Stripe). Default OFF → leads route free (beta).
    // Gates /api/checkout/leads and the quota-enforcement branch on acceptance.
    paidLeads: truthy(process.env.PAID_LEADS_ENABLED),
  };
}

export const DEFAULT_FLAGS: Flags = { paidTickets: false, paidAds: false, paidPlans: false, paidHotels: false, paidFlights: false, payNow: false, certVault: false, semanticSearch: false, aiConcierge: false, leadRouting: false, paidLeads: false };
