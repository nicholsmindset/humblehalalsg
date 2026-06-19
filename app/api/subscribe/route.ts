import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* beehiiv email capture.
   Set BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID in env.
   Without a key it succeeds in "simulated" mode so the UI works in dev. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // Throttle to stop list-poisoning / signing a victim up repeatedly (M6).
  const rl = await rateLimit(req, "subscribe", 5, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let email = "";
  let source = "newsletter";
  let name = "";
  try {
    const body = await req.json();
    email = String(body?.email || "").trim();
    if (body?.source) source = String(body.source);
    if (body?.name) name = String(body.name).trim().slice(0, 80);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email" }, { status: 422 });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  // No key configured (e.g. local/dev) — accept gracefully without persisting.
  if (!apiKey || !publicationId) {
    return NextResponse.json({ ok: true, simulated: true });
  }

  const origin = req.headers.get("origin") || req.headers.get("referer") || undefined;

  const customFields: { name: string; value: string }[] = [{ name: "source", value: source }];
  if (name) customFields.push({ name: "first_name", value: name });

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: source,
          ...(origin ? { referring_site: origin } : {}),
          custom_fields: customFields,
        }),
      },
    );

    if (res.ok) {
      // beehiiv returns 201 for a freshly created subscription and 200 when the
      // email already existed (reactivated) — surface that to the UI as `already`.
      return NextResponse.json({ ok: true, ...(res.status === 200 ? { already: true } : {}) });
    }
    return NextResponse.json({ ok: false, error: "Subscription failed" }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "Subscription failed" }, { status: 502 });
  }
}
