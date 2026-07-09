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
  halalVerdicts: boolean;
  leadRouting: boolean;
  paidLeads: boolean;
  passport: boolean;
  listingEnrichment: boolean;
}

const truthy = (v: string | undefined) => v === "1" || v === "true" || v === "on";

export type FlagKey = keyof Flags;

/** flag → env var name (the current source of truth / fallback). */
export const FLAG_ENV: Record<FlagKey, string> = {
  paidTickets: "PAID_TICKETS_ENABLED",
  paidAds: "PAID_ADS_ENABLED",
  paidPlans: "PAID_PLANS_ENABLED",
  paidHotels: "PAID_HOTELS_ENABLED",
  paidFlights: "PAID_FLIGHTS_ENABLED",
  payNow: "PAYNOW_ENABLED",
  certVault: "CERT_VAULT_ENABLED",
  semanticSearch: "SEMANTIC_SEARCH_ENABLED",
  aiConcierge: "AI_CONCIERGE_ENABLED",
  halalVerdicts: "HALAL_VERDICTS_ENABLED",
  leadRouting: "LEAD_ROUTING_ENABLED",
  paidLeads: "PAID_LEADS_ENABLED",
  passport: "PASSPORT_ENABLED",
  listingEnrichment: "LISTING_ENRICHMENT_ENABLED",
};

/** flag → platform_settings column name (global admin override). */
export const FLAG_COLUMN: Record<FlagKey, string> = {
  paidTickets: "paid_tickets_enabled",
  paidAds: "paid_ads_enabled",
  paidPlans: "paid_plans_enabled",
  paidHotels: "paid_hotels_enabled",
  paidFlights: "paid_flights_enabled",
  payNow: "paynow_enabled",
  certVault: "cert_vault_enabled",
  semanticSearch: "semantic_search_enabled",
  aiConcierge: "ai_concierge_enabled",
  halalVerdicts: "halal_verdicts_enabled",
  leadRouting: "lead_routing_enabled",
  paidLeads: "paid_leads_enabled",
  passport: "passport_enabled",
  listingEnrichment: "listing_enrichment_enabled",
};

/** Env-only flags (the fallback layer). Pure + sync — safe to import anywhere. */
export function envFlags(): Flags {
  const out = {} as Flags;
  for (const k of Object.keys(FLAG_ENV) as FlagKey[]) out[k] = truthy(process.env[FLAG_ENV[k]]);
  return out;
}

export const DEFAULT_FLAGS: Flags = { paidTickets: false, paidAds: false, paidPlans: false, paidHotels: false, paidFlights: false, payNow: false, certVault: false, semanticSearch: false, aiConcierge: false, halalVerdicts: false, leadRouting: false, paidLeads: false, passport: false, listingEnrichment: false };
