import "server-only";

/* Transactional email via Resend (owner alerts, freshness nudges, tickets).
   Graceful: returns simulated without RESEND_API_KEY. Records to `email_log` when
   Supabase is configured. Beehiiv owns the marketing newsletter
   (app/api/subscribe). */

const FROM = process.env.EMAIL_FROM || "Humble Halal <hello@humblehalal.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "hello@humblehalal.com";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  template?: string;
  businessId?: string;
}): Promise<{ ok: boolean; simulated: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: true, simulated: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    try {
      const { getSupabaseAdmin } = await import("./supabase/server");
      const sb = getSupabaseAdmin();
      if (sb) await sb.from("email_log").insert({ to_email: opts.to, template: opts.template || null, business_id: opts.businessId || null });
    } catch {
      /* email_log best-effort */
    }
    return { ok: res.ok, simulated: false };
  } catch {
    return { ok: false, simulated: false };
  }
}
