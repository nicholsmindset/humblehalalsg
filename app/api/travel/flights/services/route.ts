import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { liteapiConfigured, attachFlightServices } from "@/lib/liteapi";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Step 2 of flight booking — attach seats/bags to a prebook. LiteAPI returns a
   NEW payment intent (transactionId) reflecting the updated total; the client
   must use the latest. Gated + graceful. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "flight-services", 24, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  if (!getServerFlags().paidFlights) return NextResponse.json({ ok: false, reason: "flight_booking_disabled" }, { status: 403 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as { prebookId?: string; selectedServices?: unknown[]; voucherCode?: string };
  const prebookId = String(body.prebookId || "").trim();
  const selectedServices = Array.isArray(body.selectedServices) ? body.selectedServices : [];
  if (!prebookId) return NextResponse.json({ ok: false, error: "Missing prebook" }, { status: 422 });

  try {
    const r = await attachFlightServices(prebookId, selectedServices, body.voucherCode);
    if (!r) return NextResponse.json({ ok: false, error: "Could not update your selection" }, { status: 502 });
    return NextResponse.json({
      ok: true,
      transactionId: r.transactionId ?? null,
      secretKey: r.secretKey ?? null,
      price: r.price != null ? Number(r.price) : null,
      currency: r.currency ?? "USD",
      services: r.services ?? r.selectedServices ?? null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not update your selection" }, { status: 502 });
  }
}
