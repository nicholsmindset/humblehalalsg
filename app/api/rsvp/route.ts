import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getEvent } from "@/lib/data";
import { simulatedOr503 } from "@/lib/api";

/* Free RSVP — the launch path. DB-backed when Supabase is configured; otherwise
   returns simulated:true so the client keeps using the local mock ticket. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    eventId?: string;
    name?: string;
    email?: string;
    qty?: number;
  };
  const ev = getEvent(String(body.eventId || ""));
  if (!ev) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });
  if (body.email && !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ ok: false, reason: "bad_email" }, { status: 422 });
  }

  const supa = getSupabaseAdmin();
  if (!supa) return simulatedOr503();

  const qty = Math.max(1, Math.min(10, Number(body.qty) || 1));
  const ref = "HH-RSVP-" + Math.floor(1000 + Math.random() * 9000);
  // capacity check + insert order/tickets would run here against the DB.
  const { error } = await supa.from("orders").insert({
    event_id: ev.id,
    buyer_email: body.email ?? null,
    amount_cents: 0,
    fee_cents: 0,
    status: "confirmed",
  });
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true, ref });
}
