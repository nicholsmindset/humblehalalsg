# beehiiv Welcome Automation — Runbook

How to deliver the three lead-magnet guides to every new HumbleHalal subscriber. The
automation lives in the **beehiiv dashboard** (not in this repo); this doc is the spec +
ready-to-paste copy. The PDFs are committed at `public/guides/` and served from the live
site.

## Prerequisites

1. Prod env vars set (see `.env.example`): `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`.
   Without both, `app/api/subscribe/route.ts` runs in simulated mode and no real subscriber
   is created.
2. Guides deployed and reachable (replace the host with your production domain):
   - `https://<domain>/guides/ultimate-halal-food-guide-mrt.pdf`
   - `https://<domain>/guides/ramadan-2026-planner.pdf`
   - `https://<domain>/guides/halal-brand-cheat-sheet.pdf`
   - Hub page: `https://<domain>/guides`
3. Regenerate the PDFs after data changes with `npm run guides` and redeploy.

## Decision

**One welcome email delivers all three guides** (chosen with the team). Every subscriber
gets full value regardless of which on-site surface they signed up from. The per-surface
`source` custom field is still captured (footer, hero, popup, tool:<slug>, directory, blog,
ramadan, hari-raya, landing, guides), so a future source-branch is possible with **no code
change** — see "Optional enhancement" below.

## Automation setup (beehiiv → Automations → New)

- **Name:** Welcome — HumbleHalal
- **Trigger:** *Subscriber added* (all subscribers, all sources).
- **Steps:** Email 1 (immediate) → Wait 2 days → Email 2 → Wait 2 days → Email 3.
- Turn OFF the publication's default "welcome email" so subscribers don't get both — this
  automation replaces it. (`/api/subscribe` sends `send_welcome_email: true`; once the
  automation is live, set it as the welcome path and disable the default template.)

---

## Email 1 — instant (delivers the guides)

**Subject:** Your free halal guides are here 🌙
**Preview:** The Ultimate Halal Food Guide by MRT — plus two more, inside.

> Assalamualaikum and welcome to **HumbleHalal** 👋
>
> Thanks for joining Singapore's halal community newsletter. As promised, here are your
> free guides — download them now:
>
> 📍 **[Ultimate Halal Food Guide by MRT Station →](https://<domain>/guides/ultimate-halal-food-guide-mrt.pdf)**
> Verified halal & Muslim-owned spots near every MRT, with clear MUIS-certified vs
> self-declared labels.
>
> 🌙 **[Ramadan 2026 Planner →](https://<domain>/guides/ramadan-2026-planner.pdf)**
> Day-by-day sahur & iftar times for Singapore, a fasting tracker and your zakat reference.
>
> ✅ **[Halal Brand Status Cheat-Sheet →](https://<domain>/guides/halal-brand-cheat-sheet.pdf)**
> Quick yes/no verdicts for popular brands, checked against the MUIS HalalSG register.
>
> Every week I'll send you new MUIS-verified food finds, mosque events and deals across
> Singapore. Hit reply and tell me which neighbourhood you're in — I read every email.
>
> — The HumbleHalal team
> *All three guides also live at [/guides](https://<domain>/guides).*

---

## Email 2 — day 2 (story + best-of)

**Subject:** Why I started checking halal spots myself
**Preview:** The 45-minute Instagram rabbit-hole that started it all.

> Quick story: I once spent 45 minutes trying to work out whether a new place was actually
> halal — scrolling Instagram, squinting at certificates. That's why HumbleHalal exists: to
> verify it once, clearly, so you don't have to.
>
> A few reader favourites to start with:
> - 🍽️ [Browse halal food near you](https://<domain>/explore)
> - 🕌 [Find the nearest mosque & prayer times](https://<domain>/mosques)
> - ✅ [Check if a brand is halal](https://<domain>/is-halal)
>
> Got a spot we should verify? Just reply — tips from readers are how we grow.

---

## Email 3 — day 4 (referral + community)

**Subject:** Share HumbleHalal, unlock the full food guide
**Preview:** Refer 2 friends → the complete directory guide.

> Enjoying the guides? Share HumbleHalal and unlock more:
> - **2 referrals** → the complete Ultimate Halal Food Guide (full directory)
> - **5** → an exclusive area deep-dive
> - **10** → "Founding Member" shoutout
>
> [Grab your referral link →](#)  *(insert beehiiv referral magic link / {{referral_url}})*
>
> Also: add us to your contacts so the weekly issue lands in your inbox, and follow along on
> Instagram [@humblehalal.sg](#).

---

## Optional enhancement — source-branched delivery

beehiiv automations support conditional splits on a custom field. To tailor the lead with
the exact promise made on the signup surface, add a branch on the `source` custom field
after the trigger:

| `source` value                  | Lead with        |
|---------------------------------|------------------|
| `ramadan`, `tool:ramadan`       | Ramadan Planner  |
| `tool:zakat`, `tool:inheritance`| Ramadan Planner (zakat ref) |
| `blog`, `directory`, `popup`, `hero`, `landing`, `guides`, `footer` | Food Guide |

All three links should still appear in the email; only the headline/first button changes.
No code change is required — the `source` field is already populated on every signup.

## Verification

- Send yourself a test signup (real email) via the site footer once prod keys are set;
  confirm the subscriber appears in beehiiv with the correct `source`, and Email 1 arrives
  with three working PDF links.
- Click each link from the email on mobile + desktop → PDF opens.
- Confirm SPF/DKIM pass (beehiiv → Settings → sending domain) so it lands in the inbox.
