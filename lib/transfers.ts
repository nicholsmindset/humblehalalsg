import type { MozioRawResult, TransferQuote, TransferSearchInput } from "./mozio-types";

/* Pure normalization + simulated quotes for the transfers vertical. No I/O, no
   server-only — keep it unit-testable. Mirrors lib/flights.ts's role. */

export function normalizeQuotes(searchId: string, raw: MozioRawResult[]): TransferQuote[] {
  const out: TransferQuote[] = [];
  for (const r of raw) {
    const resultId = String(r.result_id || "");
    const price = r.total_price?.value;
    if (!resultId || price == null || !Number.isFinite(Number(price))) continue; // need an id + a price to book
    out.push({
      resultId,
      searchId,
      vehicleClass: String(r.vehicle_type || "Private transfer"),
      provider: String(r.provider_name || "Mozio partner"),
      providerLogo: r.provider_logo_url || undefined,
      seats: Math.max(1, Number(r.max_passengers) || 4),
      price: Number(price),
      currency: String(r.total_price?.currency || "USD"),
      refundable: !!r.cancellable,
      cancellationTerms: r.cancellation_policy || undefined,
      etaMinutes: Number.isFinite(Number(r.eta_minutes)) ? Number(r.eta_minutes) : undefined,
    });
  }
  return out;
}

// Stable, bounded hash so simulated prices are deterministic per route.
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0);
}

const TIERS = [
  { vehicleClass: "Private sedan", seats: 3, base: 28, provider: "Mozio partner" },
  { vehicleClass: "Private SUV", seats: 5, base: 44, provider: "Mozio partner" },
  { vehicleClass: "Private van", seats: 8, base: 62, provider: "Mozio partner" },
];

export function simulatedQuotes(input: TransferSearchInput): TransferQuote[] {
  const currency = (input.currency || "USD").toUpperCase().slice(0, 3);
  const seed = hash(`${input.pickup}|${input.dropoff}|${input.pickupDateTime}`);
  return TIERS
    .filter((t) => t.seats >= input.passengers)
    .map((t, i) => {
      const price = Math.round(t.base + ((seed >> (i * 4)) % 40));
      return {
        resultId: `sim-${i}-${seed.toString(36)}`,
        searchId: `sim-search-${seed.toString(36)}`,
        vehicleClass: t.vehicleClass,
        provider: t.provider,
        seats: t.seats,
        price,
        currency,
        refundable: true,
        cancellationTerms: "Free cancellation up to 24h before pickup (simulated)",
        etaMinutes: 30 + (i * 5),
      };
    });
}
