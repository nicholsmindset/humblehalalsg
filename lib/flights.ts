/* Humble Halal — flight journey normalization for the UI. Pure (client-safe).
   Turns LiteAPI /flights/rates `data[].journeys[]` into clean journey cards. */

export interface FlightSegment {
  carrierName: string;
  carrierCode?: string;
  carrierLogo?: string;
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  departISO: string;
  arriveISO: string;
  flight?: string;
  direction?: string;
  durationMin?: number;
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

/* ── rich itinerary model (zzzello-parity cards + booking breakdown) ──────── */

export interface PriceBreakdown { base?: number; taxes?: number; fees?: number; total?: number; currency?: string }
export interface BagTier { bagType: string; description: string; weightKg?: number; pieces: number; price?: number; currency?: string }
export interface FlightBaggage { carryOn: boolean; carryOnKg?: number; checkedIncluded: boolean; paid: BagTier[] }
export interface FlightLeg { direction: string; segments: FlightSegment[]; durationMin: number; stops: number }
export interface FareTerm { level: string; message: string }

export interface FlightItinerary {
  offerId: string;
  journeyKey?: string;
  price?: number;
  currency?: string;
  breakdown?: PriceBreakdown;
  expiration?: string;
  fareFamily?: string;
  refundable?: boolean;
  changeable?: boolean;
  seatsRemaining?: number;
  termsSummary: FareTerm[];
  baggage?: FlightBaggage;
  providerName?: string;
  providerLogo?: string;
  carriers: string[];
  legs: FlightLeg[];
  durationMin: number;
  stops: number;
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function rec(v: unknown): Record<string, unknown> {
  return (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
}

function mapSegment(s: Record<string, unknown>): FlightSegment {
  const carrier = rec(s.carrier);
  const dur = rec(s.duration);
  return {
    carrierName: String(carrier.marketingName || carrier.marketingCode || ""),
    carrierCode: carrier.marketingCode ? String(carrier.marketingCode) : undefined,
    carrierLogo: carrier.marketingLogo ? String(carrier.marketingLogo) : undefined,
    from: String(s.originCode || ""),
    to: String(s.destinationCode || ""),
    fromName: s.originName ? String(s.originName) : undefined,
    toName: s.destinationName ? String(s.destinationName) : undefined,
    departISO: String(s.departureTime || ""),
    arriveISO: String(s.arrivalTime || ""),
    flight: s.flight ? String(s.flight) : undefined,
    direction: s.direction ? String(s.direction) : undefined,
    durationMin: num(dur.minutes),
  };
}

function mapBaggage(b: Record<string, unknown>): FlightBaggage | undefined {
  if (!b || Object.keys(b).length === 0) return undefined;
  const incl = Array.isArray(b.included) ? (b.included as Record<string, unknown>[]) : [];
  const cabin = incl.find((x) => String(x.bagType) === "cabin");
  const paid = (Array.isArray(b.paid) ? (b.paid as Record<string, unknown>[]) : []).map((p) => {
    const price = rec(rec(p.pricing).display);
    return {
      bagType: String(p.bagType || "checked"),
      description: String(p.description || "Checked bag"),
      weightKg: num(p.weightKg),
      pieces: num(p.pieces) ?? 0,
      price: num(price.amount),
      currency: price.currency ? String(price.currency) : undefined,
    } as BagTier;
  });
  return {
    carryOn: Boolean(b.hasCarryOnBag),
    carryOnKg: cabin ? num(cabin.weightKg) : undefined,
    checkedIncluded: Boolean(b.hasCheckedBag),
    paid,
  };
}

/** Rich normalize: each LiteAPI journey → one itinerary with directional legs,
 *  price breakdown, baggage, fare terms and expiration (price-hold clock). */
export function normalizeItineraries(data: unknown[]): FlightItinerary[] {
  const out: FlightItinerary[] = [];
  for (const gx of data) {
    const g = rec(gx);
    for (const jx of (Array.isArray(g.journeys) ? g.journeys : [])) {
      const j = rec(jx);
      const off = rec(j.cheapestOffer || (Array.isArray(j.offers) ? (j.offers as unknown[])[0] : {}));
      const display = rec(rec(off.pricing).display);
      const fare = rec(off.fare);
      const terms = rec(off.terms);
      const provider = rec(off.provider);
      const segments = (Array.isArray(j.segments) ? (j.segments as Record<string, unknown>[]) : []).map(mapSegment);
      if (!segments.length) continue;

      // group into directional legs (round-trip = OUTBOUND + INBOUND)
      const order: string[] = [];
      const byDir = new Map<string, FlightSegment[]>();
      for (const s of segments) {
        const dir = s.direction || "OUTBOUND";
        if (!byDir.has(dir)) { byDir.set(dir, []); order.push(dir); }
        byDir.get(dir)!.push(s);
      }
      const legDur = new Map<string, number>();
      for (const ld of (Array.isArray(j.legDurations) ? (j.legDurations as Record<string, unknown>[]) : [])) {
        legDur.set(String(ld.direction || "OUTBOUND"), num(rec(ld.duration).minutes) ?? 0);
      }
      const legs: FlightLeg[] = order.map((dir) => {
        const segs = byDir.get(dir)!;
        const dm = legDur.get(dir) ?? (segs[0]?.departISO && segs[segs.length - 1]?.arriveISO
          ? Math.max(0, Math.round((Date.parse(segs[segs.length - 1].arriveISO) - Date.parse(segs[0].departISO)) / 60000)) : 0);
        return { direction: dir, segments: segs, durationMin: dm, stops: Math.max(0, segs.length - 1) };
      });

      const totalMin = num(rec(j.totalDuration).minutes) ?? legs.reduce((a, l) => a + l.durationMin, 0);
      out.push({
        offerId: String(off.offerId || ""),
        journeyKey: j.journeyKey ? String(j.journeyKey) : undefined,
        price: num(display.total),
        currency: display.currency ? String(display.currency) : undefined,
        breakdown: { base: num(display.base), taxes: num(display.taxes), fees: num(display.fees), total: num(display.total), currency: display.currency ? String(display.currency) : undefined },
        expiration: off.expiration ? String(off.expiration) : undefined,
        fareFamily: fare.family ? String(fare.family) : undefined,
        refundable: typeof terms.refundable === "boolean" ? terms.refundable : undefined,
        changeable: typeof terms.changeable === "boolean" ? terms.changeable : undefined,
        seatsRemaining: num(fare.seatsRemaining),
        termsSummary: (Array.isArray(terms.summary) ? (terms.summary as Record<string, unknown>[]) : []).map((t) => ({ level: String(t.level || "info"), message: String(t.message || "") })),
        baggage: mapBaggage(rec(off.baggage)),
        providerName: provider.code ? String(provider.code) : undefined,
        providerLogo: provider.logo ? String(provider.logo) : undefined,
        carriers: [...new Set(segments.map((s) => s.carrierName).filter(Boolean))],
        legs,
        durationMin: totalMin,
        stops: legs[0]?.stops ?? Math.max(0, segments.length - 1),
      });
    }
  }
  return out.filter((it) => it.legs.length > 0).sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
}

/** Sort helpers for the Best / Cheapest / Fastest tabs. */
export function sortItineraries(items: FlightItinerary[], mode: "best" | "cheapest" | "fastest"): FlightItinerary[] {
  const arr = [...items];
  if (mode === "cheapest") return arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (mode === "fastest") return arr.sort((a, b) => a.durationMin - b.durationMin);
  // best = balance of price + duration (normalized)
  const maxP = Math.max(...arr.map((x) => x.price ?? 0), 1);
  const maxD = Math.max(...arr.map((x) => x.durationMin), 1);
  return arr.sort((a, b) => (((a.price ?? maxP) / maxP) + a.durationMin / maxD) - (((b.price ?? maxP) / maxP) + b.durationMin / maxD));
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
