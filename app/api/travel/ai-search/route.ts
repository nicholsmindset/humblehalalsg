import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { runHotelSearch, defaultStayDates } from "@/lib/travel-data";
import { liteapiConfigured, searchPlaces } from "@/lib/liteapi";
import { travelCities } from "@/lib/travel-locations";
import type { HotelFlags, Hotel } from "@/lib/halal-hotels";

/* Phase 2 — AI "Search + Advise" for halal hotels. One LLM call turns a natural-
   language request into a structured HotelIntent + a warm advisory sentence, then
   we resolve the destination (curated hub → LiteAPI places), default the dates and
   run the SAME canonical search as /api/travel/search (lib/travel-data). GROUNDED:
   we surface Muslim-friendly facilities a property declares — we NEVER assert halal
   certification. Graceful: no AI key → keyword fallback still runs the real search;
   no LiteAPI key → simulated empty result. */
export const dynamic = "force-dynamic";

// The 8 Muslim-friendly flags the search can post-filter on.
const FLAG_KEYS = [
  "has_prayer_room",
  "halal_food_onsite",
  "halal_food_nearby",
  "alcohol_free",
  "women_only_facilities",
  "qibla_direction",
  "prayer_mat_available",
  "near_mosque",
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type ResolvedDest = { placeId?: string; cityName?: string; countryCode?: string; currency?: string; label: string } | null;

/** Resolve free-text destination: curated hub first (best halal copy + currency),
 *  else LiteAPI place autocomplete. Null when nothing matches. */
async function resolveDestination(destination: string): Promise<ResolvedDest> {
  const q = destination.trim();
  if (!q) return null;
  const low = q.toLowerCase();
  const hub = travelCities.find(
    (c) =>
      low.includes(c.name.toLowerCase()) ||
      low.includes(c.cityName.toLowerCase()) ||
      c.name.toLowerCase().includes(low),
  );
  if (hub) return { cityName: hub.cityName, countryCode: hub.countryCode, currency: hub.currency, label: hub.name };
  if (!liteapiConfigured()) return null;
  try {
    const places = await searchPlaces(q);
    const p = places[0];
    if (p?.placeId) return { placeId: p.placeId, label: p.displayName || p.formattedAddress || q };
  } catch {
    /* graceful */
  }
  return null;
}

/** Keyword fallback parse when no AI key is configured. */
function keywordParse(query: string): { destination: string | null; constraints: (keyof HotelFlags)[] } {
  const low = query.toLowerCase();
  const hub = travelCities.find((c) => low.includes(c.name.toLowerCase()) || low.includes(c.cityName.toLowerCase()));
  const constraints: (keyof HotelFlags)[] = [];
  if (/prayer\s*room|musholla|prayer\s*area|prayer\s*hall/.test(low)) constraints.push("has_prayer_room");
  if (/prayer\s*mat|prayer\s*rug|sajadah/.test(low)) constraints.push("prayer_mat_available");
  if (/alcohol[-\s]?free|no\s*alcohol|dry\s*hotel/.test(low)) constraints.push("alcohol_free");
  if (/halal\s*food|halal\s*restaurant|halal\s*dining|halal\s*breakfast/.test(low)) constraints.push("halal_food_onsite");
  if (/women[-\s]?only|female[-\s]?only|ladies[-\s]?only/.test(low)) constraints.push("women_only_facilities");
  if (/\bmosque\b|\bmasjid\b|near\s*a\s*mosque/.test(low)) constraints.push("near_mosque");
  if (/qibla|qiblah/.test(low)) constraints.push("qibla_direction");
  return { destination: hub ? hub.name : null, constraints: [...new Set(constraints)] };
}

interface Params {
  destination: string | null;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  rooms: number;
  constraints: string[];
}

function reply(opts: {
  ok?: boolean;
  simulated?: boolean;
  answer: string;
  params: Params;
  hotels?: Hotel[];
}) {
  return NextResponse.json({
    ok: opts.ok ?? true,
    ...(opts.simulated != null ? { simulated: opts.simulated } : {}),
    answer: opts.answer,
    params: opts.params,
    hotels: opts.hotels ?? [],
  });
}

export async function POST(req: Request) {
  // Paid LLM + LiteAPI calls — throttle per IP (unauthenticated public search).
  const rl = await rateLimit(req, "ai-travel", 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let query = "";
  try {
    query = String(((await req.json()) as { query?: unknown }).query || "").slice(0, 300).trim();
  } catch {
    /* noop */
  }
  if (query.length < 2) return NextResponse.json({ ok: false, error: "Tell us what you're looking for." }, { status: 422 });

  const { aiObject, aiConfigured, AI_MODEL_FAST } = await import("@/lib/ai");
  const today = new Date().toISOString().slice(0, 10);

  let destination: string | null = null;
  let checkin: string | null = null;
  let checkout: string | null = null;
  let nights: number | null = null;
  let adults = 2;
  let children = 0;
  let rooms = 1;
  let constraints: (keyof HotelFlags)[] = [];
  let answer = "";

  if (aiConfigured) {
    const Intent = z.object({
      answer: z.string().max(400),
      destination: z.string().nullable(),
      checkin: z.string().nullable(),
      checkout: z.string().nullable(),
      nights: z.number().int().min(1).max(30).nullable(),
      adults: z.number().int().min(1).max(9).default(2),
      children: z.number().int().min(0).max(8).default(0),
      rooms: z.number().int().min(1).max(8).default(1),
      constraints: z.array(z.enum(FLAG_KEYS)).default([]),
    });
    const out = await aiObject(Intent, {
      model: AI_MODEL_FAST,
      system:
        `You are the Humble Halal travel concierge. Today is ${today}. Extract a hotel-search ` +
        "intent from the user's request. Resolve relative dates (\"next weekend\", \"first week of " +
        "Ramadan\", \"in March\") to ISO yyyy-mm-dd in the FUTURE; leave dates null if truly unspecified. " +
        "Set constraints from this list ONLY when the user expresses that halal need: " +
        FLAG_KEYS.join(", ") +
        ". In `answer`, write ONE warm sentence framing the search. NEVER assert a hotel is halal-" +
        "certified — we surface Muslim-friendly facilities a property declares and tell travellers to " +
        "confirm with the hotel and the MUIS HalalSG register. If no destination is given, set " +
        "destination to null and ask for it warmly in `answer`.",
      prompt: `User request: "${query}"`,
    });
    if (out) {
      destination = out.destination?.trim() || null;
      checkin = out.checkin && DATE_RE.test(out.checkin) ? out.checkin : null;
      checkout = out.checkout && DATE_RE.test(out.checkout) ? out.checkout : null;
      nights = out.nights ?? null;
      adults = out.adults;
      children = out.children;
      rooms = out.rooms;
      constraints = out.constraints as (keyof HotelFlags)[];
      answer = out.answer;
    }
  }

  // Fallback parse (no AI key, or AI returned null).
  if (!answer) {
    const kw = keywordParse(query);
    destination = kw.destination;
    constraints = kw.constraints;
    answer = destination
      ? `Here are Muslim-friendly stays in ${destination}. We surface the facilities each property declares — always confirm details with the hotel and the MUIS HalalSG register.`
      : "Tell me which city or destination you'd like to stay in and I'll find Muslim-friendly hotels there.";
  }

  // Resolve dates: prefer explicit, then nights from check-in, else default window.
  if (!checkin || !checkout) {
    const def = defaultStayDates(nights || 2);
    checkin = checkin || def.checkin;
    if (!checkout) {
      checkout = nights && checkin
        ? new Date(Date.parse(checkin) + nights * 864e5).toISOString().slice(0, 10)
        : def.checkout;
    }
  }
  if (checkout <= checkin) checkout = new Date(Date.parse(checkin) + (nights || 2) * 864e5).toISOString().slice(0, 10);

  const params: Params = {
    destination,
    checkin,
    checkout,
    adults,
    children,
    rooms,
    constraints,
  };

  // No destination → can't search; return the advisory asking for one.
  if (!destination) return reply({ answer, params });

  if (!liteapiConfigured()) return reply({ simulated: true, answer, params });

  const dest = await resolveDestination(destination);
  if (!dest) {
    return reply({
      answer: `${answer} I couldn't pin down "${destination}" — try a nearby city or a well-known landmark.`,
      params,
    });
  }
  // Surface the resolved label back to the UI.
  params.destination = dest.label;

  const { simulated, hotels } = await runHotelSearch({
    placeId: dest.placeId,
    cityName: dest.cityName,
    countryCode: dest.countryCode,
    checkin,
    checkout,
    currency: dest.currency || "USD",
    adults,
    children,
    rooms,
    constraints,
  });

  return reply({ simulated, answer, params, hotels });
}
