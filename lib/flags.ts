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
  certVault: boolean;
  semanticSearch: boolean;
  aiConcierge: boolean;
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
    // Halal Certificate Vault — owner upload + admin review. Default OFF for a
    // flag-gated pilot before GA. Not a payment route; gates the feature surface.
    certVault: truthy(process.env.CERT_VAULT_ENABLED),
    // LiteAPI semantic + room search (both beta). Default OFF; gates the "Describe
    // your stay" discovery surface. Not a payment route.
    semanticSearch: truthy(process.env.SEMANTIC_SEARCH_ENABLED),
    // AI travel concierge (agentic chat over hotels + flights). Default OFF; gates
    // the chat surface + /api/travel/concierge. Search/advise only — no payment.
    aiConcierge: truthy(process.env.AI_CONCIERGE_ENABLED),
  };
}

export const DEFAULT_FLAGS: Flags = { paidTickets: false, paidAds: false, paidPlans: false, paidHotels: false, paidFlights: false, certVault: false, semanticSearch: false, aiConcierge: false };
