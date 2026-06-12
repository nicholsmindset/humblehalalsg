import { NextResponse } from "next/server";

/* Shared API-route helpers. */

/** Backend not configured: accept gracefully in dev so flows are demoable,
    but fail honestly in production so missing env vars are surfaced. */
export function simulatedOr503(extra: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, simulated: true, ...extra });
}
