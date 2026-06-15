import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getEvent } from "@/lib/data";
import { rateLimit, tooMany } from "@/lib/ratelimit";

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
  const ref = "HH-RSVP-" + Math.floor(1000 + Math.random() * 9000);

  const supa = getSupabaseAdmin();
  if (!supa) {
    if (!mockEv) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, simulated: true, ref });
  }

  // Resolve the real DB event (by id or slug). If it isn't seeded yet, degrade
  // gracefully instead of failing on the orders.event_id FK.
  const { data: row } = await supa
    .from("events")
    .select("id, capacity, taken, business_id, status")
    .or(`id.eq.${eventId},slug.eq.${eventId}`)
    .maybeSingle();
  if (!row) {
    if (!mockEv) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, simulated: true, ref });
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
  const tix = Array.from({ length: qty }, () => ({ order_id: ord.id, event_id: row.id, tier: "RSVP", qr_ref: randomUUID() }));
  await supa.from("tickets").insert(tix);
  const { error: incErr } = await supa.rpc("increment_event_taken", { p_event_id: row.id, p_qty: qty });
  if (incErr) await supa.from("events").update({ taken: taken + qty }).eq("id", row.id);

  return NextResponse.json({ ok: true, ref });
}
