import { NextResponse, after } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { leadConfirmationEmail } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/email";
import { beehiivSubscribe } from "@/lib/beehiiv";
import { verticalIdFromLabel, LEAD_CONSENT_VERSION } from "@/lib/lead-verticals";
import { getServerFlags } from "@/lib/feature-flags";
import { autoRouteLead, advanceLeadCascade } from "@/lib/lead-routing";

/* Lead-gen "Request a quote" intake for high-ticket verticals
   (catering, weddings, umrah, Islamic finance, services).

   Persists to the `leads` table when Supabase is configured; otherwise
   accepts gracefully in "simulated" mode so the funnel works in dev.
   If a MailerLite key is set, the contact email is also captured. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

type LeadBody = {
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  area?: string;
  budget?: string;
  eventDate?: string;
  details?: string;
  businessSlug?: string;
  sourcePath?: string;
  consent?: boolean;
  consentVersion?: string;
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

  // Marketplace context (migration 0046): consent + source attribution + vertical.
  // Only routed to vendors when consent was explicitly given on the form.
  const rawSlug = String(body.businessSlug || "").trim();
  let sourceListingSlug: string | null = null;
  if (rawSlug && SLUG_RE.test(rawSlug)) {
    const { data: biz } = await db
      .from("businesses").select("slug").eq("slug", rawSlug).eq("status", "published").maybeSingle();
    if (biz) sourceListingSlug = biz.slug;
  }
  const marketplace = {
    vertical_id: verticalIdFromLabel(category),
    source_listing_slug: sourceListingSlug,
    source_path: String(body.sourcePath || "").trim().slice(0, 200) || null,
    consent_contact: body.consent === true,
    consent_version: body.consent === true ? String(body.consentVersion || LEAD_CONSENT_VERSION).slice(0, 40) : null,
    consented_at: body.consent === true ? new Date().toISOString() : null,
  };

  let leadId: string | null = null;
  try {
    let ins = await db.from("leads").insert({ ...lead, ...marketplace }).select("id").maybeSingle();
    // Never drop a lead because the 0046 columns aren't live yet — fall back
    // to the legacy shape if the insert failed on a missing column.
    if (ins.error && /column|schema cache/i.test(ins.error.message || "")) {
      ins = await db.from("leads").insert(lead).select("id").maybeSingle();
    }
    if (ins.error) {
      return NextResponse.json({ ok: false, error: "Could not submit request" }, { status: 502 });
    }
    leadId = (ins.data?.id as string) ?? null;
  } catch {
    return NextResponse.json({ ok: false, error: "Could not submit request" }, { status: 502 });
  }

  // Auto-route (leads growth loop): exclusive round-robin to ONE vendor,
  // post-response so intake latency never grows. Consent-gated twice (the
  // marketplace insert above + routeLeadExclusive's own hard guard); both
  // flags must be on. Cascade advance rides along opportunistically.
  if (leadId && marketplace.consent_contact) {
    after(async () => {
      try {
        const flags = await getServerFlags();
        if (flags.leadRouting && flags.leadAutoRoute) {
          await autoRouteLead(db, leadId);
          await advanceLeadCascade(db, 10);
        }
      } catch { /* routing best-effort — the lead is safely stored either way */ }
    });
  }

  // Best-effort: confirmation email to the enquirer if they left one (non-blocking).
  if (email) {
    try {
      const t = leadConfirmationEmail({ name });
      await sendEmail({ to: email, subject: t.subject, html: t.html, template: "lead-confirmation" });
    } catch { /* email best-effort — never affect the API response */ }
  }

  // Best-effort: also capture the email in beehiiv for follow-up (non-blocking).
  // Transactional (quote intake) → no welcome email; tags intent=owner.
  if (email) {
    await beehiivSubscribe({
      email,
      source: "lead",
      sendWelcome: false,
      ...(category ? { extraFields: [{ name: "category", value: String(category) }] } : {}),
    });
  }

  return NextResponse.json({ ok: true });
}
