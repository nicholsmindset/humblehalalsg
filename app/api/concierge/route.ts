import { NextResponse } from "next/server";
import { z } from "zod";
import { getDirectory } from "@/lib/directory";
import { getServerFlags } from "@/lib/feature-flags";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { runHotelSearch, defaultStayDates } from "@/lib/travel-data";
import { travelCities } from "@/lib/travel-locations";
import type { Hotel } from "@/lib/halal-hotels";
import type { Listing } from "@/lib/types";

/* Phase 2 — halal concierge / natural-language search. GROUNDED in the directory:
   the model may only choose from listings we pass it, and is told never to assert
   halal certification beyond each listing's stated tier (it explains, it never
   certifies). Travel-aware: when the query looks hotel/stay-shaped it ALSO runs the
   shared hotel search (lib/travel-data) and returns `hotels` alongside `results`.
   Graceful: with no AI key it falls back to keyword ranking. */
export const dynamic = "force-dynamic";

// Heuristic: does the query look like a hotel/stay request for a travel city?
const TRAVEL_RE = /\b(hotel|hotels|stay|staying|accommodation|umrah|hajj|resort|trip|travel|night|nights|check[\s-]?in)\b/i;
function travelMatch(q: string): { city: (typeof travelCities)[number] } | null {
  const low = q.toLowerCase();
  const city = travelCities.find((c) => low.includes(c.name.toLowerCase()) || low.includes(c.cityName.toLowerCase()));
  if (!city) return null;
  // Only treat as travel when there's also a stay-shaped signal OR an Umrah/Hajj hub.
  if (TRAVEL_RE.test(q) || city.umrah) return { city };
  return null;
}

/** Best-effort hotel results for a travel-shaped concierge query (never throws). */
async function travelHotels(query: string): Promise<Hotel[]> {
  const m = travelMatch(query);
  if (!m) return [];
  const { checkin, checkout } = defaultStayDates(2);
  try {
    const { hotels } = await runHotelSearch({
      cityName: m.city.cityName,
      countryCode: m.city.countryCode,
      currency: m.city.currency,
      checkin,
      checkout,
      adults: 2,
      rooms: 1,
      limit: 6,
    });
    return hotels.slice(0, 6);
  } catch {
    return [];
  }
}

const tierOf = (l: Listing): string =>
  l.badges.includes("muis") ? "MUIS Certified"
    : l.badges.includes("admin") ? "Admin Verified"
      : l.badges.includes("owned") ? "Muslim-owned (self-declared)"
        : l.badges.includes("pending") ? "Pending verification"
          : "Self-declared";

// Coarse keyword score so we send the model a relevant candidate subset (and so
// the no-AI fallback still returns sensible results).
function rank(listings: Listing[], q: string): Listing[] {
  const toks = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (!toks.length) return [...listings].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const score = (l: Listing) => {
    const hay = `${l.name} ${l.cuisine} ${l.area} ${l.cat} ${(l.tags || []).join(" ")}`.toLowerCase();
    return toks.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0) + (l.featured ? 0.5 : 0);
  };
  return [...listings].map((l) => [l, score(l)] as const).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([l]) => l);
}

export async function POST(req: Request) {
  // Kill-switch parity with /api/concierge/chat: the aiConcierge flag must turn
  // off EVERY concierge entry point — this single-shot route was ungated, so
  // flipping the flag off left a live AI-spend path (audit R4).
  if (!(await getServerFlags()).aiConcierge) {
    return NextResponse.json({ ok: false, error: "concierge_disabled" }, { status: 403 });
  }
  // Paid LLM call — throttle per IP so the endpoint can't be scripted into a
  // token-burn / cost-DoS (it's unauthenticated by design for public search).
  const rl = await rateLimit(req, "concierge", 20, 60, { failClosed: true });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let query = "";
  try { query = String(((await req.json()) as { query?: unknown }).query || "").slice(0, 300).trim(); } catch { /* noop */ }
  if (query.length < 2) return NextResponse.json({ ok: false, error: "Ask a question." }, { status: 422 });

  // Directory + (optional) travel hotels run together — hotels is best-effort and
  // only populated for travel/stay-shaped queries naming a curated city.
  const [all, hotels] = await Promise.all([getDirectory(), travelHotels(query)]);
  const ranked = rank(all, query);
  const candidates = (ranked.length ? ranked : all).slice(0, 40);

  const { aiObject, aiConfigured } = await import("@/lib/ai");

  // Fallback: no AI configured → keyword results + a plain answer.
  if (!aiConfigured) {
    const results = candidates.slice(0, 6);
    return NextResponse.json({
      ok: true,
      simulated: true,
      answer: results.length
        ? `Here are ${results.length} halal places matching “${query}”. Always confirm certification on MUIS HalalSG.`
        : hotels.length
          ? `Here are Muslim-friendly stays matching “${query}”. We surface declared facilities — confirm with the hotel and the MUIS HalalSG register.`
          : `No listings matched “${query}” yet — try a different area or cuisine.`,
      results,
      ...(hotels.length ? { hotels } : {}),
    });
  }

  const compact = candidates.map((l) => ({
    slug: l.slug, name: l.name, area: l.area, category: l.cat,
    cuisine: l.cuisine, halal_tier: tierOf(l), prayer_space: !!l.prayer, tags: (l.tags || []).slice(0, 6),
  }));

  const Answer = z.object({
    answer: z.string().max(600),
    slugs: z.array(z.string()).max(8),
  });

  const out = await aiObject(Answer, {
    system:
      "You are the Humble Halal concierge for Singapore. Recommend ONLY from the " +
      "provided listings (by slug) — never invent places. Never assert a place is " +
      "halal-certified beyond its stated halal_tier; when relevant, mention the tier " +
      "and remind users to confirm on the MUIS HalalSG register. Be concise and warm. " +
      "If nothing fits, say so honestly.",
    prompt: `User question: "${query}"\n\nListings (JSON):\n${JSON.stringify(compact)}\n\nReturn a short answer and the best matching slugs (max 8, most relevant first).`,
  });

  if (!out) {
    // AI errored → degrade to keyword results.
    const results = candidates.slice(0, 6);
    return NextResponse.json({ ok: true, simulated: true, answer: `Here are some matches for “${query}”.`, results, ...(hotels.length ? { hotels } : {}) });
  }

  const bySlug = new Map(all.map((l) => [l.slug, l] as const));
  const results = out.slugs.map((s) => bySlug.get(s)).filter(Boolean).slice(0, 8);
  return NextResponse.json({ ok: true, simulated: false, answer: out.answer, results, ...(hotels.length ? { hotels } : {}) });
}
