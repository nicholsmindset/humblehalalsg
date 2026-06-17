/* Humble Halal — Mozio transfer types. Pure types + the subset of raw Mozio v2
   fields we read (assumed contract; confirmed at onboarding). NO server-only
   here so lib/transfers.ts stays unit-testable. */

export interface TransferSearchInput {
  pickup: string;          // address or IATA code
  dropoff: string;         // address or IATA code
  pickupDateTime: string;  // ISO 8601, e.g. 2026-09-01T10:00
  passengers: number;
  currency?: string;       // ISO 4217, default USD
  language?: string;       // default en
}

export interface TransferQuote {
  resultId: string;
  searchId: string;
  vehicleClass: string;
  provider: string;
  providerLogo?: string;
  seats: number;
  price: number;           // total in `currency`
  currency: string;
  refundable: boolean;
  cancellationTerms?: string;
  etaMinutes?: number;
}

export interface TransferReservationInput {
  searchId: string;
  resultId: string;
  contact: { firstName: string; lastName: string; email: string; phone: string };
  passengers: number;
  currency: string;
}

// Subset of Mozio raw result fields we read (names assumed; confirm at onboarding).
export interface MozioRawResult {
  result_id?: string;
  vehicle_type?: string;
  provider_name?: string;
  provider_logo_url?: string;
  max_passengers?: number;
  total_price?: { value?: number; currency?: string };
  cancellable?: boolean;
  cancellation_policy?: string;
  eta_minutes?: number;
}
