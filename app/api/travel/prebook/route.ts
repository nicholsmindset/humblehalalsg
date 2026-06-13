import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { liteapiConfigured, prebook } from "@/lib/liteapi";

/* Step 1 of booking — confirm price/availability and open a payment intent.
   Returns the pricing + the LiteAPI Payment SDK handles (transactionId +
   secretKey/clientSecret) so the client can render the card form. Gated by the
   PAID_HOTELS_ENABLED kill-switch and graceful without a key. */
export async function POST(req: Request) {
  if (!getServerFlags().paidHotels) {
    return NextResponse.json({ ok: false, reason: "hotel_booking_disabled" }, { status: 403 });
  }
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as { offerId?: string };
  const offerId = String(body.offerId || "").trim();
  if (!offerId) return NextResponse.json({ ok: false, error: "Missing offerId" }, { status: 422 });

  try {
    const r = (await prebook(offerId, true)) as Record<string, unknown>;
    const prebookId = r.prebookId as string | undefined;
    if (!prebookId) return NextResponse.json({ ok: false, error: "Rate no longer available" }, { status: 409 });
    return NextResponse.json({
      ok: true,
      prebookId,
      transactionId: r.transactionId ?? null,
      secretKey: r.secretKey ?? null, // Stripe client secret for the Payment SDK
      currency: r.currency ?? "USD",
      price: r.price != null ? Number(r.price) : null,
      sellingPrice: r.sellingPriceToUser != null ? Number(r.sellingPriceToUser) : null,
      commission: r.commission != null ? Number(r.commission) : null,
      hotelId: r.hotelId ?? null,
      checkin: r.checkin ?? null,
      checkout: r.checkout ?? null,
      paymentTypes: r.paymentTypes ?? [],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Prebook failed" }, { status: 502 });
  }
}
