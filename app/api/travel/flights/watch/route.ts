import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Create a fare alert — watch a route+date, get emailed when the price drops.
   Graceful: without Supabase it acknowledges (simulated). Upserts on
   (email, origin, destination, date) so re-watching just refreshes the baseline. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const origin = String(body.origin || "").trim().toUpperCase();
  const destination = String(body.destination || "").trim().toUpperCase();
  const date = String(body.date || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const currency = String(body.currency || "SGD").toUpperCase().slice(0, 3);
  const price = body.price != null ? Number(body.price) : null;

  if (origin.length < 3 || destination.length < 3 || !DATE.test(date)) return NextResponse.json({ ok: false, error: "Pick a route and date first" }, { status: 422 });
  if (!EMAIL.test(email)) return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 422 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, simulated: true });

  const { error } = await db.from("fare_watches").upsert(
    { email, origin, destination, depart_date: date, currency, last_price: price, active: true, last_checked_at: new Date().toISOString() },
    { onConflict: "email,origin,destination,depart_date" },
  );
  if (error) return NextResponse.json({ ok: false, error: "Could not save your alert" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
