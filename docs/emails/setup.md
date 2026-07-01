# Resend — setup & go-live checklist

The transactional email system is fully built and wired. It runs in **safe simulated mode** (no sends, no errors) until `RESEND_API_KEY` is set. These are the one-time steps to turn real sending on.

## 1. Verify the sending domain in Resend (required — avoids spam folder)
1. Sign in at **resend.com** → **Domains → Add Domain** → `humblehalal.com`.
2. Resend shows DNS records to add (an **SPF** `TXT`, **DKIM** `CNAME`s, and a **DMARC** `TXT`). Add them where `humblehalal.com` DNS is managed (Vercel Domains or your registrar).
3. Wait for **Verified** (usually a few minutes). Emails must be sent *from* this domain or they'll be rejected.

## 2. Create an API key
Resend → **API Keys → Create** → "Sending access" is enough. Copy it (starts `re_…`).

## 3. Set the Vercel env vars (Production + Preview)
| Var | Value | Required |
|---|---|---|
| `RESEND_API_KEY` | your `re_…` key (type: **Encrypted/Secret**) | **Yes** — unblocks all sending |
| `EMAIL_FROM` | `Humble Halal <hello@humblehalal.com>` (must be on the verified domain) | Optional (has default) |
| `EMAIL_REPLY_TO` | `hello@humblehalal.com` (where replies go) | Optional (defaults to this) |
| `CONTACT_INBOX` | inbox for contact-form + admin claim alerts, e.g. `hello@humblehalal.com` | Optional |

Then **redeploy** (an empty commit to `master`, or the Vercel "Redeploy" button) so the new env is picked up.

## 4. Verify it works
- **Live test:** sign in as admin → `/admin` → **Ownership claims** → approve a test claim → the owner should receive *"You're verified as the owner of {business} 🎉"* within seconds.
- **Audit trail:** every send (real or simulated-skip) is best-effort logged to the `email_log` table (`to_email`, `template`, `sent_at`) — admin-readable.
- **Rendering:** send yourself one of each and check on Gmail + Apple Mail mobile (logo, gold CTA button, footer).

## Notes
- **Auth emails** (sign-in, verification) are sent by **Clerk** — not here.
- **Newsletter / marketing** is **beehiiv** — not here. Resend is transactional only.
- Nothing sends to anyone until step 3 is done, so it's safe to leave until you're ready.
