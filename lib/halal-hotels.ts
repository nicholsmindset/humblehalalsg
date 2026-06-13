/* Humble Halal — Muslim-friendly overlay for LiteAPI hotels.
   LiteAPI has NO native halal filter, so we derive FACTUAL descriptive flags
   from the hotel's own facilities/description (keyword map) and compute a
   PROVISIONAL score. This is `verified_by: 'auto'` = "unverified" until an
   admin/ustaz confirms. We never assert "halal certified" automatically and we
   never scrape/mirror any register (golden rule, see lib/muis.ts + AGENTS.md). */
import type { LiteApiHotelContent, LiteApiRatesHotel } from "./liteapi-types";

export interface HotelFlags {
  has_prayer_room: boolean;
  halal_food_onsite: boolean;
  halal_food_nearby: boolean;
  alcohol_free: boolean;
  women_only_facilities: boolean;
  qibla_direction: boolean;
  prayer_mat_available: boolean;
  near_mosque: boolean;
}

export const EMPTY_FLAGS: HotelFlags = {
  has_prayer_room: false,
  halal_food_onsite: false,
  halal_food_nearby: false,
  alcohol_free: false,
  women_only_facilities: false,
  qibla_direction: false,
  prayer_mat_available: false,
  near_mosque: false,
};

const RX = {
  prayer_room: /prayer\s*room|mushol?la|mosalla|prayer\s*area|prayer\s*hall/i,
  halal: /\bhalal\b/i,
  alcohol_free: /no\s*alcohol|alcohol[-\s]?free|non[-\s]?alcoholic\s*only|dry\s*hotel/i,
  women_only: /women[-\s]?only|female[-\s]?only|ladies[-\s]?only|women['’]?s\s*floor/i,
  qibla: /qibla|qiblah|qiblah?\s*direction/i,
  prayer_mat: /prayer\s*mat|prayer\s*rug|sajadah/i,
  mosque: /\bmosque\b|\bmasjid\b/i,
};

/** Keyword-map a hotel's facilities + description to factual flags. */
export function deriveHotelFlags(facilities: string[], description = ""): HotelFlags {
  const hay = `${facilities.join(" \n ")} \n ${description}`;
  return {
    has_prayer_room: RX.prayer_room.test(hay),
    halal_food_onsite: facilities.some((f) => RX.halal.test(f)),
    halal_food_nearby: RX.halal.test(description) && !facilities.some((f) => RX.halal.test(f)),
    alcohol_free: RX.alcohol_free.test(hay),
    women_only_facilities: RX.women_only.test(hay),
    qibla_direction: RX.qibla.test(hay),
    prayer_mat_available: RX.prayer_mat.test(hay),
    near_mosque: RX.mosque.test(description),
  };
}

const POINTS: Record<keyof HotelFlags, number> = {
  halal_food_onsite: 22,
  has_prayer_room: 16,
  alcohol_free: 15,
  halal_food_nearby: 9,
  near_mosque: 8,
  women_only_facilities: 8,
  qibla_direction: 6,
  prayer_mat_available: 4,
};

/** Provisional 0–100 Muslim-friendly score from derived flags (base 28). */
export function hotelHalalScore(flags: HotelFlags): number {
  let s = 28;
  for (const k of Object.keys(POINTS) as (keyof HotelFlags)[]) if (flags[k]) s += POINTS[k];
  return Math.max(0, Math.min(100, Math.round(s)));
}

export type VerifiedBy = "auto" | "community" | "ustaz";

/** A Supabase `muslim_friendly_hotels` row (overlay). */
export interface OverlayRow extends Partial<HotelFlags> {
  liteapi_hotel_id: string;
  near_mosque_m?: number | null;
  halal_score?: number | null;
  verified_by?: VerifiedBy | null;
  source_notes?: string | null;
}

/** Normalized hotel for our UI (LiteAPI shape + overlay merged in). */
export interface Hotel {
  id: string;
  name: string;
  image?: string;
  address?: string;
  city?: string;
  country?: string;
  coords?: { lat: number; lng: number };
  stars?: number; // facility stars (1–5)
  guestRating?: number; // review score (0–10)
  reviewCount?: number;
  description?: string;
  flags: HotelFlags;
  halalScore: number;
  verified: boolean; // human-verified overlay
  verifiedBy: VerifiedBy;
  priceFrom?: { amount: number; currency: string };
}

function flagsFromOverlay(o: OverlayRow): HotelFlags {
  return {
    has_prayer_room: !!o.has_prayer_room,
    halal_food_onsite: !!o.halal_food_onsite,
    halal_food_nearby: !!o.halal_food_nearby,
    alcohol_free: !!o.alcohol_free,
    women_only_facilities: !!o.women_only_facilities,
    qibla_direction: !!o.qibla_direction,
    prayer_mat_available: !!o.prayer_mat_available,
    near_mosque: (o.near_mosque_m ?? 0) > 0 || !!o.near_mosque,
  };
}

/** Build a Hotel from LiteAPI static content, merging a human overlay if present. */
export function hotelFromContent(c: LiteApiHotelContent, overlay?: OverlayRow): Hotel {
  const facilities = [
    ...(c.hotelFacilities ?? []),
    ...((c.facilities ?? []).map((f) => f?.name).filter(Boolean) as string[]),
  ];
  const desc = stripHtml(c.hotelDescription);
  const autoFlags = deriveHotelFlags(facilities, desc);
  const flags = overlay ? flagsFromOverlay(overlay) : autoFlags;
  const verifiedBy: VerifiedBy = (overlay?.verified_by as VerifiedBy) || "auto";
  return {
    id: c.id,
    name: c.name ?? "Hotel",
    image: c.main_photo || c.hotelImages?.[0]?.url,
    address: c.address,
    city: c.city,
    country: c.country || c.countryCode,
    coords:
      c.location?.latitude != null && c.location?.longitude != null
        ? { lat: c.location.latitude, lng: c.location.longitude }
        : undefined,
    stars: c.starRating,
    guestRating: c.rating,
    reviewCount: c.reviewCount,
    description: desc,
    flags,
    halalScore: overlay?.halal_score ?? hotelHalalScore(flags),
    verified: verifiedBy !== "auto",
    verifiedBy,
  };
}

/** Build a Hotel from a /hotels/rates search hit, merging a human overlay. */
export function hotelFromRates(h: LiteApiRatesHotel, overlay?: OverlayRow): Hotel {
  const autoFlags = overlay ? flagsFromOverlay(overlay) : EMPTY_FLAGS; // search hits carry no facilities
  const verifiedBy: VerifiedBy = (overlay?.verified_by as VerifiedBy) || "auto";
  const first = h.roomTypes?.[0]?.rates?.[0]?.retailRate?.total?.[0];
  return {
    id: h.id,
    name: h.name ?? "Hotel",
    image: h.main_photo || h.thumbnail,
    address: h.address,
    city: h.city_name,
    country: h.country_code,
    stars: h.stars,
    guestRating: h.rating,
    reviewCount: h.review_count,
    flags: autoFlags,
    halalScore: overlay?.halal_score ?? hotelHalalScore(autoFlags),
    verified: verifiedBy !== "auto",
    verifiedBy,
    priceFrom:
      first?.amount != null ? { amount: Number(first.amount), currency: String(first.currency || "USD") } : undefined,
  };
}

/** A bookable rate flattened for the UI rates table. */
export interface RateOffer {
  offerId: string;
  name: string;
  price?: number;
  currency?: string;
  refundable: boolean;
}

/** Flatten a /hotels/rates hit's roomTypes→rates into UI offers. */
export function offersFromRatesHotel(h: LiteApiRatesHotel): RateOffer[] {
  const out: RateOffer[] = [];
  for (const rt of h.roomTypes ?? []) {
    for (const r of rt.rates ?? []) {
      const t = r.retailRate?.total?.[0];
      const offerId = String(r.offerId || rt.offerId || "");
      if (!offerId) continue;
      out.push({
        offerId,
        name: String(r.name || "Room"),
        price: t?.amount != null ? Number(t.amount) : undefined,
        currency: t?.currency ? String(t.currency) : undefined,
        refundable: String(r.refundableTag || "") === "RFN",
      });
    }
  }
  return out;
}

/** Human-readable labels for active flags (UI badges). */
export const FLAG_LABELS: Record<keyof HotelFlags, string> = {
  halal_food_onsite: "Halal food on-site",
  has_prayer_room: "Prayer room",
  alcohol_free: "Alcohol-free",
  halal_food_nearby: "Halal food nearby",
  near_mosque: "Near a mosque",
  women_only_facilities: "Women-only facilities",
  qibla_direction: "Qibla direction",
  prayer_mat_available: "Prayer mats",
};

export function activeFlagLabels(flags: HotelFlags): string[] {
  return (Object.keys(FLAG_LABELS) as (keyof HotelFlags)[]).filter((k) => flags[k]).map((k) => FLAG_LABELS[k]);
}

function stripHtml(s?: string): string {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
