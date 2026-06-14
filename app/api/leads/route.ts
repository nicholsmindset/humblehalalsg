import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

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

  // Best-effort: also capture the email for follow-up (non-blocking).
  const mlKey = process.env.MAILERLITE_API_KEY;
  if (mlKey && email) {
    try {
      await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${mlKey}`,
        },
        body: JSON.stringify({ email, fields: { source: "lead", category } }),
      });
    } catch {
      /* ignore — lead is already stored */
    }
  }

  return NextResponse.json({ ok: true });
}
