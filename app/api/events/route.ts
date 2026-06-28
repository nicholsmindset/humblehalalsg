import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

/* Create an event from the host wizard. Persists to `events` as status='pending'
   (an admin approves → 'published', after which the events data-seam surfaces it).
   Rich display fields go in events.display (migration 0014); structural fields are
   columns. Requires an authenticated user; links the event to their business when
   they have one (needed later for Connect ticket payouts). Degrades gracefully
   when Supabase/auth isn't configured so the demo wizard still completes. */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  let b: {
    title?: string; catId?: string; catLabel?: string; desc?: string; dateISO?: string;
    dateLabel?: string; timeLabel?: string; endTime?: string; venue?: string; area?: string;
    free?: boolean; price?: number; capacity?: number; tiers?: { name: string; price: number; perks?: string }[];
    prayerNearby?: boolean; halalCatering?: boolean; prayerSlotNote?: string;
    genderArrangement?: string; seatingNote?: string; refundPolicy?: string;
    donationEnabled?: boolean; requiresApproval?: boolean; venueCoords?: { lat: number; lng: number }; coverUrl?: string;
  };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }

  const title = String(b.title || "").trim();
  if (!title) return NextResponse.json({ ok: false, reason: "title_required" }, { status: 422 });

  // Link to the host's business (for organiser payouts on paid events).
  const { data: biz } = await admin.from("businesses").select("id, name").eq("owner_id", userId).maybeSingle();

  const free = b.free !== false;
  const priceFrom = free ? 0 : Math.max(0, Number(b.price) || 0);
  const tiers = !free
    ? (Array.isArray(b.tiers) && b.tiers.length ? b.tiers : [{ name: "Standard", price: priceFrom }])
    : undefined;

  const gender = ["mixed", "segregated", "sisters", "brothers"].includes(String(b.genderArrangement || ""))
    ? String(b.genderArrangement)
    : undefined;
  const coords =
    b.venueCoords && typeof b.venueCoords.lat === "number" && typeof b.venueCoords.lng === "number"
      ? { lat: b.venueCoords.lat, lng: b.venueCoords.lng }
      : undefined;

  const display = {
    catId: b.catId || "community",
    cat: b.catLabel || "Community",
    blurb: String(b.desc || ""),
    venue: String(b.venue || ""),
    area: String(b.area || ""),
    dateLabel: String(b.dateLabel || b.dateISO || ""),
    timeLabel: String(b.timeLabel || ""),
    endTime: b.endTime ? String(b.endTime) : undefined,
    priceFrom,
    tiers,
    organiser: (biz?.name as string) || "",
    tone: "emerald",
    img: typeof b.coverUrl === "string" && /^https?:\/\//.test(b.coverUrl) ? b.coverUrl : "",
    // Islamic / Muslim-first fields (host-controlled)
    prayerNearby: b.prayerNearby === true,
    halalCatering: b.halalCatering === true,
    prayerSlotNote: b.prayerSlotNote ? String(b.prayerSlotNote).slice(0, 200) : undefined,
    genderArrangement: gender,
    seatingNote: b.seatingNote ? String(b.seatingNote).slice(0, 200) : undefined,
    refundPolicy: b.refundPolicy ? String(b.refundPolicy).slice(0, 200) : undefined,
    donationEnabled: b.catId === "charity" && b.donationEnabled === true,
    requiresApproval: b.requiresApproval === true,
    venueCoords: coords,
  };

  const id = `evt_${randomUUID().slice(0, 12)}`;
  const slug = `${slugify(title)}-${randomUUID().slice(0, 4)}`;

  const { error } = await admin.from("events").insert({
    id,
    business_id: biz?.id ?? null,
    slug,
    title,
    is_free: free,
    capacity: Math.max(0, Number(b.capacity) || 0),
    taken: 0,
    status: "pending", // admin approves → published
    date_iso: b.dateISO || null,
    submitted_by: userId,
    source: "owner",
    display,
  });
  if (error) return NextResponse.json({ ok: false, reason: "insert_failed" }, { status: 500 });

  // Hosting an event makes the user an organiser → grant the owner role so the
  // dashboard + nav recognise them (no-op for admins). Best-effort.
  try { await admin.from("profiles").update({ role: "owner" }).eq("id", userId).neq("role", "admin"); } catch { /* role bump best-effort */ }

  // Persist paid tiers to ticket_tiers too (source of truth for pricing/capacity).
  if (tiers) {
    try {
      await admin.from("ticket_tiers").insert(tiers.map((t) => ({
        event_id: id, name: t.name, price_cents: Math.round((Number(t.price) || 0) * 100), qty: Math.max(0, Number(b.capacity) || 0), sold: 0,
      })));
    } catch { /* tiers best-effort */ }
  }

  return NextResponse.json({ ok: true, id, slug, status: "pending" });
}
