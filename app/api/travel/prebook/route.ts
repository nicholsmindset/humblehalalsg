import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/feature-flags";
import { liteapiConfigured, prebook } from "@/lib/liteapi";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Step 1 of booking — confirm price/availability and open a payment intent.
   Returns the pricing + the LiteAPI Payment SDK handles (transactionId +
   secretKey/clientSecret) so the client can render the card form. Gated by the
   PAID_HOTELS_ENABLED kill-switch and graceful without a key. */
export async function POST(req: Request) {
  if (!(await getServerFlags()).paidHotels) {
    return NextResponse.json({ ok: false, reason: "hotel_booking_disabled" }, { status: 403 });
  }
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });
  // Throttle the paid LiteAPI /rates/prebook call per IP (mirrors /book at 10/600).
  const rl = await rateLimit(req, "hotel-prebook", 20, 60); if (!rl.ok) return tooMany(rl.retryAfter);

  const body = (await req.json().catch(() => ({}))) as {
    offerId?: string;
    voucherCode?: string;
    addons?: unknown[];
    bedTypeIds?: (string | number)[];
  };
  const offerId = String(body.offerId || "").trim();
  if (!offerId) return NextResponse.json({ ok: false, error: "Missing offerId" }, { status: 422 });
  // Sanitize the promo code the same way as the validate route (uppercase, ≤32).
  const voucherCode = String(body.voucherCode || "").trim().toUpperCase().slice(0, 32) || undefined;

  try {
    const r = (await prebook(offerId, true, {
      voucherCode,
      addons: Array.isArray(body.addons) ? body.addons : undefined,
      bedTypeIds: Array.isArray(body.bedTypeIds) ? body.bedTypeIds : undefined,
    })) as Record<string, unknown>;
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
      // Discount applied by the voucher (LiteAPI echoes it on the prebook), plus the
      // code itself so the client can show "promo applied" and the ledger can record it.
      discount: r.discount != null ? Number(r.discount) : null,
      voucherCode: voucherCode && r.prebookId ? voucherCode : null,
      hotelId: r.hotelId ?? null,
      checkin: r.checkin ?? null,
      checkout: r.checkout ?? null,
      paymentTypes: r.paymentTypes ?? [],
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Prebook failed" }, { status: 502 });
  }
}
