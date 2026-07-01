// Minimal branded email layout for Edge Functions (Deno). Mirrors
// lib/emails/layout.ts visually — emerald header + cream body + footer — but
// self-contained (Edge Functions can't import the Next.js lib). Email-safe:
// table-based, inline styles, no external CSS/JS.

const EMERALD = "#0b5d3b";
const EMERALD_DARK = "#094a2f";
const GOLD = "#c19a2e";
const INK = "#1c2621";
const SOFT = "#5b6b62";
const CREAM = "#faf7f0";
const LINE = "#e7e1d5";
const SITE_URL = "https://www.humblehalal.com";
const TAGLINE = "Singapore's trusted halal directory";

export interface EmailCTA {
  label: string;
  url: string;
}

/** Escape user-supplied strings before interpolating into email HTML. */
export function esc(s: unknown): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}

/** Wrap a paragraph of plain text as a styled email paragraph. */
export const p = (html: string) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK};">${html}</p>`;

export function emailLayout(opts: {
  preheader?: string;
  heading: string;
  bodyHtml: string;
  cta?: EmailCTA;
  footerNote?: string;
}): string {
  const { preheader = "", heading, bodyHtml, cta, footerNote } = opts;
  const url = SITE_URL;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREAM};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <!-- header -->
    <tr><td style="background:${EMERALD};border-radius:14px 14px 0 0;padding:22px 28px;">
      <a href="${url}" style="text-decoration:none;color:#fff;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;">☾ Humble Halal</a>
      <div style="color:#cfe3d7;font-size:12px;margin-top:2px;">${esc(TAGLINE)}</div>
    </td></tr>
    <!-- content -->
    <tr><td style="background:#ffffff;padding:32px 28px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
      <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:${INK};">${heading}</h1>
      ${bodyHtml}
      ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;"><tr><td style="border-radius:10px;background:${GOLD};">
        <a href="${cta.url}" style="display:inline-block;padding:13px 26px;font-size:16px;font-weight:700;color:#1c2200;text-decoration:none;border-radius:10px;">${esc(cta.label)} →</a>
      </td></tr></table>` : ""}
      ${footerNote ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:${SOFT};">${footerNote}</p>` : ""}
    </td></tr>
    <!-- footer -->
    <tr><td style="background:#ffffff;border:1px solid ${LINE};border-top:none;border-radius:0 0 14px 14px;padding:22px 28px;">
      <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:${SOFT};">
        With salaam,<br><strong style="color:${EMERALD_DARK};">The Humble Halal team</strong>
      </p>
      <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${SOFT};">
        <a href="${url}/explore" style="color:${EMERALD};text-decoration:none;">Explore the directory</a> ·
        <a href="${url}/verify" style="color:${EMERALD};text-decoration:none;">How we verify</a> ·
        <a href="${url}/for-business" style="color:${EMERALD};text-decoration:none;">For business</a>
      </p>
      <p style="margin:0;font-size:11px;line-height:1.6;color:#9aa89f;">
        Operated by ONN GROUP LLP · 60 Paya Lebar Road #06-28 Paya Lebar Square, Singapore 409051.<br>
        Humble Halal is a discovery platform, not a certifier — always verify certification on the official MUIS HalalSG register.
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
