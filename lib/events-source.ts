/* Humble Halal — events data SEAM. Single seam between Supabase `events` and
   the app, mirroring lib/directory.ts. Returns the existing EventItem shape so
   every screen works unchanged. When Supabase is not configured OR there are no
   published rows, returns an EMPTY array (the events page renders a clean empty
   state — never fabricated events). Server-only.

   Structural columns live on `events`; the rich display fields (category, image,
   time/date labels, venue, organiser, blurb, tags, priceFrom, tiers) live in the
   `events.display` jsonb (migration 0014) and are merged here. */
import "server-only";
import { cache } from "react";
import type { EventItem, EventTier, GenderArrangement, LatLng } from "./types";
import { slugify } from "./slug";
import { supabaseConfigured, getSupabaseAdmin } from "./supabase/server";

/** Today's date (YYYY-MM-DD) in Singapore time — events are local to SG, the
 *  server runs UTC, so a plain `new Date().toISOString()` would flip the day
 *  up to 8 hours early. en-CA gives the ISO date format directly. */
export function todaySG(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date());
}

type Row = Record<string, unknown>;
const str = (v: unknown, d = "") => (v == null ? d : String(v));
const num = (v: unknown, d = 0) => (typeof v === "number" ? v : Number(v) || d);
const bool = (v: unknown) => v === true || v === "true";

/** Map a Supabase `events` row (+ display jsonb) → the app's EventItem shape. */
export function rowToEvent(r: Row): EventItem {
  const d = (r.display && typeof r.display === "object" ? r.display : {}) as Record<string, unknown>;
  const capacity = num(r.capacity);
  const taken = num(r.taken);
  const tiers = Array.isArray(d.tiers) ? (d.tiers as EventTier[]) : undefined;
  const coords =
    d.venueCoords && typeof d.venueCoords === "object"
      ? (d.venueCoords as LatLng)
      : undefined;
  const gender = ["mixed", "segregated", "sisters", "brothers"].includes(str(d.genderArrangement))
    ? (str(d.genderArrangement) as GenderArrangement)
    : undefined;
  return {
    id: str(r.id),
    slug: str(r.slug) || slugify(str(r.title)),
    title: str(r.title),
    catId: str(d.catId, "community"),
    cat: str(d.cat, "Community"),
    img: str(d.img),
    tone: str(d.tone, "emerald"),
    free: r.is_free === false ? false : true,
    priceFrom: num(d.priceFrom),
    tiers,
    dateLabel: str(d.dateLabel) || str(r.date_iso),
    timeLabel: str(d.timeLabel),
    dateISO: str(r.date_iso) || str(d.dateISO),
    endsAt: r.ends_at ? str(r.ends_at) : undefined,
    multiDay: d.multiDay ? str(d.multiDay) : undefined,
    venue: str(d.venue),
    area: str(d.area),
    capacity,
    taken,
    organiserId: r.business_id ? str(r.business_id) : null,
    organiser: str(d.organiser),
    organiserBiz: !!r.business_id,
    blurb: str(d.blurb),
    tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
    prayerNearby: bool(d.prayerNearby),
    halalCatering: bool(d.halalCatering),
    featured: bool(d.featured),
    attendees: num(d.attendees, taken),
    soldOut: capacity > 0 && taken >= capacity,
    endTime: d.endTime ? str(d.endTime) : undefined,
    venueCoords: coords,
    genderArrangement: gender,
    seatingNote: d.seatingNote ? str(d.seatingNote) : undefined,
    prayerSlotNote: d.prayerSlotNote ? str(d.prayerSlotNote) : undefined,
    donationEnabled: bool(d.donationEnabled),
    donationRaisedCents: d.donationRaisedCents != null ? num(d.donationRaisedCents) : undefined,
    refundPolicy: d.refundPolicy ? str(d.refundPolicy) : undefined,
    requiresApproval: bool(d.requiresApproval),
    feeMode: d.feeMode === "absorb" ? "absorb" : undefined,
  };
}

/** Published UPCOMING events from Supabase (an event stays listed through its
 *  own END day in Singapore time — ends_at, backfilled = date_iso for
 *  single-day events, so multi-day events no longer vanish after day one),
 *  or an empty array (clean empty state, never fabricated events) when
 *  Supabase is unconfigured or has no published rows. React-cache'd so
 *  layout + generateMetadata + page share one query per request. */
export const getEvents = cache(async (): Promise<EventItem[]> => {
  if (!supabaseConfigured) return [];
  const db = getSupabaseAdmin();
  if (!db) return [];
  try {
    const { data } = await db
      .from("events")
      .select("*")
      .eq("status", "published")
      .gte("ends_at", todaySG())
      .order("date_iso", { ascending: true });
    if (data && data.length) {
      // Never surface seed/demo events publicly (e.g. the "…(Demo)" iftar seeded
      // by /api/admin/seed-demo). Real events replace these before launch.
      const isDemo = (e: EventItem) => /\(demo\)|\bdemo\b/i.test(e.title) || /\bdemo\b/i.test(e.organiser || "");
      return data.map(rowToEvent).filter((e) => !isDemo(e));
    }
  } catch {
    /* fall back to empty */
  }
  return [];
});

/** Category + area of an event by slug (or id), IGNORING status + date — so a
 *  finished or cancelled /events/<slug> can resolve a relevant 301 target. Null
 *  when no such event ever existed → the route then 404s honestly. */
export async function getGoneEventMeta(slug: string): Promise<{ catId: string; area: string } | null> {
  if (!supabaseConfigured) return null;
  const db = getSupabaseAdmin();
  if (!db) return null;
  try {
    const { data } = await db.from("events").select("display").or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle();
    if (!data) return null;
    const d = (data.display && typeof data.display === "object" ? data.display : {}) as Record<string, unknown>;
    return { catId: str(d.catId, "community"), area: str(d.area) };
  } catch {
    return null;
  }
}
