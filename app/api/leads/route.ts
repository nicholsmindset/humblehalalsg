import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { leadConfirmationEmail } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/email";

/* Lead-gen "Request a quote" intake for high-ticket verticals
   (catering, weddings, umrah, Islamic finance, services).

   Persists to the `leads` table when Supabase is configured; otherwise
   accepts gracefully in "simulated" mode so the funnel works in dev.
   If a MailerLite key is set, the contact email is also captured. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadBody = {
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  area?: string;
  budget?: string;
  eventDate?: string;
  details?: string;
};

export async function POST(req: Request) {
  const rl = await rateLimit(req, "leads", 5, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let body: LeadBody = {};
  try {
    body = (await req.json()) as LeadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const category = String(body.category || "").trim();

  if (!name) {
    return NextResponse.json({ ok: false, error: "Please tell us your name" }, { status: 422 });
  }
  if (!email && !phone) {
    return NextResponse.json(
      { ok: false, error: "Add an email or phone so vendors can reach you" },
      { status: 422 },
    );
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email" }, { status: 422 });
  }

  const lead = {
    name,
    email: email || null,
    phone: phone || null,
    category: category || null,
    area: String(body.area || "").trim() || null,
    budget: String(body.budget || "").trim() || null,
    event_date: String(body.eventDate || "").trim() || null,
    details: String(body.details || "").trim() || null,
    status: "new",
  };

  // Persist to Supabase if configured; otherwise simulate so the UI works in dev.
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ ok: true, simulated: true });
  }

  try {
    const { error } = await db.from("leads").insert(lead);
    if (error) {
      return NextResponse.json({ ok: false, error: "Could not submit request" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not submit request" }, { status: 502 });
  }

  // Best-effort: confirmation email to the enquirer if they left one (non-blocking).
  if (email) {
    try {
      const t = leadConfirmationEmail({ name });
      await sendEmail({ to: email, subject: t.subject, html: t.html, template: "lead-confirmation" });
    } catch { /* email best-effort — never affect the API response */ }
  }

  // Best-effort: also capture the email in beehiiv for follow-up (non-blocking).
  const bhKey = process.env.BEEHIIV_API_KEY;
  const bhPub = process.env.BEEHIIV_PUBLICATION_ID;
  if (bhKey && bhPub && email) {
    try {
      await fetch(`https://api.beehiiv.com/v2/publications/${bhPub}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${bhKey}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: false,
          utm_source: "lead",
          custom_fields: [
            { name: "source", value: "lead" },
            ...(category ? [{ name: "category", value: String(category) }] : []),
          ],
        }),
      });
    } catch {
      /* ignore — lead is already stored */
    }
  }

  return NextResponse.json({ ok: true });
}
