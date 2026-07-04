import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/feature-flags";
import { liteapiConfigured, prebookFlight, LiteApiError } from "@/lib/liteapi";
import type { FlightContactInput, FlightPassengerInput } from "@/lib/liteapi-types";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Step 2 of flight booking — create the prebook (opens the Stripe payment
   intent) with contact + passenger details. Returns the SDK handles
   (transactionId/secretKey/publishableKey) + price. Gated + graceful. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const rl = await rateLimit(req, "flight-prebook", 12, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  if (!(await getServerFlags()).paidFlights) return NextResponse.json({ ok: false, reason: "flight_booking_disabled" }, { status: 403 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as { offerId?: string; contact?: FlightContactInput; passengers?: FlightPassengerInput[] };
  const offerId = String(body.offerId || "").trim();
  const contact = body.contact;
  const passengers = Array.isArray(body.passengers) ? body.passengers : [];
  if (!offerId) return NextResponse.json({ ok: false, error: "Missing offer" }, { status: 422 });
  if (!contact?.firstName || !contact?.lastName || !contact?.email || !EMAIL_RE.test(contact.email)) {
    return NextResponse.json({ ok: false, error: "Valid contact details are required" }, { status: 422 });
  }
  if (!passengers.length || passengers.some((p) => !p.firstName || !p.lastName || !p.birthday || !p.documentNumber)) {
    return NextResponse.json({ ok: false, error: "Complete passenger details (incl. passport) are required" }, { status: 422 });
  }
  if (passengers.length > 9) return NextResponse.json({ ok: false, error: "Too many passengers (max 9)" }, { status: 422 }); // L3

  try {
    const r = await prebookFlight(offerId, contact, passengers);
    if (!r || !r.prebookId) return NextResponse.json({ ok: false, error: "Fare no longer available — please search again" }, { status: 409 });
    return NextResponse.json({
      ok: true,
      prebookId: r.prebookId,
      transactionId: r.transactionId ?? null,
      secretKey: r.secretKey ?? null,
      publishableKey: r.publishableKey ?? null,
      price: r.price != null ? Number(r.price) : null,
      currency: r.currency ?? "USD",
      paymentTypes: r.paymentTypes ?? [],
      servicesAttachable: r.servicesAttachable ?? r.services ?? null,
      expiration: r.expiration ?? null,
    });
  } catch (e) {
    // Distinguish a client-fixable upstream failure (expired/invalid offer,
    // rejected passenger doc) from a genuine gateway/5xx. LiteApiError.detail is
    // the trimmed upstream body (no secrets) — logged + returned as `reason`.
    if (e instanceof LiteApiError) {
      const detail = (e.detail || "").slice(0, 500);
      console.error(`flight-prebook liteapi_${e.status}: ${detail}`);
      // LiteAPI returns `{error:{code,description,message}}` for validation
      // rejections. Parse it so the traveller gets an actionable message
      // instead of a generic gateway error.
      let code: number | undefined;
      let description = "";
      try {
        const j = JSON.parse(e.detail || "{}") as { error?: { code?: number; description?: string; message?: string } };
        code = Number(j.error?.code) || undefined;
        description = String(j.error?.description || j.error?.message || "");
      } catch { /* non-JSON upstream body */ }

      // Name looks like a placeholder/test value (LiteAPI fraud filter, code
      // 53099 — returned as a 500 but user-fixable). Ask for the real name.
      if (code === 53099 || /placeholder|test name/i.test(description)) {
        return NextResponse.json(
          { ok: false, error: "Please enter each traveller's real name exactly as it appears on their passport.", reason: "liteapi_53099", detail },
          { status: 422 },
        );
      }
      if (e.status >= 400 && e.status < 500) {
        // Most other 4xx here mean the held fare is stale — the user should re-search.
        return NextResponse.json(
          { ok: false, error: "Fare no longer available — please search again", reason: `liteapi_${e.status}`, detail },
          { status: 409 },
        );
      }
      return NextResponse.json({ ok: false, error: "Could not start the booking", reason: `liteapi_${e.status}`, detail }, { status: 502 });
    }
    return NextResponse.json({ ok: false, error: "Could not start the booking" }, { status: 502 });
  }
}
