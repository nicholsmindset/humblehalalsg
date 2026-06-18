import { NextResponse } from "next/server";
import { mozioConfigured, cancelReservation } from "@/lib/mozio";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Cancel a transfer reservation. Owner/admin only (RLS protects reads; this
   write uses the service role after an ownership check). Graceful without a key. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "transfer-cancel", 12, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "").trim();              // transfer_bookings.id
  const reservationId = String(body.reservationId || "").trim();
  if (!id || !reservationId) return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 422 });

  let userId: string | null = null;
  try { const server = await getSupabaseServer(); if (server) userId = (await server.auth.getUser()).data.user?.id ?? null; } catch { /* */ }
  if (!userId) return NextResponse.json({ ok: false, error: "Sign in to cancel" }, { status: 401 });

  // No service role = we cannot verify ownership, so we must NOT cancel at the
  // provider. Fail safe rather than let a signed-in user cancel any reservation id.
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 });
  const { data: row } = await db.from("transfer_bookings").select("id,user_id").eq("id", id).single();
  if (!row || row.user_id !== userId) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (!mozioConfigured()) return NextResponse.json({ ok: true, status: "cancelled", simulated: true });

  try {
    const res = await cancelReservation(reservationId);
    try { await db.from("transfer_bookings").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id); } catch { /* ledger best-effort */ }
    return NextResponse.json({ ok: true, status: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not cancel right now" }, { status: 502 });
  }
}
