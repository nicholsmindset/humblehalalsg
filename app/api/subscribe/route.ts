import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { beehiivSubscribe } from "@/lib/beehiiv";

/* beehiiv newsletter capture.
   Set BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID in env.
   Without a key it succeeds in "simulated" mode so the UI works in dev. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // Throttle to stop list-poisoning / signing a victim up repeatedly (M6).
  const rl = await rateLimit(req, "subscribe", 5, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let email = "";
  let source = "newsletter";
  let name = "";
  let stage = "";
  try {
    const body = await req.json();
    email = String(body?.email || "").trim();
    if (body?.source) source = String(body.source);
    if (body?.name) name = String(body.name).trim().slice(0, 80);
    // Optional owner-funnel lifecycle stage: lead | listed | claimed.
    if (body?.stage) stage = String(body.stage).trim().slice(0, 40);
    // Bot gate — fail-OPEN (a Cloudflare blip must never eat a newsletter signup).
    if (!(await verifyTurnstile(body?.turnstileToken, null, { failOpen: true }))) {
      return NextResponse.json({ ok: false, error: "captcha" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email" }, { status: 422 });
  }

  const origin = req.headers.get("origin") || req.headers.get("referer") || undefined;

  const r = await beehiivSubscribe({
    email,
    source,
    ...(stage ? { stage } : {}),
    ...(name ? { name } : {}),
    sendWelcome: true,
    ...(origin ? { referringSite: origin } : {}),
  });

  // simulated (no key) or a real success → OK; surface `already` for existing emails.
  if (r.ok) {
    return NextResponse.json({ ok: true, ...(r.already ? { already: true } : {}), ...(r.simulated ? { simulated: true } : {}) });
  }
  if (r.configured) {
    // Configured but beehiiv rejected — most often a bad API key / wrong publication
    // pairing (fails silently otherwise, like the platform_settings service-role bug).
    console.error("[subscribe] beehiiv rejected", { status: r.status, source });
  }
  return NextResponse.json({ ok: false, error: "Subscription service unavailable — please try again." }, { status: 502 });
}
