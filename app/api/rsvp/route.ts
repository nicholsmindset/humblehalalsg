import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getEvent } from "@/lib/data";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { isSafeEventRef } from "@/lib/event-ref";
import { makeOrderRef, ticketRefs } from "@/lib/ticket-ref";
import { todaySG } from "@/lib/events-source";
import { sendEmail } from "@/lib/email";
import { rsvpConfirmationEmail } from "@/lib/emails/templates";

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

  // Capacity gate (capacity 0 = unlimited). Final race bounded by the atomic RPC.
  const capacity = Number(row.capacity) || 0;
  const taken = Number(row.taken) || 0;
  if (capacity > 0 && taken + qty > capacity) {
    const left = Math.max(0, capacity - taken);
    return NextResponse.json({ ok: false, reason: left > 0 ? "insufficient_capacity" : "sold_out", left }, { status: 409 });
  }

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
  if (error || !ord) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  // Issue QR tickets + decrement capacity atomically (fall back to read+write).
  // qr_refs derive from the emailed ref; on the (rare) unique collision of the
  // 6-char code, retry with a fresh ref so the insert always lands.
  let issuedRef = ref;
  for (let attempt = 0; attempt < 3; attempt++) {
    const tix = ticketRefs(issuedRef, qty).map((qr) => ({ order_id: ord.id, event_id: row.id, tier: "RSVP", qr_ref: qr }));
    const { error: tixErr } = await supa.from("tickets").insert(tix);
    if (!tixErr) break;
    if (tixErr.code !== "23505" || attempt === 2) {
      return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
    }
    issuedRef = makeOrderRef("RSVP");
  }
  const { error: incErr } = await supa.rpc("increment_event_taken", { p_event_id: row.id, p_qty: qty });
  if (incErr) await supa.from("events").update({ taken: taken + qty }).eq("id", row.id);

  // Confirmation email to the RSVP submitter (best-effort — never affects response).
  if (body.email) {
    try {
      const eventTitle = String((row as { title?: string }).title || mockEv?.title || "your event");
      const dateLabel = String((row as { date_iso?: string }).date_iso || mockEv?.dateLabel || "") || undefined;
      const venue = mockEv?.venue || undefined;
      const t = rsvpConfirmationEmail({ name: body.name, eventTitle, dateLabel, venue, ref: issuedRef });
      await sendEmail({ to: body.email, subject: t.subject, html: t.html, template: "rsvp-confirmation", businessId: (row.business_id as string | null) || undefined });
    } catch { /* email best-effort */ }
  }

  return NextResponse.json({ ok: true, ref: issuedRef });
}
