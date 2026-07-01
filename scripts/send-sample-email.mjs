/* Send a live sample of the claim-approved welcome email (exact branded output)
   to preview real rendering. Usage: node scripts/send-sample-email.mjs [to] */
import { readFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }

const U = "https://www.humblehalal.com";
const TAGLINE = "Singapore's trusted halal & Muslim-owned business directory";
const EMERALD = "#0b5d3b", EMERALD_DARK = "#094a2f", GOLD = "#c19a2e", INK = "#1c2621", SOFT = "#5b6b62", CREAM = "#faf7f0", LINE = "#e7e1d5";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const p = (html) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK};">${html}</p>`;
function emailLayout({ preheader = "", heading, bodyHtml, cta, footerNote }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CREAM};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:${EMERALD};border-radius:14px 14px 0 0;padding:22px 28px;">
  <a href="${U}" style="text-decoration:none;color:#fff;font-family:Georgia,serif;font-size:22px;font-weight:700;">☾ Humble Halal</a>
  <div style="color:#cfe3d7;font-size:12px;margin-top:2px;">${esc(TAGLINE)}</div></td></tr>
<tr><td style="background:#fff;padding:32px 28px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
  <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:22px;line-height:1.3;color:${INK};">${heading}</h1>
  ${bodyHtml}
  ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="border-radius:10px;background:${GOLD};"><a href="${cta.url}" style="display:inline-block;padding:13px 26px;font-size:16px;font-weight:700;color:#1c2200;text-decoration:none;border-radius:10px;">${esc(cta.label)} →</a></td></tr></table>` : ""}
  ${footerNote ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:${SOFT};">${footerNote}</p>` : ""}</td></tr>
<tr><td style="background:#fff;border:1px solid ${LINE};border-top:none;border-radius:0 0 14px 14px;padding:22px 28px;">
  <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:${SOFT};">With salaam,<br><strong style="color:${EMERALD_DARK};">The Humble Halal team</strong></p>
  <p style="margin:0 0 10px;font-size:12px;color:${SOFT};"><a href="${U}/explore" style="color:${EMERALD};text-decoration:none;">Explore the directory</a> · <a href="${U}/verify" style="color:${EMERALD};text-decoration:none;">How we verify</a> · <a href="${U}/for-business" style="color:${EMERALD};text-decoration:none;">For business</a></p>
  <p style="margin:0;font-size:11px;line-height:1.6;color:#9aa89f;">Operated by ONN GROUP LLP · 60 Paya Lebar Road #06-28 Paya Lebar Square, Singapore 409051.<br>Humble Halal is a discovery platform, not a certifier — always verify certification on the official MUIS HalalSG register.</p></td></tr>
</table></td></tr></table></body></html>`;
}

const businessName = "Kinara", name = "Robert";
const heading = `Welcome — ${esc(businessName)} is yours to manage`;
const bodyHtml =
  p(`Assalamualaikum ${esc(name)},`) +
  p(`Good news — your ownership of <strong>${esc(businessName)}</strong> has been approved. You now have full control of your listing on Humble Halal.`) +
  p(`From your dashboard you can update your contact details, address, opening hours and photos, reply to customer reviews, and track how many people are viewing and contacting you.`) +
  p(`<strong>Tip:</strong> upload your MUIS halal certificate to earn the verified badge — it's the strongest trust signal for customers.`);
const html = emailLayout({ preheader: "You're verified as the owner", heading, bodyHtml, cta: { label: "Open your dashboard", url: `${U}/owner` } });

const to = process.argv[2] || "dknyrob@gmail.com";
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: env.EMAIL_FROM || "Humble Halal <hello@humblehalal.com>", reply_to: env.EMAIL_REPLY_TO || "hello@humblehalal.com", to, subject: `You're verified as the owner of ${businessName} 🎉`, html }),
});
console.log(`→ ${to} · HTTP ${res.status} · ${(await res.text()).slice(0, 200)}`);
