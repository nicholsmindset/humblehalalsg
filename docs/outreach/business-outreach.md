# Business outreach — cold email kit

Short, Hormozi-flavoured emails to onboard cafés & halal businesses. All drive to the
landing page: **https://www.humblehalal.com/partners**. Mail-merge from
`outreach-claim-list.csv` (columns: Name, Area, Halal status, Claim URL, Listing URL).
Replace the copy with your own voice — this is a starting point.

Tokens: `{{Name}}` = business name · `{{Area}}` = area · `{{ClaimURL}}` = their claim link.

---

## Email 1 — Cold (unclaimed listing)

**Subject lines (A/B):**
- `{{Name}} is on Humble Halal — claim it (free)`
- Muslim diners are searching for {{Area}} halal spots
- Your free halal listing is ready, {{Name}}

**Body:**
> Assalamualaikum,
>
> Muslim Singaporeans search Humble Halal every day for halal places to eat in {{Area}} — and {{Name}} is already listed.
>
> Claiming it (free) lets you add your menu and photos, show a verified halal badge, reply to reviews, and see how many people are viewing and contacting you. It takes a few minutes and there's no card required.
>
> **Claim {{Name}} here → {{ClaimURL}}**
>
> More on what you get: https://www.humblehalal.com/partners
>
> Salaam,
> The Humble Halal team

---

## Email 2 — The repeat-customer hook (Halal Passport)

**Subject:** Turn Humble Halal members into regulars at {{Name}}

**Body:**
> Assalamualaikum,
>
> Quick one — our members earn Halal Passport points for reviewing and visiting halal spots. You can offer a simple perk (e.g. a free teh tarik at 200 points) that they redeem **at your counter**, bringing repeat customers through your door. A perk only ever costs you a return visit.
>
> It's free to set up once you've claimed {{Name}}:
> **{{ClaimURL}}**
>
> How it works: https://www.humblehalal.com/partners
>
> Salaam,
> The Humble Halal team

---

## Email 3 — Follow-up (no response after ~4 days)

**Subject:** re: your free {{Name}} listing

**Body:**
> Assalamualaikum — just floating this back up. Claiming {{Name}} on Humble Halal is free and puts you in front of Muslim diners searching {{Area}}. Two minutes: {{ClaimURL}}
>
> Not the right person? Reply and point me to whoever runs the front of house 🙏

---

### Sending notes
- Keep it plain-text and personal — no heavy HTML template for cold outreach.
- Send from a real person's address; small daily batches to protect deliverability.
- The claim link is the primary CTA; `/partners` is the "learn more" fallback.
