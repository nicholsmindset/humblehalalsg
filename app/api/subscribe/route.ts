import { after, NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { beehiivSubscribe } from "@/lib/beehiiv";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { newsletterSignupEmail } from "@/lib/emails/newsletter";

/* beehiiv newsletter capture.
   Set BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID in env.
   Missing configuration is simulated only outside production. */

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
    if (body?.source) source = String(body.source).trim().slice(0, 80);
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
    // Resend delivers the exact resource promised by the form below. Disable
    // Beehiiv's publication-wide welcome so subscribers do not get duplicates.
    sendWelcome: false,
    ...(origin ? { referringSite: origin } : {}),
  });

  const deliverResource = () => {
    const welcome = newsletterSignupEmail({ source, ...(name ? { name } : {}) });
    after(async () => {
      const sent = await sendEmail({
        to: email,
        subject: welcome.subject,
        html: welcome.html,
        template: welcome.template,
      });
      if (!sent.ok) console.error("[subscribe] resource delivery failed", { template: welcome.template });
    });
  };

  // A real provider success is final. If Beehiiv is absent or rejects the
  // request, durably queue it in our private database instead of pretending.
  if (r.ok && !r.simulated) {
    // Send on every explicit request: an existing subscriber may request a
    // different guide from another form later.
    deliverResource();
    return NextResponse.json({ ok: true, ...(r.already ? { already: true } : {}), ...(r.simulated ? { simulated: true } : {}) });
  }

  const db = getSupabaseAdmin();
  if (db) {
    const { error } = await db.from("newsletter_signups").upsert({
      email: email.toLowerCase(),
      source: source.slice(0, 100),
      name: name || null,
      stage: stage || null,
      referring_site: origin?.slice(0, 500) || null,
      provider_status: "queued",
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });
    if (!error) {
      deliverResource();
      return NextResponse.json({ ok: true, queued: true });
    }
    console.error("[subscribe] fallback queue failed", { code: error.code });
  }

  if (r.configured) {
    // Configured but beehiiv rejected — most often a bad API key / wrong publication
    // pairing (fails silently otherwise, like the platform_settings service-role bug).
    console.error("[subscribe] beehiiv rejected", { status: r.status, source });
  }
  return NextResponse.json({ ok: false, error: "Subscription service unavailable — please try again." }, { status: 502 });
}
