import { NextResponse } from "next/server";
import { mozioConfigured, pollReservation } from "@/lib/mozio";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Confirmation page polls this after the Mozio payment redirect (?searchId=).
   Reconciles the ledger pending→confirming→confirmed. Graceful without a key. */
function mapStatus(s: string): "pending" | "confirming" | "confirmed" | "cancelled" | "failed" {
  const v = s.toLowerCase();
  if (["confirmed", "completed", "success"].includes(v)) return "confirmed";
  if (["cancelled", "canceled"].includes(v)) return "cancelled";
  if (["failed", "error"].includes(v)) return "failed";
  if (["pending", "created"].includes(v)) return "pending";
  return "confirming";
}

export async function GET(req: Request) {
  const rl = await rateLimit(req, "transfer-status", 60, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const searchId = (new URL(req.url).searchParams.get("searchId") || "").trim();
  if (!searchId) return NextResponse.json({ ok: false, error: "missing searchId" }, { status: 422 });
  if (!mozioConfigured()) return NextResponse.json({ ok: true, simulated: true, status: "confirmed", confirmationNumber: "SIMULATED" });

  try {
    const res = await pollReservation(searchId);
    const status = mapStatus(res.status);
    const db = getSupabaseAdmin();
    if (db) {
      try {
        await db.from("transfer_bookings").update({
          status,
          mozio_reservation_id: res.reservationId ?? undefined,
          confirmation_number: res.confirmationNumber ?? undefined,
          updated_at: new Date().toISOString(),
          // Only advance still-open rows so a re-poll can't clobber a terminal state.
        }).eq("mozio_search_id", searchId).in("status", ["pending", "confirming"]);
      } catch { /* best-effort */ }
    }
    return NextResponse.json({ ok: true, status, confirmationNumber: res.confirmationNumber ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "status unavailable" }, { status: 502 });
  }
}
