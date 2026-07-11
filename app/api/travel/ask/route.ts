import { NextResponse } from "next/server";
import { askHotel, liteapiConfigured } from "@/lib/liteapi";
import { getServerFlags } from "@/lib/feature-flags";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { hotelDetail } from "@/lib/travel-data";
import { aiText, aiConfigured } from "@/lib/ai";

/* "Ask AI about this hotel" — natural-language Q&A.
   1) Prefer LiteAPI's Ask-Hotel (answers from the hotel's published info).
   2) Fall back to an answer grounded in OUR human-verified muslim-friendly overlay
      + nearby mosques/halal food (the halal value prop) — so halal questions get a
      verified answer even when LiteAPI can't, and in sandbox/without an AI key a
      deterministic flag summary is returned. */

interface HalalFacts {
  name: string;
  human_verified: boolean;
  prayer_room: boolean;
  halal_food_onsite: boolean;
  halal_food_nearby: boolean;
  alcohol_free: boolean;
  qibla_direction: boolean;
  prayer_mat_available: boolean;
  women_only_facilities: boolean;
  nearby_mosques: string[];
  nearby_halal_food: string[];
  description: string;
}

function flagSummary(f: HalalFacts): string {
  const has: string[] = [];
  if (f.prayer_room) has.push("a prayer room");
  if (f.halal_food_onsite) has.push("halal food on-site");
  else if (f.halal_food_nearby) has.push("halal food nearby");
  if (f.alcohol_free) has.push("an alcohol-free policy");
  if (f.qibla_direction) has.push("qibla direction marked");
  if (f.prayer_mat_available) has.push("prayer mats");
  if (f.women_only_facilities) has.push("women-only facilities");
  if (f.nearby_mosques.length) has.push(`a mosque nearby (${f.nearby_mosques[0]})`);
  const lead = f.human_verified ? "Based on our verified halal overlay" : "Based on available data";
  return has.length
    ? `${lead}, ${f.name} offers ${has.join(", ")}.`
    : `${lead}, we don't have confirmed Muslim-friendly amenities for ${f.name} yet — please contact the hotel directly to confirm.`;
}

/** Answer grounded ONLY in our verified overlay + nearby data. */
async function overlayGroundedAnswer(hotelId: string, q: string): Promise<string | null> {
  const detail = await hotelDetail(hotelId);
  if (!detail) return null;
  const h = detail.hotel;
  const f = h.flags;
  const facts: HalalFacts = {
    name: h.name,
    human_verified: h.verified,
    prayer_room: f.has_prayer_room,
    halal_food_onsite: f.halal_food_onsite,
    halal_food_nearby: f.halal_food_nearby,
    alcohol_free: f.alcohol_free,
    qibla_direction: f.qibla_direction,
    prayer_mat_available: f.prayer_mat_available,
    women_only_facilities: f.women_only_facilities,
    nearby_mosques: detail.mosques.slice(0, 5).map((m) => m.name).filter(Boolean),
    nearby_halal_food: detail.halalFood.slice(0, 5).map((p) => p.name).filter(Boolean),
    description: (h.description || "").slice(0, 800),
  };
  if (!aiConfigured) return flagSummary(facts);
  const system =
    "You answer halal-friendliness questions for a halal travel directory. Answer " +
    "ONLY from the FACTS (a human-verified halal overlay + nearby mosques/halal food). " +
    "Be concise (1–3 sentences), honest, never invent amenities; if a fact isn't " +
    "present, say it isn't confirmed and suggest contacting the hotel.";
  const answer = await aiText({ system, prompt: `FACTS (JSON):\n${JSON.stringify(facts)}\n\nQUESTION: ${q}` });
  return answer || flagSummary(facts);
}

export async function GET(req: Request) {
  // aiConcierge is the site-wide AI kill-switch — an AI-spend route must honour
  // it (matches app/api/travel/concierge). Was ungated (audit aiConcierge-01).
  if (!(await getServerFlags()).aiConcierge) {
    return NextResponse.json({ ok: false, error: "concierge_disabled" }, { status: 403 });
  }
  const rl = await rateLimit(req, "hotel-ask", 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);
  const sp = new URL(req.url).searchParams;
  const hotelId = (sp.get("hotelId") || "").trim();
  const q = (sp.get("q") || "").trim().slice(0, 200);
  if (!hotelId || q.length < 3) return NextResponse.json({ ok: false, error: "Ask a question" }, { status: 422 });

  // 1) LiteAPI Ask-Hotel (general published info).
  if (liteapiConfigured()) {
    try {
      const r = await askHotel(hotelId, q);
      if (r?.answer) return NextResponse.json({ ok: true, answer: r.answer, searchUsed: r.searchUsed });
    } catch {
      /* fall through to overlay-grounded */
    }
  }

  // 2) Verified-overlay grounded answer (halal value prop).
  try {
    const grounded = await overlayGroundedAnswer(hotelId, q);
    if (grounded) return NextResponse.json({ ok: true, answer: grounded, grounded: "overlay" });
  } catch {
    /* noop */
  }
  return NextResponse.json({ ok: true, simulated: !liteapiConfigured(), answer: "" });
}
