/* Humble Halal — flight journey normalization for the UI. Pure (client-safe).
   Turns LiteAPI /flights/rates `data[].journeys[]` into clean journey cards. */

export interface FlightSegment {
  carrierName: string;
  carrierLogo?: string;
  from: string;
  to: string;
  departISO: string;
  arriveISO: string;
  flight?: string;
}

export interface FlightJourney {
  offerId: string;
  price?: number;
  currency?: string;
  durationMin: number;
  stops: number;
  carriers: string[];
  segments: FlightSegment[];
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeJourneys(data: unknown[]): FlightJourney[] {
  const out: FlightJourney[] = [];
  for (const g of data as { journeys?: unknown[] }[]) {
    for (const jx of g.journeys || []) {
      const j = jx as Record<string, unknown>;
      const off = (j.cheapestOffer || (Array.isArray(j.offers) ? (j.offers as unknown[])[0] : {}) || {}) as Record<string, unknown>;
      const pricing = ((off.pricing as Record<string, unknown>)?.display || {}) as Record<string, unknown>;
      const rawSegs = Array.isArray(j.segments) ? (j.segments as Record<string, unknown>[]) : [];
      const segments: FlightSegment[] = rawSegs.map((s) => {
        const carrier = (s.carrier || {}) as Record<string, unknown>;
        return {
          carrierName: String(carrier.marketingName || carrier.marketingCode || ""),
          carrierLogo: carrier.marketingLogo ? String(carrier.marketingLogo) : undefined,
          from: String(s.originCode || ""),
          to: String(s.destinationCode || ""),
          departISO: String(s.departureTime || ""),
          arriveISO: String(s.arrivalTime || ""),
          flight: s.flight ? String(s.flight) : undefined,
        };
      });
      const depart = segments[0]?.departISO;
      const arrive = segments[segments.length - 1]?.arriveISO;
      const durationMin = depart && arrive ? Math.max(0, Math.round((Date.parse(arrive) - Date.parse(depart)) / 60000)) : 0;
      out.push({
        offerId: String(off.offerId || ""),
        price: num(pricing.total),
        currency: pricing.currency ? String(pricing.currency) : undefined,
        durationMin,
        stops: Math.max(0, segments.length - 1),
        carriers: [...new Set(segments.map((s) => s.carrierName).filter(Boolean))],
        segments,
      });
    }
  }
  return out.filter((j) => j.segments.length > 0).sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
}

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function fmtTime(iso: string): string {
  return iso.length >= 16 ? iso.slice(11, 16) : iso;
}

export function fmtDay(iso: string): string {
  if (iso.length < 10) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(m || 1) - 1];
  return `${d} ${mo}`;
}
