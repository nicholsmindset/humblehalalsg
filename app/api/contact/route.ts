import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

/* Contact form intake. Graceful: validates + accepts; emails the team via Resend
   when configured (otherwise simulated). Honeypot-protected. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot
  const name = String(body.name || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160);
  const subject = String(body.subject || "General enquiry").slice(0, 120);
  const message = String(body.message || "").trim().slice(0, 4000);
  if (name.length < 2 || !EMAIL.test(email) || message.length < 5) return NextResponse.json({ ok: false, error: "Please complete the form" }, { status: 422 });

  const to = process.env.CONTACT_INBOX || "hello@humblehalal.com";
  try {
    await sendEmail({ to, subject: `[Contact: ${subject}] from ${name}`, template: "contact", html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Subject:</strong> ${subject}</p><p>${message.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>` });
  } catch { /* best-effort; still acknowledge */ }
  return NextResponse.json({ ok: true });
}
