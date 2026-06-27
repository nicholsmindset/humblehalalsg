import "server-only";
/* Humble Halal — AI travel-concierge tools. Thin wrappers over the existing LiteAPI
   search paths (lib/travel-data, lib/liteapi, lib/flights) exposed as AI SDK tools so
   the agent can search hotels + flights and hand off to the (gated, secure) booking
   flow. GROUNDED + halal-safe: returns the facilities a property declares + a
   Muslim-friendly score — never asserts MUIS certification. Search/discovery only. */
import { tool } from "ai";
import { z } from "zod";
import { runHotelSearch, defaultStayDates } from "@/lib/travel-data";
import { liteapiConfigured, searchPlaces, searchAirports, searchFlights as searchFlightsApi, getHotel, askHotel as askHotelApi } from "@/lib/liteapi";
import { normalizeItineraries } from "@/lib/flights";
import { activeFlagLabels, hotelFromContent, type HotelFlags } from "@/lib/halal-hotels";
import { nearestHaram } from "@/lib/haversine";
import { nearbyPlaces } from "@/lib/mosques-nearby";
import { travelCities } from "@/lib/travel-locations";

const FLAG_KEYS = ["has_prayer_room", "halal_food_onsite", "halal_food_nearby", "alcohol_free", "women_only_facilities", "qibla_direction", "prayer_mat_available", "near_mosque"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** City/area → curated hub (best halal copy + currency) or a LiteAPI place. */
async function resolveDestination(q: string): Promise<{ placeId?: string; cityName?: string; countryCode?: string; currency?: string; label: string } | null> {
  const low = q.trim().toLowerCase();
  const hub = travelCities.find((c) => low.includes(c.name.toLowerCase()) || low.includes(c.cityName.toLowerCase()) || c.name.toLowerCase().includes(low));
  if (hub) return { cityName: hub.cityName, countryCode: hub.countryCode, currency: hub.currency, label: hub.name };
  if (!liteapiConfigured()) return null;
  try {
    const places = await searchPlaces(q);
    const p = places[0];
    if (p?.placeId) return { placeId: p.placeId, currency: "USD", label: p.displayName || p.formattedAddress || q };
  } catch {
    /* graceful */
  }
  return null;
}

/** City or 3-letter code → IATA. */
async function resolveAirport(q: string): Promise<{ iata: string; label: string } | null> {
  const s = q.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(s)) return { iata: s, label: s };
  try {
    const a = await searchAirports(q);
    if (a[0]?.iata) return { iata: a[0].iata, label: `${a[0].city || a[0].name || a[0].iata} (${a[0].iata})` };
  } catch {
    /* graceful */
  }
  return null;
}

export const searchHotels = tool({
  description:
    "Search Muslim-friendly hotels in a city or area. Returns options with the halal facilities each property declares (prayer room, halal food, alcohol-free, women-only, qibla, near a mosque), a Muslim-friendly score (0-100), the nightly 'from' price, and a link to view & book. Use when the traveller wants somewhere to stay.",
  inputSchema: z.object({
    destination: z.string().describe("City or area, e.g. 'Makkah', 'Istanbul', 'Singapore'"),
    checkin: z.string().optional().describe("Check-in YYYY-MM-DD; omit to default to ~30 days out"),
    checkout: z.string().optional().describe("Check-out YYYY-MM-DD"),
    adults: z.number().int().min(1).max(9).optional(),
    rooms: z.number().int().min(1).max(8).optional(),
    halalNeeds: z.array(z.enum(FLAG_KEYS)).optional().describe("Muslim-friendly must-haves to filter by"),
  }),
  execute: async ({ destination, checkin, checkout, adults, rooms, halalNeeds }) => {
    const dest = await resolveDestination(destination);
    if (!dest) return { ok: false as const, message: `I couldn't find "${destination}". Try a well-known city or landmark.`, hotels: [] };
    const dates = checkin && checkout && DATE_RE.test(checkin) && DATE_RE.test(checkout) ? { checkin, checkout } : defaultStayDates(2);
    const { hotels, simulated } = await runHotelSearch({
      placeId: dest.placeId, cityName: dest.cityName, countryCode: dest.countryCode,
      checkin: dates.checkin, checkout: dates.checkout, currency: dest.currency,
      adults: adults ?? 2, rooms: rooms ?? 1, constraints: halalNeeds as (keyof HotelFlags)[] | undefined, limit: 8,
    });
    return {
      ok: true as const, simulated, destination: dest.label, checkin: dates.checkin, checkout: dates.checkout,
      hotels: hotels.slice(0, 6).map((h) => ({
        id: h.id, name: h.name, city: h.city ?? "", stars: h.stars ?? null, guestRating: h.guestRating ?? null,
        halalScore: h.halalScore, price: h.priceFrom?.amount ?? null, currency: h.priceFrom?.currency ?? dest.currency ?? "USD",
        flags: activeFlagLabels(h.flags), image: h.image ?? null,
        bookUrl: `/travel/hotel/${h.id}?checkin=${dates.checkin}&checkout=${dates.checkout}`,
      })),
    };
  },
});

export const searchFlights = tool({
  description:
    "Search flights between two airports/cities for Muslim travellers (Muslim-meal & prayer-layover aware). Returns fares with route, times, stops and a link to book. Defaults the origin to Singapore (SIN) if unspecified.",
  inputSchema: z.object({
    origin: z.string().optional().describe("Origin city or IATA; defaults to Singapore (SIN)"),
    destination: z.string().describe("Destination city or IATA, e.g. 'Jeddah', 'JED', 'Istanbul'"),
    date: z.string().describe("Departure date YYYY-MM-DD"),
    returnDate: z.string().optional().describe("Return date YYYY-MM-DD for round trips"),
    adults: z.number().int().min(1).max(9).optional(),
    cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).optional(),
  }),
  execute: async ({ origin, destination, date, returnDate, adults, cabin }) => {
    if (!DATE_RE.test(date)) return { ok: false as const, message: "I need a departure date (YYYY-MM-DD).", flights: [] };
    const o = await resolveAirport(origin || "Singapore");
    const d = await resolveAirport(destination);
    if (!o || !d) return { ok: false as const, message: "I couldn't resolve those airports — try a city or 3-letter code (e.g. SIN, JED).", flights: [] };
    const legs = [{ origin: o.iata, destination: d.iata, date, direction: "OUTBOUND" }];
    if (returnDate && DATE_RE.test(returnDate)) legs.push({ origin: d.iata, destination: o.iata, date: returnDate, direction: "INBOUND" });
    let raw: unknown[] = [];
    try {
      raw = await searchFlightsApi({ legs, adults: adults ?? 1, cabin, currency: "SGD", country: "SG" });
    } catch {
      return { ok: false as const, message: "Flight search is unavailable right now.", flights: [] };
    }
    const its = normalizeItineraries(raw).slice(0, 6);
    const hhmm = (iso?: string) => (iso ? new Date(iso).toISOString().slice(11, 16) : "");
    return {
      ok: true as const, origin: o.label, destination: d.label, date, roundTrip: !!returnDate,
      flights: its.map((it) => {
        const out = it.legs[0];
        const first = out?.segments[0];
        const last = out?.segments[out.segments.length - 1];
        return {
          offerId: it.offerId, price: it.price ?? null, currency: it.currency ?? "SGD",
          route: `${o.iata} → ${d.iata}`, carrier: it.carriers[0] ?? "",
          depart: hhmm(first?.departISO), arrive: hhmm(last?.arriveISO),
          stops: out?.stops ?? 0, durationMin: out?.durationMin ?? it.durationMin,
          bookUrl: `/travel/flights/booking?offerId=${encodeURIComponent(it.offerId)}&from=${o.iata}&to=${d.iata}&date=${date}&adults=${adults ?? 1}${returnDate ? `&rt=1&rdate=${returnDate}` : ""}`,
        };
      }),
    };
  },
});

export const askHotel = tool({
  description:
    "Answer a specific question about ONE hotel — prayer room, alcohol policy, halal dining, check-in time, parking, family rooms, etc. — using only that hotel's own information. Pass the hotel `id` from a prior searchHotels result. Grounded: if the property's data doesn't say, it returns that honestly rather than guessing.",
  inputSchema: z.object({
    hotelId: z.string().describe("LiteAPI hotel id from a prior searchHotels result"),
    question: z.string().describe("The traveller's question about this hotel"),
  }),
  execute: async ({ hotelId, question }) => {
    const res = await askHotelApi(hotelId, question);
    if (!res?.answer) {
      return { ok: false as const, message: "I don't have that detail for this hotel — best to confirm with the property directly." };
    }
    return { ok: true as const, answer: res.answer };
  },
});

export const hotelHalalProfile = tool({
  description:
    "Get the Muslim-friendly profile of ONE hotel by id: the halal facilities it declares + its Muslim-friendly score, how far it is from the Haram (for Makkah/Madinah stays, straight-line), and the nearest mosques. Use the hotel `id` from searchHotels when the traveller asks 'how far is it from the Haram?', 'what halal facilities does it have?', or about nearby mosques. Discovery only — never asserts halal certification.",
  inputSchema: z.object({
    hotelId: z.string().describe("LiteAPI hotel id from a prior searchHotels result"),
  }),
  execute: async ({ hotelId }) => {
    const content = await getHotel(hotelId);
    if (!content) return { ok: false as const, message: "I couldn't load that hotel's details right now." };
    const hotel = hotelFromContent(content);
    const haram = hotel.coords ? nearestHaram(hotel.coords) : null;
    let nearestMosques: { name: string; distanceM: number }[] = [];
    if (hotel.coords) {
      try {
        const np = await nearbyPlaces(hotel.coords.lat, hotel.coords.lng, 2500);
        nearestMosques = np.mosques.slice(0, 3).map((m) => ({ name: m.name, distanceM: Math.round(m.distanceM) }));
      } catch {
        /* best-effort — distance + facilities still useful */
      }
    }
    return {
      ok: true as const,
      name: hotel.name,
      halalScore: hotel.halalScore,
      verified: hotel.verified,
      facilities: activeFlagLabels(hotel.flags),
      haram: haram ? { name: haram.haram.name, distanceM: Math.round(haram.distanceM) } : null,
      nearestMosques,
    };
  },
});
