import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { liteapiConfigured, prebook } from "@/lib/liteapi";

/* Step 1 of booking — confirm price/availability before payment. Gated by the
   PAID_HOTELS_ENABLED kill-switch (off in Phase 1) and graceful without a key. */
export async function POST(req: Request) {
  if (!getServerFlags().paidHotels) {
    return NextResponse.json({ ok: false, reason: "hotel_booking_disabled" }, { status: 403 });
  }
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as { offerId?: string };
  const offerId = String(body.offerId || "").trim();
  if (!offerId) return NextResponse.json({ ok: false, error: "Missing offerId" }, { status: 422 });

  try {
    const r = await prebook(offerId, true);
    if (!r.prebookId) return NextResponse.json({ ok: false, error: "Rate no longer available" }, { status: 409 });
    return NextResponse.json({ ok: true, prebookId: r.prebookId, transactionId: r.transactionId });
  } catch {
    return NextResponse.json({ ok: false, error: "Prebook failed" }, { status: 502 });
  }
}
