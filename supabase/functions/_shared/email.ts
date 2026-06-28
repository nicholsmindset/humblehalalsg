// Transactional email via Resend (Deno port of lib/email.ts). Graceful: returns
// simulated=true without RESEND_API_KEY. Best-effort logs to email_log.
import { admin } from "./supabase.ts";

const FROM = Deno.env.get("EMAIL_FROM") ?? "Humble Halal <hello@humblehalal.com>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  template?: string;
  businessId?: string;
}): Promise<{ ok: boolean; simulated: boolean }> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { ok: true, simulated: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    try {
      await admin().from("email_log").insert({
        to_email: opts.to,
        template: opts.template ?? null,
        business_id: opts.businessId ?? null,
      });
    } catch { /* email_log best-effort */ }
    return { ok: res.ok, simulated: false };
  } catch {
    return { ok: false, simulated: false };
  }
}
