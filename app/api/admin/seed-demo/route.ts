import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { listings } from "@/lib/data";
import { events as seedEvents } from "@/lib/events-data";

/* One-shot demo seed (idempotent upserts) for testing the events stack without
   an admin login. Guarded by CRON_SECRET — call with:
     curl -X POST -H "Authorization: Bearer $CRON_SECRET" .../api/admin/seed-demo
   Seeds the directory `businesses` + the mock `events` (published), linking each
   event to its organiser business where possible. Safe to re-run. */
export async function POST(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  // 1) Businesses (upsert by slug).
  const tier = (badges: string[]) => (badges.includes("muis") ? "muis" : badges.includes("admin") ? "admin" : badges.includes("owned") ? "owned" : "friendly");
  const bizRows = listings.map((l) => ({
    slug: l.slug || l.id,
    name: l.name,
    area: l.area,
    cat_id: l.catId,
    price_level: l.price,
    description: l.blurb,
    featured: l.featured,
    status: "published",
    halal_tier: tier(l.badges),
    lat: l.coords?.lat ?? null,
    lng: l.coords?.lng ?? null,
    source: "seed",
  }));
  const { error: bizErr } = await sb.from("businesses").upsert(bizRows, { onConflict: "slug" });
  if (bizErr) return NextResponse.json({ ok: false, step: "businesses", error: bizErr.message }, { status: 500 });

  // Map mock organiser (listing id) → seeded business id (via slug).
  const { data: seeded } = await sb.from("businesses").select("id, slug");
  const slugToId = new Map((seeded || []).map((b) => [b.slug as string, b.id as string]));
  const listingIdToSlug = new Map(listings.map((l) => [l.id, l.slug || l.id]));

  // 2) Events (upsert by id, published, rich display jsonb).
  const evRows = seedEvents.map((e) => {
    const orgSlug = e.organiserId ? listingIdToSlug.get(e.organiserId) : undefined;
    const businessId = orgSlug ? slugToId.get(orgSlug) ?? null : null;
    return {
      id: e.id,
      slug: e.slug || e.id,
      title: e.title,
      business_id: businessId,
      is_free: e.free,
      capacity: e.capacity,
      taken: e.taken,
      status: "published",
      date_iso: e.dateISO || null,
      source: "seed",
      display: {
        catId: e.catId, cat: e.cat, img: e.img, tone: e.tone, blurb: e.blurb,
        venue: e.venue, area: e.area, dateLabel: e.dateLabel, timeLabel: e.timeLabel,
        endTime: e.endTime, priceFrom: e.priceFrom, tiers: e.tiers, organiser: e.organiser,
        tags: e.tags, prayerNearby: e.prayerNearby, halalCatering: e.halalCatering,
        featured: e.featured, attendees: e.attendees,
        genderArrangement: e.genderArrangement, seatingNote: e.seatingNote,
        prayerSlotNote: e.prayerSlotNote, donationEnabled: e.donationEnabled,
        refundPolicy: e.refundPolicy, venueCoords: e.venueCoords,
      },
    };
  });
  const { error: evErr } = await sb.from("events").upsert(evRows, { onConflict: "id" });
  if (evErr) return NextResponse.json({ ok: false, step: "events", error: evErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, businesses: bizRows.length, events: evRows.length });
}
