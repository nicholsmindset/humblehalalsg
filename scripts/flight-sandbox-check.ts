/* LiteAPI flight-booking sandbox harness.
 *
 *   Run:  npm run flight:check
 *
 * Proves the flight search → verify → prebook → book chain against the LiteAPI
 * SANDBOX, so we can confirm SDK-based flight booking (usePaymentSdk /
 * TRANSACTION_ID) works BEFORE flipping PAID_FLIGHTS_ENABLED in production.
 *
 * It is intentionally SELF-CONTAINED (direct fetch, no lib/liteapi import) so it
 * never pulls Next's `server-only` alias and runs under plain tsx. It reuses only
 * the PURE normalizer from lib/flights.ts to extract an offerId.
 *
 * The book step is attempted with the prebook's own transactionId. In sandbox
 * that may succeed (test mode) OR be rejected because a real card capture via the
 * browser Payment SDK is required — the harness reports exactly which, with the
 * LiteAPI error code. (Hotels already prove the SDK pay→book mechanism live, so
 * the open question is narrowly whether the FLIGHTS book endpoint accepts it.)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeItineraries } from "../lib/flights";

/* ── minimal .env loader (no dotenv dep): fills unset vars from .env.local/.env ── */
function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = join(process.cwd(), f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[k] === undefined) process.env[k] = v;
    }
  }
}
loadEnv();

const BASE = "https://api.liteapi.travel/v3.0";
const ENV = process.env.LITEAPI_ENV === "prod" ? "prod" : "sandbox";
const KEY =
  ENV === "prod"
    ? process.env.LITEAPI_PROD_KEY
    : process.env.LITEAPI_SAND_KEY || process.env.LITEAPI_PROD_KEY;

type Json = Record<string, unknown>;

async function api(path: string, body?: Json): Promise<{ status: number; json: Json }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: body ? "POST" : "GET",
      headers: { "X-API-Key": KEY as string, "Content-Type": "application/json", accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const json = (await res.json().catch(() => ({}))) as Json;
    return { status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

function future(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);
}

function line() {
  console.log("─".repeat(66));
}

async function main() {
  line();
  console.log(`LiteAPI flight sandbox check — env=${ENV}`);
  line();

  if (!KEY) {
    console.error("✗ No LiteAPI key. Set LITEAPI_SAND_KEY (and keep LITEAPI_ENV unset/sandbox) in .env.local.");
    process.exit(2);
  }
  if (ENV === "prod") {
    console.error("✗ LITEAPI_ENV=prod — refusing to run the booking chain against PRODUCTION. Unset it to use sandbox.");
    process.exit(2);
  }

  const origin = process.env.FLIGHT_CHECK_FROM || "SIN";
  const destination = process.env.FLIGHT_CHECK_TO || "JED";
  const date = process.env.FLIGHT_CHECK_DATE || future(30);

  // 1) SEARCH
  console.log(`1. search  ${origin}→${destination} ${date} · 1 adult · ECONOMY`);
  const search = await api("/flights/rates", {
    legs: [{ origin, destination, date }],
    adults: 1,
    cabin: "ECONOMY",
    currency: "USD",
  });
  const raw = Array.isArray(search.json.data) ? (search.json.data as unknown[]) : [];
  const itineraries = normalizeItineraries(raw);
  if (search.status !== 200 || itineraries.length === 0) {
    console.error(`   ✗ search returned ${search.status}, ${itineraries.length} itineraries.`);
    console.error(`   ${JSON.stringify(search.json).slice(0, 400)}`);
    console.log("\nVERDICT: FAIL (search) — flight SEARCH is not returning sandbox results for this route/date.");
    process.exit(1);
  }
  const offer = itineraries[0];
  console.log(`   ✓ ${itineraries.length} itineraries · using offer ${offer.offerId.slice(0, 24)}… (${offer.price ?? "?"} ${offer.currency ?? ""})`);

  // 2) VERIFY
  console.log("2. verify");
  const verify = await api("/flights/verify", { offerId: offer.offerId });
  if (verify.status !== 200) {
    console.error(`   ✗ verify returned ${verify.status}: ${JSON.stringify(verify.json).slice(0, 300)}`);
    console.log("\nVERDICT: FAIL (verify) — offer could not be re-priced.");
    process.exit(1);
  }
  const vTotal = (((verify.json.data as Json[])?.[0]?.journey as Json)?.pricing as Json)?.display as Json | undefined;
  console.log(`   ✓ verified · total ${vTotal?.total ?? "?"} ${vTotal?.currency ?? ""}`);

  // 3) PREBOOK (opens the payment intent — the SDK handles)
  console.log("3. prebook (usePaymentSdk: true)");
  const prebook = await api("/flights/prebooks", {
    offerId: offer.offerId,
    usePaymentSdk: true,
    contact: { firstName: "Test", lastName: "Traveller", email: "test@example.com", phoneNumber: "91234567", phoneCountryCode: "65" },
    passengers: [
      {
        firstName: "Test",
        lastName: "Traveller",
        birthday: "1990-01-01",
        passengerType: 0,
        documentType: "passport",
        documentNumber: "X1234567",
        documentIssueCountry: "SG",
        documentExpiry: future(900),
        gender: "M",
        nationality: "SG",
      },
    ],
  });
  const pb = (Array.isArray(prebook.json.data) ? (prebook.json.data as Json[])[0] : undefined) || undefined;
  const prebookId = pb?.prebookId as string | undefined;
  const transactionId = pb?.transactionId as string | undefined;
  const publishableKey = pb?.publishableKey as string | undefined;
  if (prebook.status !== 200 || !prebookId) {
    console.error(`   ✗ prebook returned ${prebook.status}: ${JSON.stringify(prebook.json).slice(0, 400)}`);
    console.log("\nVERDICT: FAIL (prebook) — flight PREBOOK is not available on this account/key.");
    process.exit(1);
  }
  console.log(`   ✓ prebookId ${String(prebookId).slice(0, 24)}…`);
  console.log(`     transactionId ${transactionId ? String(transactionId).slice(0, 24) + "…" : "(none)"}`);
  console.log(`     publishableKey ${publishableKey ? "present (SDK card form would mount)" : "(none — sandbox/test mode)"}`);

  if (!transactionId) {
    console.log("\nVERDICT: PARTIAL — search+verify+prebook OK, but prebook returned no transactionId.");
    console.log("The card-capture step happens in the browser Payment SDK. Complete one booking locally");
    console.log("via the real UI with the LiteAPI sandbox test card to confirm pay→book. (Hotels already");
    console.log("prove the SDK mechanism live in prod.)");
    process.exit(0);
  }

  // 4) BOOK (attempt with the prebook transactionId; sandbox may accept or require browser capture)
  console.log("4. book (payment.method = TRANSACTION_ID)");
  const book = await api("/flights/bookings", { prebookId, payment: { method: "TRANSACTION_ID", transactionId } });
  const bd = (Array.isArray(book.json.data) ? (book.json.data as Json[])[0] : undefined) as Json | undefined;
  const booking = (bd?.booking as Json) || undefined;
  const bStatus = booking?.status as string | undefined;
  const err = book.json.error as Json | undefined;

  if (book.status === 200 && booking && (bStatus === "CONFIRMED" || bStatus === "TICKETED")) {
    console.log(`   ✓ booking ${bStatus} · ref ${(booking.bookingRef as string) || "?"}`);
    console.log("\nVERDICT: PASS — full SDK flight booking confirmed in sandbox. The flights book endpoint");
    console.log("accepts TRANSACTION_ID. You're clear to enable flights once prod access is confirmed.");
    process.exit(0);
  }

  console.error(`   ✗ book returned ${book.status} · status=${bStatus ?? "—"} · error ${err?.code ?? "—"}: ${(err?.description as string) || (err?.message as string) || ""}`);
  console.log("\nVERDICT: PARTIAL — search+verify+prebook OK; book did not confirm with the prebook transactionId.");
  console.log("This is expected if sandbox requires a real card capture via the browser Payment SDK, OR if");
  console.log("flight booking isn't GA on this account. Next steps: (a) confirm with LiteAPI that production");
  console.log("flight booking + SDK/TRANSACTION_ID is enabled (see the email draft), and (b) complete one");
  console.log("booking locally via the real UI with the sandbox test card. The error code above is the tell.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Harness crashed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
