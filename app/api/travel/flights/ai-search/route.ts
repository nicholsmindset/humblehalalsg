import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerFlags } from "@/lib/feature-flags";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { liteapiConfigured, searchAirports, searchFlights } from "@/lib/liteapi";
import { normalizeItineraries, type FlightItinerary } from "@/lib/flights";

/* Phase 2 — AI "Search + Advise" for flights. One LLM call turns natural language
   into a structured FlightIntent + a warm sentence, then we resolve city→IATA via
   LiteAPI airports, build the SAME body as /api/travel/flights/search and call
   searchFlights → normalizeItineraries. Discovery only. Graceful: no AI key →
   keyword fallback; no LiteAPI key → simulated empty result. LiteAPI Flights has
   PRODUCTION access — key selection is handled in lib/liteapi (no change here). */
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IATA_RE = /^[A-Z]{3}$/;
const CABIN_MAP: Record<string, string> = {
  economy: "ECONOMY",
  premium: "PREMIUM_ECONOMY",
  business: "BUSINESS",
  first: "FIRST",
};

interface Params {
  origin: string | null;
  destination: string | null;
  date: string | null;
  returnDate: string | null;
  tripType: "round" | "one";
  adults: number;
  children: number;
  infants: number;
  cabin: string | null;
  nonStop: boolean;
}

/** Resolve a city name or IATA code to an IATA airport code. */
async function resolveIata(text: string): Promise<string | null> {
  const t = (text || "").trim().toUpperCase();
  if (IATA_RE.test(t)) return t;
  if (!liteapiConfigured()) return null;
  try {
    const airports = await searchAirports(text.trim());
    const withService = airports.find((a) => a.hasAirlineService && IATA_RE.test(a.iata));
    const first = withService || airports.find((a) => IATA_RE.test(a.iata));
    return first?.iata?.toUpperCase() || null;
  } catch {
    return null;
  }
}

function reply(opts: { simulated?: boolean; answer: string; params: Params; itineraries?: FlightItinerary[] }) {
  return NextResponse.json({
    ok: true,
    ...(opts.simulated != null ? { simulated: opts.simulated } : {}),
    answer: opts.answer,
    params: opts.params,
    itineraries: opts.itineraries ?? [],
  });
}

export async function POST(req: Request) {
  // aiConcierge is the site-wide AI kill-switch — an AI-spend route must honour
  // it (matches app/api/travel/concierge). Was ungated (audit aiConcierge-01).
  if (!(await getServerFlags()).aiConcierge) {
    return NextResponse.json({ ok: false, error: "concierge_disabled" }, { status: 403 });
  }
  const rl = await rateLimit(req, "ai-flights", 20, 60, { failClosed: true });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let query = "";
  try {
    query = String(((await req.json()) as { query?: unknown }).query || "").slice(0, 300).trim();
  } catch {
    /* noop */
  }
  if (query.length < 2) return NextResponse.json({ ok: false, error: "Tell us where you'd like to fly." }, { status: 422 });

  const { aiObject, aiConfigured, AI_MODEL_FAST } = await import("@/lib/ai");
  const today = new Date().toISOString().slice(0, 10);

  let originText: string | null = null;
  let destText: string | null = null;
  let date: string | null = null;
  let returnDate: string | null = null;
  let tripType: "round" | "one" = "one";
  let adults = 1;
  let children = 0;
  let infants = 0;
  let cabin: string | null = null;
  let nonStop = false;
  let answer = "";

  if (aiConfigured) {
    const Intent = z.object({
      answer: z.string().max(400),
      origin: z.string().nullable(),
      destination: z.string().nullable(),
      date: z.string().nullable(),
      returnDate: z.string().nullable(),
      tripType: z.enum(["round", "one"]),
      adults: z.number().int().min(1).max(9).default(1),
      children: z.number().int().min(0).max(8).default(0),
      infants: z.number().int().min(0).max(8).default(0),
      cabin: z.enum(["economy", "premium", "business", "first"]).nullable(),
      nonStop: z.boolean().default(false),
    });
    const out = await aiObject(Intent, {
      model: AI_MODEL_FAST,
      system:
        `You are the Humble Halal travel concierge. Today is ${today}. Extract a flight-search intent. ` +
        "origin/destination may be a city name or an IATA code. Resolve relative dates (\"next Friday\", " +
        "\"first week of Ramadan\") to ISO yyyy-mm-dd in the FUTURE; leave null if unspecified. Set " +
        "tripType to \"round\" only when a return is implied, and fill returnDate then. In `answer`, write " +
        "ONE warm sentence framing the search. If origin or destination is missing, leave it null and ask " +
        "for it in `answer`. Never make promises about airline halal meals — that's confirmed at booking.",
      prompt: `User request: "${query}"`,
    });
    if (out) {
      originText = out.origin?.trim() || null;
      destText = out.destination?.trim() || null;
      date = out.date && DATE_RE.test(out.date) ? out.date : null;
      returnDate = out.returnDate && DATE_RE.test(out.returnDate) ? out.returnDate : null;
      tripType = out.tripType;
      adults = out.adults;
      children = out.children;
      infants = out.infants;
      cabin = out.cabin;
      nonStop = out.nonStop;
      answer = out.answer;
    }
  }

  // Fallback: pull IATA codes / "from X to Y" out of the text.
  if (!answer) {
    const codes = (query.toUpperCase().match(/\b[A-Z]{3}\b/g) || []).filter((c) => IATA_RE.test(c));
    const m = query.match(/from\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s|$|,|\.)/i);
    originText = codes[0] || (m ? m[1].trim() : null);
    destText = codes[1] || (m ? m[2].trim() : null);
    nonStop = /non[-\s]?stop|direct/i.test(query);
    if (/round[-\s]?trip|return/i.test(query)) tripType = "round";
    answer =
      originText && destText
        ? `Searching flights from ${originText} to ${destText}. Confirm any meal preferences (incl. halal/Muslim meal) directly with the airline at booking.`
        : "Tell me your departure city and destination and I'll find flights for you.";
  }

  // Default the outbound date if the user didn't give one.
  if (!date) date = new Date(Date.now() + 21 * 864e5).toISOString().slice(0, 10);
  if (tripType === "round" && !returnDate) returnDate = new Date(Date.parse(date) + 7 * 864e5).toISOString().slice(0, 10);

  const params: Params = {
    origin: originText,
    destination: destText,
    date,
    returnDate: tripType === "round" ? returnDate : null,
    tripType,
    adults,
    children,
    infants,
    cabin,
    nonStop,
  };

  if (!originText || !destText) return reply({ answer, params });
  if (!liteapiConfigured()) return reply({ simulated: true, answer, params });

  const [origin, destination] = await Promise.all([resolveIata(originText), resolveIata(destText)]);
  if (!origin || !destination || origin === destination) {
    return reply({
      answer: `${answer} I couldn't match those airports — try city names or 3-letter IATA codes (e.g. SIN, JED).`,
      params,
    });
  }
  params.origin = origin;
  params.destination = destination;

  // Build the SAME body as /api/travel/flights/search.
  const legs = [{ origin, destination, date, direction: "OUTBOUND" }];
  if (tripType === "round" && returnDate) legs.push({ origin: destination, destination: origin, date: returnDate, direction: "INBOUND" });
  const cabinCode = cabin ? CABIN_MAP[cabin] : undefined;

  try {
    const data = await searchFlights({
      legs,
      adults: Math.min(9, Math.max(1, adults)),
      children: Math.min(8, Math.max(0, children)),
      cabin: cabinCode,
      currency: "USD",
    });
    let itineraries = normalizeItineraries(data).slice(0, 60);
    if (nonStop) itineraries = itineraries.filter((it) => it.stops === 0);
    return reply({ simulated: false, answer, params, itineraries });
  } catch {
    return reply({ simulated: false, answer, params, itineraries: [] });
  }
}
