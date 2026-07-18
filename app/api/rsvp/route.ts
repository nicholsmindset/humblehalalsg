import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getEvent } from "@/lib/data";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { isSafeEventRef } from "@/lib/event-ref";
import { makeOrderRef, ticketRefs } from "@/lib/ticket-ref";
import { todaySG } from "@/lib/events-source";
import { auth } from "@clerk/nextjs/server";
import { sendEmail } from "@/lib/email";
import { rsvpConfirmationEmail } from "@/lib/emails/templates";
import { notify } from "@/lib/notify";

/* Free RSVP — the launch path. DB-backed when the event exists in Supabase;
   otherwise returns simulated:true so the client keeps the local mock ticket
   (never a 500 just because the event row isn't seeded yet). Capacity-safe:
   guards against overselling and increments atomically (increment_event_taken). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // Throttle anonymous RSVPs so the orders table can't be flooded (M6).
  const rl = await rateLimit(req, "rsvp", 10, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const body = (await req.json().catch(() => ({}))) as {
    eventId?: string;
    name?: string;
    email?: string;
    qty?: number;
  };
  const eventId = String(body.eventId || "");
  const mockEv = getEvent(eventId);
  if (body.email && !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ ok: false, reason: "bad_email" }, { status: 422 });
  }

  const qty = Math.max(1, Math.min(10, Number(body.qty) || 1));
  // The emailed reference IS the ticket qr_ref (lib/ticket-ref) — it used to be
  // a decorative random number stored nowhere, so door check-in never matched.
  const ref = makeOrderRef("RSVP");

  const supa = getSupabaseAdmin();
  if (!supa) {
    if (!mockEv) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, simulated: true, ref });
  }

  // Resolve the real DB event (by id or slug). If it isn't seeded yet, degrade
  // gracefully instead of failing on the orders.event_id FK. Reject unsafe refs
  // before interpolation (PostgREST .or() injection guard).
  const { data: row } = isSafeEventRef(eventId)
    ? await supa
        .from("events")
        .select("id, capacity, taken, business_id, status, title, date_iso")
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .maybeSingle()
    : { data: null };
  if (!row) {
    if (!mockEv) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, simulated: true, ref });
  }

  // Past events can't be RSVP'd (listing filters them out, but a direct POST or
  // stale tab could still hit this). Compared in Singapore time.
  if (row.date_iso && String(row.date_iso) < todaySG()) {
    return NextResponse.json({ ok: false, reason: "event_over" }, { status: 409 });
  }

  // Capacity gate (capacity 0 = unlimited). The read-check here is a cheap
  // early-out for UX; the authoritative, race-safe guard is the atomic
  // reserve_event_capacity RPC below.
  const capacity = Number(row.capacity) || 0;
  const taken = Number(row.taken) || 0;
  if (capacity > 0 && taken + qty > capacity) {
    const left = Math.max(0, capacity - taken);
    return NextResponse.json({ ok: false, reason: left > 0 ? "insufficient_capacity" : "sold_out", left }, { status: 409 });
  }

  // RESERVE seats atomically and capacity-aware BEFORE creating the order. The
  // old path incremented `taken` unconditionally (no capacity clause), so
  // concurrent free RSVPs could oversell a nearly-full event (the read-check
  // above is a TOCTOU on its own). reserve_event_capacity commits taken+=qty
  // only when it stays within capacity, in one statement (0061). Pre-0061
  // environments fall back to the unconditional counter.
  let reserved = false;
  const { data: gotSeats, error: resErr } = await supa.rpc("reserve_event_capacity", { p_event_id: row.id, p_qty: qty });
  if (resErr) {
    const { error: incErr } = await supa.rpc("increment_event_taken", { p_event_id: row.id, p_qty: qty });
    if (incErr) await supa.from("events").update({ taken: taken + qty }).eq("id", row.id);
    reserved = true;
  } else if (gotSeats !== true) {
    return NextResponse.json({ ok: false, reason: "sold_out", left: 0 }, { status: 409 });
  } else {
    reserved = true;
  }
  const releaseHold = async () => {
    if (!reserved) return;
    try { await supa.rpc("decrement_event_taken", { p_event_id: row.id, p_qty: qty }); } catch { /* clamped RPC */ }
  };

  const { data: ord, error } = await supa
    .from("orders")
    .insert({
      event_id: row.id,
      business_id: row.business_id ?? null,
      buyer_email: body.email ?? null,
      buyer_name: body.name ?? null,
      amount_cents: 0,
      fee_cents: 0,
      qty,
      status: "confirmed",
      payout_status: "none",
    })
    .select("id")
    .single();
  if (error || !ord) { await releaseHold(); return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 }); }

  // Issue QR tickets. qr_refs derive from the emailed ref; on the (rare) unique
  // collision of the 6-char code, retry with a fresh ref so the insert always
  // lands. Capacity is already reserved above; roll it (and the order) back if
  // tickets can't be issued.
  let issuedRef = ref;
  for (let attempt = 0; attempt < 3; attempt++) {
    const tix = ticketRefs(issuedRef, qty).map((qr) => ({ order_id: ord.id, event_id: row.id, tier: "RSVP", qr_ref: qr }));
    const { error: tixErr } = await supa.from("tickets").insert(tix);
    if (!tixErr) break;
    if (tixErr.code !== "23505" || attempt === 2) {
      await supa.from("orders").delete().eq("id", ord.id);
      await releaseHold();
      return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
    }
    issuedRef = makeOrderRef("RSVP");
  }

  // Confirmation email to the RSVP submitter (best-effort — never affects response).
  const eventTitle = String((row as { title?: string }).title || mockEv?.title || "your event");
  if (body.email) {
    try {
      const dateLabel = String((row as { date_iso?: string }).date_iso || mockEv?.dateLabel || "") || undefined;
      const venue = mockEv?.venue || undefined;
      const t = rsvpConfirmationEmail({ name: body.name, eventTitle, dateLabel, venue, ref: issuedRef });
      await sendEmail({ to: body.email, subject: t.subject, html: t.html, template: "rsvp-confirmation", businessId: (row.business_id as string | null) || undefined });
    } catch { /* email best-effort */ }
  }

  // In-app bell for signed-in attendees (guests have no Clerk sub to notify).
  try {
    const { userId } = await auth();
    if (userId) {
      await notify({
        userId,
        type: "rsvp_confirmed",
        title: "RSVP confirmed — you’re going!",
        body: `${eventTitle} · ${qty > 1 ? `${qty} spots` : "1 spot"} · ref ${issuedRef}`,
        link: "/dashboard?tab=tickets",
        dedupeKey: `rsvp:${ord.id}`,
      });
    }
  } catch { /* Clerk not configured — the bell is signed-in-only anyway */ }

  return NextResponse.json({ ok: true, ref: issuedRef });
}
