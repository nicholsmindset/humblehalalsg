# Stripe go-live — owner checklist (everything code-side is DONE)

All engineering shipped 11 Jul 2026 (PRs #216–#225): live prices created, payout
copy fixed, checkout errors surfaced, admin readiness panel, flash-sale seat
holds, dispute/refund clawback, balance-proof transfers, brand descriptor,
webhook resilience, dunning grace, early-fraud auto-refund. What remains is
owner-only access: Vercel env, the Stripe dashboard, and Supabase SQL pastes.

Work top-to-bottom. Items 1–3 make **plans** sellable; 4–7 prepare **tickets**.

## 1. Vercel env (Production) + redeploy — UNLOCKS PLAN SALES
Vercel → humblehalalsg → Settings → Environment Variables (Production):

- `STRIPE_SECRET_KEY` → the **standard Secret key** from Stripe → Developers →
  API keys → Standard keys → Reveal. Starts `sk_live_` (NOT `pk_live_`, not
  a restricted `rk_live_`).
- The nine live price IDs (created 11 Jul on the ONN GROUP LLP account):

```
STRIPE_PRICE_VERIFIED_M=price_1TrxJ7DjNCv7xF610BlMWQPf
STRIPE_PRICE_VERIFIED_Y=price_1TrxJ7DjNCv7xF61lwpWVXh9
STRIPE_PRICE_VERIFIED_FOUNDING_Y=price_1TrxJ8DjNCv7xF61Fhu41MSP
STRIPE_PRICE_FEATURED_M=price_1TrxJ9DjNCv7xF61tRtTaOtS
STRIPE_PRICE_FEATURED_Y=price_1TrxJ9DjNCv7xF61ViJai8UI
STRIPE_PRICE_PREMIUM_M=price_1TrxJADjNCv7xF616VGCfoPZ
STRIPE_PRICE_PREMIUM_Y=price_1TrxJBDjNCv7xF61FEXTIsuU
STRIPE_PRICE_LEADS_M=price_1TrxJyDjNCv7xF61XhfxA0PQ
STRIPE_PRICE_LEADS_FOUNDING_M=price_1TrxJyDjNCv7xF61DisYhCtg
```

- Verify `STRIPE_WEBHOOK_SECRET` is the `whsec_` from the LIVE endpoint
  (`we_1TrwabDjNCv7xF61c0od4UCV`, created 11 Jul).
- Then **Deployments → Redeploy** (env changes need a new deploy).
- ✅ Check: /admin → Monetization → "Payments live-readiness" shows
  key **live** and 9/9 prices resolving.

## 2. Stripe CLI restricted key: allow webhook updates
Stripe (Live) → Developers → API keys → restricted key "Stripe CLI"
(…YaQyH) → Edit → **Webhook Endpoints: Write** → Save. Then tell Claude
"try now" — it pushes the corrected event list. This ALSO FIXES A BUG: the
endpoint currently subscribes to `account.external_account.updated` instead
of `account.updated`, so organiser payout onboarding never syncs.

Full target list (15 events): checkout.session.completed, .expired,
.async_payment_succeeded, .async_payment_failed, customer.subscription
.created/.updated/.deleted, invoice.payment_succeeded, invoice.payment_failed,
payment_intent.succeeded, charge.refunded, charge.dispute.created,
refund.failed, radar.early_fraud_warning.created, account.updated.
(Fallback: edit the endpoint by hand in Developers → Webhooks.)

## 3. Supabase SQL pastes (SQL editor, in order)
- `supabase/migrations/0061_reserve_event_capacity.sql` — flash-sale seat holds
- `supabase/migrations/0062_payout_status_states.sql` — dispute/reversal states
- `supabase/migrations/0063_orders_pi_unique.sql` — duplicate-event order dedupe

Code degrades safely until pasted, but paste all three before any big paid event.

## 4. Stripe dashboard settings (~5 min, Live mode)
- Settings → Business → Public details → **shortened descriptor**: `ONNGROUP`
  (statements then read `ONNGROUP* HUMBLEHALAL`; suffix already set in code +
  on all 4 products).
- Settings → Billing → Revenue recovery: confirm **Smart Retries** +
  failed-payment emails are ON.
- Settings → Billing → **Customer portal**: save a configuration (enable
  cancel + payment-method update + invoices). Without it subscribers can't
  self-manage billing. The readiness panel warns until done.
- Security: enforce **2FA** for all dashboard members (account is shared with
  ElumiHome); rotate any key that was ever pasted into chat/code.

## 5. Smoke test plans (~$19, 5 min) — after item 1
1. /admin → Monetization → readiness panel all green → toggle **Paid plans** ON.
2. Sign in as a business owner → /pricing → **Choose Verified (monthly)**.
3. Complete the LIVE Stripe checkout with a real card.
4. Tell Claude — it probes `businesses.plan` flipping to `verified`
   (proves key + price + webhook + fulfilment end-to-end).
5. Refund from the Stripe dashboard (Payments → ⋯ → Refund) and toggle the
   flag back OFF if not launching yet.

## 6. Before enabling PAID TICKETS
- Items 2–4 done (esp. `account.updated` — onboarding status never syncs
  without it).
- Connect is already activated in live mode (verified 11 Jul) ✅.
- At least one organiser completes "Set up payouts" and the readiness panel
  shows ≥1 payout-ready organiser.
- For a big/flash sale: consider telling Stripe Support in advance (live
  limit ≈25 checkout-creates/sec) and prefer PayNow (no chargebacks) —
  activate PayNow in Settings → Payment methods before flipping PAYNOW flag.

## 7. Later / optional
- Radar rules (velocity + request-3DS on elevated risk) for ticket sales.
- Decide on Stripe email receipts (they carry shared-account branding; own
  transactional emails already cover it — default OFF is fine).
- Longer-term: a separate Stripe account for Humble Halal under the same LLP
  (cleaner branding/disputes/balance) — cheapest to do BEFORE many organisers
  onboard.
- Migrate the server key to a restricted key (Checkout, Customers,
  Subscriptions, Transfers, Refunds, Connect, Billing Portal — write).
- Pin the webhook endpoint's API version in the dashboard (shared account:
  another product's upgrade changes event payload shapes).
