import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { CONTACT_EMAILS } from "@/lib/contact";
import { contactAutoReplyEmail } from "@/lib/emails/templates";

/* Contact form intake. Graceful: validates + accepts; emails the team via Resend
   when configured (otherwise simulated). Honeypot-protected. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTH = { name: 120, email: 254, subject: 120, message: 4000 } as const;

export async function POST(req: Request) {
  const rl = await rateLimit(req, "contact", 5, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot
  if (!(await verifyTurnstile(body.turnstileToken))) return NextResponse.json({ ok: false, error: "captcha" }, { status: 403 });
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const subject = String(body.subject || "General enquiry").trim();
  const message = String(body.message || "").trim();
  if (
    name.length > MAX_LENGTH.name
    || email.length > MAX_LENGTH.email
    || subject.length > MAX_LENGTH.subject
    || message.length > MAX_LENGTH.message
  ) {
    return NextResponse.json({ ok: false, error: "One or more fields are too long" }, { status: 422 });
  }
  if (name.length < 2 || !EMAIL.test(email) || message.length < 5) return NextResponse.json({ ok: false, error: "Please complete the form" }, { status: 422 });

  const to = process.env.CONTACT_INBOX || CONTACT_EMAILS.general;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  try {
    await sendEmail({ to, subject: `[Contact: ${subject}] from ${name}`, template: "contact", html: `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p><p><strong>Subject:</strong> ${esc(subject)}</p><p>${esc(message).replace(/\n/g, "<br/>")}</p>` });
  } catch { /* best-effort; still acknowledge */ }
  // Auto-reply to the submitter so they know we received their message (best-effort).
  try {
    const t = contactAutoReplyEmail({ name });
    await sendEmail({ to: email, subject: t.subject, html: t.html, template: "contact-auto-reply" });
  } catch { /* best-effort */ }
  return NextResponse.json({ ok: true });
}
