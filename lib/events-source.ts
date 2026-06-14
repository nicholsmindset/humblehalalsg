/* Humble Halal — events data SEAM. Single seam between the mock seed
   (lib/events-data.ts) and Supabase `events`, mirroring lib/directory.ts.
   Returns the existing EventItem shape so every screen works unchanged. Falls
   back to the mock whenever Supabase is not configured OR there are no published
   rows (so the events page is never empty during early seeding). Server-only.

   Structural columns live on `events`; the rich display fields (category, image,
   time/date labels, venue, organiser, blurb, tags, priceFrom, tiers) live in the
   `events.display` jsonb (migration 0014) and are merged here. */
import "server-only";
import { events as mockEvents } from "./events-data";
import type { EventItem, EventTier } from "./types";
import { slugify } from "./slug";
import { supabaseConfigured, getSupabaseAdmin } from "./supabase/server";

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
  };
}

/** Published events from Supabase, or the mock seed as a graceful fallback. */
export async function getEvents(): Promise<EventItem[]> {
  if (!supabaseConfigured) return mockEvents;
  const db = getSupabaseAdmin();
  if (!db) return mockEvents;
  try {
    const { data } = await db
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("date_iso", { ascending: true });
    if (data && data.length) return data.map(rowToEvent);
  } catch {
    /* fall back to mock */
  }
  return mockEvents;
}
