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
  paidTransfers: boolean;
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
    paidTransfers: truthy(process.env.PAID_TRANSFERS_ENABLED),
  };
}

export const DEFAULT_FLAGS: Flags = { paidTickets: false, paidAds: false, paidPlans: false, paidHotels: false, paidFlights: false, paidTransfers: false };
