import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { hotelHighlightFacts, type HotelHighlightFacts } from "@/lib/travel-data";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Phase 2 — AI "highlights for a Muslim traveller" for a hotel. Summarises ONLY
   grounded facts (declared flags, amenities, sentiment pros, nearby mosque/halal
   counts) — leads with prayer/halal/alcohol facts and NEVER claims certification.
   Cached in Supabase (hotel_ai_highlights) for 7 days to cap token spend, with a
   deterministic fallback so the array is never empty (and works with no AI key). */
export const dynamic = "force-dynamic";

const CACHE_DAYS = 7;

// Icon names from the UI icon set (components/ui.tsx ICONS). The model must pick
// from these so the rendered glyph always resolves.
const ICONS = ["mosque", "utensils", "crescent", "pin", "star", "shield-check", "sparkles", "home", "near", "sun", "moon"] as const;
type Highlight = { icon: string; title: string; blurb: string };

/** Map an active-flag label to a sensible icon for the deterministic fallback. */
function iconForLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("prayer room")) return "mosque";
  if (l.includes("prayer mat")) return "moon";
  if (l.includes("qibla")) return "near";
  if (l.includes("halal")) return "utensils";
  if (l.includes("alcohol")) return "shield-check";
  if (l.includes("mosque")) return "mosque";
  if (l.includes("women")) return "home";
  return "crescent";
}

/** Deterministic, grounded highlights from flags + nearby counts (never empty
 *  when there is ANYTHING to say; returns [] only for a truly bare hotel). */
function fallbackHighlights(f: HotelHighlightFacts): Highlight[] {
  const out: Highlight[] = [];
  for (const label of f.flagLabels) {
    if (out.length >= 4) break;
    out.push({ icon: iconForLabel(label), title: label.slice(0, 48), blurb: `${label} declared by this property — confirm specifics with the hotel.`.slice(0, 160) });
  }
  if (out.length < 4 && f.mosqueCount > 0) {
    const near = f.nearestMosqueM != null ? (f.nearestMosqueM < 1000 ? `${Math.round(f.nearestMosqueM / 10) * 10} m` : `${(f.nearestMosqueM / 1000).toFixed(1)} km`) : null;
    out.push({ icon: "mosque", title: "Mosques nearby", blurb: `${f.mosqueCount} mosque${f.mosqueCount > 1 ? "s" : ""} mapped nearby${near ? `, closest ~${near}` : ""}.`.slice(0, 160) });
  }
  if (out.length < 4 && f.halalFoodCount > 0) {
    out.push({ icon: "utensils", title: "Halal dining nearby", blurb: `${f.halalFoodCount} halal eater${f.halalFoodCount > 1 ? "ies" : "y"} mapped within walking distance.`.slice(0, 160) });
  }
  if (out.length < 4 && f.guestRating && f.reviewCount) {
    out.push({ icon: "star", title: "Well rated by guests", blurb: `Scored ${f.guestRating.toFixed(1)}/10 across ${f.reviewCount.toLocaleString()} reviews.`.slice(0, 160) });
  }
  return out.slice(0, 4);
}

export async function POST(req: Request) {
  // failClosed: LLM-spend route — a limiter (Upstash) outage must deny rather
  // than allow unbounded AI cost (matches the sibling concierge routes).
  const rl = await rateLimit(req, "highlights", 30, 60, { failClosed: true });
  if (!rl.ok) return tooMany(rl.retryAfter);

  let hotelId = "";
  try {
    hotelId = String(((await req.json()) as { hotelId?: unknown }).hotelId || "").trim().slice(0, 100);
  } catch {
    /* noop */
  }
  if (!hotelId) return NextResponse.json({ ok: false, error: "Missing hotelId" }, { status: 422 });

  // 1) Cache read (fresh ≤ 7 days).
  const db = getSupabaseAdmin();
  if (db) {
    try {
      const { data } = await db.from("hotel_ai_highlights").select("highlights, created_at").eq("hotel_id", hotelId).maybeSingle();
      if (data?.highlights && Array.isArray(data.highlights)) {
        const ageMs = Date.now() - Date.parse(String(data.created_at));
        if (ageMs < CACHE_DAYS * 864e5) {
          return NextResponse.json({ ok: true, source: "ai", highlights: data.highlights as Highlight[] });
        }
      }
    } catch {
      /* cache best-effort */
    }
  }

  // 2) Gather grounded facts.
  const facts = await hotelHighlightFacts(hotelId);
  if (!facts) return NextResponse.json({ ok: true, source: "fallback", highlights: [] });

  const fallback = fallbackHighlights(facts);

  // 3) Generate (AI), else deterministic fallback.
  const { aiObject, aiConfigured, AI_MODEL_FAST } = await import("@/lib/ai");
  let highlights: Highlight[] | null = null;
  if (aiConfigured) {
    const Schema = z.object({
      highlights: z
        .array(
          z.object({
            icon: z.enum(ICONS),
            title: z.string().max(48),
            blurb: z.string().max(160),
          }),
        )
        .max(4),
    });
    const out = await aiObject(Schema, {
      model: AI_MODEL_FAST,
      system:
        "You write hotel highlights FOR A MUSLIM TRAVELLER using ONLY the provided facts — never " +
        "invent facilities. Lead with prayer-room/halal-food/alcohol facts, then mosque & halal-dining " +
        "proximity, then general quality. NEVER claim the hotel is halal-certified; these are facilities " +
        "the property declares, to be confirmed with the hotel. Return up to 4 concise highlights. The " +
        `icon MUST be one of: ${ICONS.join(", ")}.`,
      prompt: `Hotel facts (JSON):\n${JSON.stringify(facts)}`,
    });
    if (out && out.highlights.length) highlights = out.highlights;
  }

  const final = highlights && highlights.length ? highlights : fallback;
  const source: "ai" | "fallback" = highlights && highlights.length ? "ai" : "fallback";

  // 4) Cache successful AI output (writes via service-role; best-effort).
  if (db && source === "ai" && final.length) {
    try {
      await db.from("hotel_ai_highlights").upsert({ hotel_id: hotelId, highlights: final, created_at: new Date().toISOString() }, { onConflict: "hotel_id" });
    } catch {
      /* cache write best-effort */
    }
  }

  return NextResponse.json({ ok: true, source, highlights: final });
}
