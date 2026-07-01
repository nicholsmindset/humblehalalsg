import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";
import { reportAckEmail } from "@/lib/emails/templates";

/* Listing report (wrong halal status, closed, hours, etc.). Graceful-degradation:
   validates + accepts now; persists to a Supabase `reports` moderation queue when
   the backend is wired. An OPTIONAL reporter email (0039) lets us send a
   "thanks, we've received it" acknowledgement — best-effort, never blocks. */

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function POST(req: Request) {
  const rl = await rateLimit(req, "reports", 10, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (body?.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot

  const businessId = String(body?.businessId || "").trim();
  const reason = String(body?.reason || "").trim();
  const details = String(body?.details || "").trim().slice(0, 1500);
  const emailRaw = String(body?.email || "").trim().slice(0, 200);
  const email = emailRaw && isEmail(emailRaw) ? emailRaw : null;

  if (!reason) {
    return NextResponse.json({ ok: false, error: "Pick what's wrong." }, { status: 422 });
  }

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      const { error } = await sb
        .from("reports")
        .insert({ business_ref: businessId || null, reason, details, email, status: "open" });
      if (!error) {
        // Best-effort acknowledgement — never affects the API response.
        try {
          if (email) {
            const t = reportAckEmail({ name: null });
            await sendEmail({ to: email, subject: t.subject, html: t.html, template: "report-ack" });
          }
        } catch { /* email best-effort */ }
        return NextResponse.json({ ok: true, simulated: false });
      }
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
