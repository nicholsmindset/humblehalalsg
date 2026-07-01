# Humble Halal — Transactional Email Copy

Voice: **warm, lightly Islamic**. Every email opens `Assalamualaikum {firstName},` and closes (in the branded footer) with *"With salaam, The Humble Halal team."* Sent via **Resend** (`lib/email.ts`), rendered through the shared branded wrapper (`lib/emails/layout.ts`), copy in `lib/emails/templates.ts`. Auth emails are owned by **Clerk**; newsletter/marketing by **beehiiv** — not here.

> To tweak wording, edit the template in `lib/emails/templates.ts` (this doc mirrors it).

---

## ✅ Built now (Phase 2 — go-live critical)

### Business owner — claims
**Claim submitted** · to claimant (+ admin alert) · trigger: `POST /api/submissions` (kind=claim)
- **Subject:** We've received your claim for {business}
- Assalamualaikum {name}, Thank you for claiming **{business}** on Humble Halal. Our team will verify ownership and get back to you shortly — usually within 1–2 business days. Once approved you'll be able to manage your listing: update details, hours and photos, reply to reviews, and see who's discovering you.
- *Admin alert →* Subject: "New ownership claim: {business}" · CTA **Review in admin** (`/admin`)

**Claim approved → owner welcome** ⭐ · to claimant · trigger: `actClaim` approve
- **Subject:** You're verified as the owner of {business} 🎉
- Assalamualaikum {name}, Good news — your ownership of **{business}** has been approved. You now have full control of your listing. From your dashboard you can update contact details, address, opening hours and photos, reply to reviews, and track views & contacts. **Tip:** upload your MUIS certificate to earn the verified badge.
- **CTA:** Open your dashboard → `/owner`

**Claim rejected** · to claimant · trigger: `actClaim` reject
- **Subject:** Update on your claim for {business}
- …we weren't able to verify your ownership. If this is a mistake, reply with proof (business registration, utility bill, or MUIS cert) and we'll take another look. **CTA:** Try claiming again → `/claim`

### Business owner — listings
**Listing submitted** · to submitter · `POST /api/submissions` (kind=listing)
- **Subject:** Thanks for adding {business} — …in review, you'll hear from us within 1–2 business days.

**Listing approved** ⭐ · to submitter · `actListing` approve
- **Subject:** {business} is now live on Humble Halal 🎉 — …discoverable now; add photos/hours; MUIS cert unlocks the verified badge. **CTA:** Manage your listing → `/owner`

**Listing rejected** · to submitter · `actListing` reject
- **Subject:** Update on your {business} submission — …may be a duplicate/missing details/needs clearer halal info; reply with corrections. **CTA:** Edit your submission → `/add-listing`

### Events
**RSVP confirmation** (free) · to attendee · `POST /api/rsvp`
- **Subject:** You're going: {event} — confirmed + 📅 date / 📍 venue / reference. **CTA:** View your ticket → `/travel/trips`

**Ticket confirmation** (paid) · to buyer · Stripe webhook (refactored to branded)
- **Subject:** Your tickets for {event} — confirmed; show the QR at the door. **CTA:** Open my tickets

**Event approved → organiser** · `actEvents` approve
- **Subject:** Your event is live: {event} — published & open for RSVPs; share to fill seats. **CTA:** View your event → `/events/{slug}`

### Travel
**Hotel booking confirmation** ⭐ · to guest · `POST /api/travel/book`
- **Subject:** Booking confirmed: {hotel} — check-in/out + booking reference. **CTA:** View your trip → `/travel/trips`

**Flight booking confirmation** ⭐ · to passenger · `POST /api/travel/flights/book`
- **Subject:** Flight booked: {route} — date + reference. **CTA:** View your trip

### Certificates
**Cert approved** · to owner · `/api/admin/cert` approve — **Subject:** {business} is now verified halal — verified badge is live. **CTA:** See your listing
**Cert rejected** · to owner · `/api/admin/cert` reject — **Subject:** Update on your certificate for {business} — re-upload a clear valid MUIS cert. **CTA:** Re-upload

### Payments / general
**Ad purchase receipt** · to buyer · Stripe webhook (kind=ad) — **Subject:** Receipt: {product} — we'll set up your placement & be in touch.
**Contact auto-reply** · to sender · `POST /api/contact` — **Subject:** Thanks for reaching out to Humble Halal — we'll reply within 1–2 business days. **CTA:** Explore Humble Halal

---

## 🔜 Planned (Phase 3 — next)
- **Owner:** review-received alert (to owner) · owner reply → reviewer · Stripe Connect account ready · payout scheduled · listing-edited receipt.
- **Events:** organiser new-attendee alert · event cancellation refund note (cancel email exists → rebrand).
- **Travel:** booking failed / refunded (LiteAPI webhook `app/api/travel/webhook`).
- **Community:** lead / request-a-quote confirmation · suggestion & report acknowledgements *(needs an email field captured on those forms first)*.
- **Payments:** plan-subscription receipt (or rely on Stripe's default).
- **Refactor:** move the remaining existing emails (fare-alert, freshness, cert-expiry crons, weekly-digest, owner-alert, event-reminder, join-approved/declined, event-cancelled, ticket-resend) onto `emailLayout` for one consistent look.

## Config prerequisites (you)
- Set **`RESEND_API_KEY`** in Vercel prod + verify **humblehalal.com** in Resend (SPF/DKIM). Optional: `EMAIL_REPLY_TO`, `CONTACT_INBOX`.
- Until then, all sends are simulated (safe) and logged to the `email_log` table.
