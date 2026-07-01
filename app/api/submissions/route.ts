import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";
import { emailForUser } from "@/lib/emails/recipient";
import { claimSubmittedEmail, claimAdminAlertEmail, listingSubmittedEmail } from "@/lib/emails/templates";

/* Unified submission intake for add-listing, suggest-a-business and claim flows.
   Graceful-degradation: validates + accepts now (so the UI shows a real
   "submitted for review" state), and is the single point to route into the
   Supabase moderation queues (staging_businesses / suggestions / claims) once
   the backend is wired. */

const KINDS = ["listing", "suggest", "claim"] as const;
type Kind = (typeof KINDS)[number];
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const MAX_BODY_BYTES = 64 * 1024; // 64KB — generous for a form, blocks payload DoS

/* Allow-list the moderation `raw` blob (security audit M5): keep only primitive
   fields, cap each string and the total key count, and never store the honeypot.
   Prevents mass-assignment of arbitrary/huge/nested client objects into the DB. */
function sanitizeRaw(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let n = 0;
  for (const [k, v] of Object.entries(body)) {
    if (n >= 40) break;
    if (k === "website") continue; // honeypot — drop
    if (typeof v === "string") { out[k] = v.slice(0, 2000); n++; }
    else if (typeof v === "number" || typeof v === "boolean") { out[k] = v; n++; }
    // objects/arrays/null are intentionally skipped
  }
  return out;
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "submissions", 8, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (body?.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot

  const { userId } = await auth(); // who submitted — links the listing to its owner on approval

  const kind = String(body?.kind || "") as Kind;
  if (!KINDS.includes(kind)) {
    return NextResponse.json({ ok: false, error: "Unknown submission type" }, { status: 422 });
  }

  // light per-kind validation
  const name = String(body?.name || "").trim();
  if ((kind === "listing" || kind === "suggest") && name.length < 2) {
    return NextResponse.json({ ok: false, error: "A business name is required." }, { status: 422 });
  }
  if (kind === "claim" && !body?.businessId && name.length < 2) {
    return NextResponse.json({ ok: false, error: "Tell us which business you're claiming." }, { status: 422 });
  }

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      let table: string;
      let row: Record<string, unknown>;
      if (kind === "listing") {
        table = "staging_businesses";
        row = {
          name,
          slug: String(body?.slug || "") || null,
          address: String(body?.address || "") || null,
          postal: String(body?.postal || "") || null,
          category_suggested: String(body?.cat || body?.category || "") || null,
          source: "owner",
          raw: { ...sanitizeRaw(body), ...(userId ? { submitted_by: userId } : {}) },
          review_status: "new",
        };
      } else if (kind === "suggest") {
        table = "suggestions";
        row = {
          name,
          area: String(body?.area || "") || null,
          category: String(body?.category || "") || null,
          note: String(body?.note || body?.why || "") || null,
        };
      } else {
        table = "claims";
        const bid = String(body?.businessId || "");
        // Proof is optional; note the attached filename in the message so the
        // admin claims queue shows what (if anything) was submitted, without a
        // schema dependency (the actual file upload is a later enhancement).
        const proofName = String(body?.proofFileName || "").trim();
        const msg = String(body?.message || "").trim();
        row = {
          business_id: isUuid(bid) ? bid : null,
          user_id: userId,
          role: String(body?.role || "") || null,
          message: [msg, proofName ? `[proof attached: ${proofName}]` : ""].filter(Boolean).join(" ") || null,
          status: "pending",
        };
      }
      const { error } = await sb.from(table).insert(row);
      if (!error) {
        // Best-effort acknowledgement emails — never affect the API response.
        try {
          if (kind === "claim" && userId) {
            // Resolve the claimed business's name (falls back to the typed name).
            const bid = isUuid(String(body?.businessId || "")) ? String(body?.businessId) : null;
            let businessName = name || "the business";
            if (bid) {
              const { data: biz } = await sb.from("businesses").select("name").eq("id", bid).maybeSingle();
              if (biz?.name) businessName = String(biz.name);
            }
            const { email, name: claimantName } = await emailForUser(sb, userId);
            if (email) {
              const t = claimSubmittedEmail({ name: claimantName, businessName });
              await sendEmail({ to: email, subject: t.subject, html: t.html, template: "claim-submitted", businessId: bid || undefined });
            }
            // Alert the admin inbox of the pending claim.
            const alertTo = process.env.CONTACT_INBOX || "hello@humblehalal.com";
            const alert = claimAdminAlertEmail({ businessName, claimantEmail: email, role: String(body?.role || "") || null });
            await sendEmail({ to: alertTo, subject: alert.subject, html: alert.html, template: "claim-admin-alert", businessId: bid || undefined });
          } else if (kind === "listing" && userId) {
            const { email, name: ownerName } = await emailForUser(sb, userId);
            if (email) {
              const t = listingSubmittedEmail({ name: ownerName, businessName: name });
              await sendEmail({ to: email, subject: t.subject, html: t.html, template: "listing-submitted" });
            }
          }
        } catch { /* email best-effort */ }
        return NextResponse.json({ ok: true, simulated: false, queued: true });
      }
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
