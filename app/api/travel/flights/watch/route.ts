import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Create a fare alert — watch a route+date, get emailed when the price drops.
   Requires a signed-in user and ALWAYS uses the session email (never an arbitrary
   address from the body) so the alerts can't be used to email-bomb third parties.
   Upserts on (email, origin, destination, date). Graceful without Supabase. */
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const rl = await rateLimit(req, "fare-watch", 15, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const origin = String(body.origin || "").trim().toUpperCase();
  const destination = String(body.destination || "").trim().toUpperCase();
  const date = String(body.date || "").trim();
  const currency = String(body.currency || "SGD").toUpperCase().slice(0, 3);
  const price = body.price != null && Number.isFinite(Number(body.price)) ? Number(body.price) : null;
  if (origin.length < 3 || destination.length < 3 || !DATE.test(date)) return NextResponse.json({ ok: false, error: "Pick a route and date first" }, { status: 422 });

  const server = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!server || !admin) return NextResponse.json({ ok: true, simulated: true });

  const { data: { user } } = await server.auth.getUser();
  if (!user?.email) return NextResponse.json({ ok: false, error: "Please log in to track this price", needLogin: true }, { status: 401 });

  const { error } = await admin.from("fare_watches").upsert(
    { user_id: user.id, email: user.email.toLowerCase(), origin, destination, depart_date: date, currency, last_price: price, active: true, last_checked_at: new Date().toISOString() },
    { onConflict: "email,origin,destination,depart_date" },
  );
  if (error) return NextResponse.json({ ok: false, error: "Could not save your alert" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
