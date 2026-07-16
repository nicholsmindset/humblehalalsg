import { NextResponse, after } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { ticketConfirmationEmail, adPurchaseEmail, planStartedEmail, leadPlanStartedEmail } from "@/lib/emails/templates";
import { emailForBusinessOwner } from "@/lib/emails/recipient";
import { beehiivSubscribe } from "@/lib/beehiiv";
import { AD_PRODUCTS } from "@/lib/ad-products";
import { makeOrderRef, ticketRefs } from "@/lib/ticket-ref";
import { reverseOrderTransferIfPaid, setPayoutStatus } from "@/lib/payout-reversal";
import { notify } from "@/lib/notify";

const addDaysISO = (base: Date, days: number) => {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** In-app bell for a business's owner, keyed off a lifecycle/money event. The
 *  Stripe webhook already emails these events; this adds the bell so owners see
 *  subscription/payout state without checking email. Resolves businessId → the
 *  owner's Clerk sub (notifications.user_id). Best-effort: a notify failure must
 *  never fail fulfillment or the webhook ack. dedupeKey is required by callers
 *  because Stripe retries — the (user_id,type,dedupe_key) unique index (0033)
 *  collapses duplicates. */
async function notifyOwner(
  supa: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  businessId: string,
  n: { type: string; title: string; body?: string; link?: string; dedupeKey: string },
): Promise<void> {
  try {
    const { data } = await supa.from("businesses").select("owner_id, claimed_by").eq("id", businessId).maybeSingle();
    const userId = (data?.owner_id as string) || (data?.claimed_by as string) || "";
    if (userId) await notify({ userId, ...n });
  } catch { /* best-effort — never affects the webhook */ }
}

/** Donation refund reconciliation (audit streams-P2-7): decrement the PUBLIC
 *  "raised" figure by the NEWLY-refunded delta — correct for partial refunds,
 *  full refunds, and a full refund arriving after earlier partials, exactly
 *  once each. Needs 0065's donations.refunded_cents; until pasted, falls back
 *  to the original full-refund-only reversal. Returns whether a donation row
 *  matched this payment (so callers can try other ledgers). */
async function reconcileDonationRefund(
  supa: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  charge: Stripe.Charge,
  pi: string,
): Promise<boolean> {
  const { data: don, error } = await supa
    .from("donations").select("id, status, event_id, amount_cents, refunded_cents")
    .eq("stripe_payment_intent", pi).maybeSingle();
  if (error) {
    // Pre-0065 (refunded_cents column missing) — original behaviour.
    if (!charge.refunded) return false;
    const { data: d2 } = await supa.from("donations").select("id, status, event_id, amount_cents").eq("stripe_payment_intent", pi).maybeSingle();
    if (d2?.id && d2.status !== "refunded") {
      await supa.from("donations").update({ status: "refunded" }).eq("id", d2.id);
      if (d2.event_id && d2.amount_cents) {
        await supa.rpc("increment_donation_raised", { p_event_id: d2.event_id, p_amount: -d2.amount_cents });
      }
    }
    return !!d2?.id;
  }
  if (!don?.id) return false;
  const already = Number(don.refunded_cents) || 0;
  // Clamp to the recorded donation so a weird Stripe payload can't drive the
  // public total negative beyond this donation's own contribution.
  const donated = Number(don.amount_cents) || 0;
  const nowRefunded = Math.min(charge.amount_refunded || 0, donated || charge.amount_refunded || 0);
  const delta = nowRefunded - already;
  if (delta > 0) {
    await supa.from("donations")
      .update({ refunded_cents: nowRefunded, ...(charge.refunded ? { status: "refunded" } : {}) })
      .eq("id", don.id);
    if (don.event_id) {
      await supa.rpc("increment_donation_raised", { p_event_id: don.event_id, p_amount: -delta });
    }
  }
  return true;
}

/* Stripe webhook — single signed endpoint, idempotent fulfillment.
   No-ops cleanly when keys/DB aren't configured. */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    // In production a missing secret is a misconfiguration, not a no-op: a 200
    // here would make Stripe mark every paid event delivered and never retry
    // (silent permanent loss). 503 keeps deliveries pending until it's fixed —
    // same fail-closed posture as the Clerk and LiteAPI webhooks.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, skipped: "not_configured" });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig || "", secret);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  // idempotency: process each event id once. ONLY a unique-violation (23505)
  // means "already processed" → ack. Any other insert error is transient (DB
  // hiccup) and must 500 so Stripe retries, otherwise a paid event could be
  // dropped without fulfillment (security audit M4). NOTE: this claim is RELEASED
  // (deleted) if fulfillment later throws (see the catch), so a transient error
  // mid-fulfillment doesn't get masked as a "duplicate" on Stripe's retry.
  const supa = getSupabaseAdmin();
  if (!supa && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  if (supa) {
    const { error } = await supa.from("webhook_events").insert({ stripe_event_id: event.id });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
      console.error(`[stripe-webhook] idempotency store insert failed for ${event.id} (${event.type}):`, error.message);
      return NextResponse.json({ ok: false, error: "idempotency_store_unavailable" }, { status: 500 });
    }
  }

  const FEATURED_PLANS = new Set(["featured", "premium"]);

  try {
    switch (event.type) {
      // async_payment_succeeded re-enters the SAME fulfilment for delayed
      // methods (PayNow): their `completed` event arrives payment_status
      // 'unpaid' and is skipped below; success fires this second event (its own
      // event id, so the idempotency claim doesn't block it).
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object as Stripe.Checkout.Session;
        // Never fulfil an unpaid session (Stripe fulfillment guide). Cards are
        // always 'paid' at completion; delayed methods come back via
        // async_payment_succeeded / async_payment_failed.
        if ((s.payment_status ?? "paid") === "unpaid") break;
        // Lead-subscription checkout (kind=leads) — a SEPARATE product that must
        // NOT touch businesses.plan (that column is the listing plan). Handled
        // first so the plan block below never sees it.
        if (s.mode === "subscription" && s.metadata?.kind === "leads" && supa) {
          const businessId = s.metadata?.business_id || undefined;
          const leadPlan = s.metadata?.lead_plan || undefined;
          const quota = parseInt(s.metadata?.monthly_quota || "0", 10) || null;
          const subscription = typeof s.subscription === "string" ? s.subscription : undefined;
          if (businessId && subscription) {
            await supa.from("subscriptions").upsert({
              business_id: businessId, stripe_subscription_id: subscription,
              kind: "leads", plan: leadPlan, status: "active", monthly_quota: quota,
            }, { onConflict: "stripe_subscription_id" });
            // Post-response (after()): Checkout waits ≤10s for this webhook
            // before redirecting the buyer — emails must never spend that.
            after(async () => {
              try {
                const owner = await emailForBusinessOwner(supa, businessId);
                const to = owner.email || s.customer_details?.email || null;
                if (to) {
                  const t = leadPlanStartedEmail({ name: owner.name || s.customer_details?.name, quota: quota || 15 });
                  await sendEmail({ to, subject: t.subject, html: t.html, template: "lead-plan-started", businessId });
                }
              } catch { /* email best-effort */ }
            });
          }
          break;
        }
        // Subscription checkout (listing plans).
        if (s.mode === "subscription" && supa) {
          const businessId = s.metadata?.business_id || undefined;
          const plan = s.metadata?.plan || undefined;
          const customer = typeof s.customer === "string" ? s.customer : undefined;
          const subscription = typeof s.subscription === "string" ? s.subscription : undefined;
          if (businessId && plan) {
            await supa.from("businesses").update({ plan, featured: FEATURED_PLANS.has(plan), ...(customer ? { stripe_customer_id: customer } : {}) }).eq("id", businessId);
            if (subscription) {
              await supa.from("subscriptions").upsert({ business_id: businessId, stripe_subscription_id: subscription, plan, status: "active" }, { onConflict: "stripe_subscription_id" });
            }
            // Durable proof of the paid promise. This ledger lets support/admins
            // reconcile Stripe against the plan and automatic placement state.
            // Best-effort during a rolling migration: fulfillment must remain
            // successful even if the new audit table is not visible yet.
            await supa.from("plan_entitlement_events").upsert({
              stripe_event_id: event.id,
              stripe_subscription_id: subscription || null,
              business_id: businessId,
              plan,
              subscription_status: "active",
              source: "stripe",
            }, { onConflict: "stripe_event_id", ignoreDuplicates: true });
            // In-app bell: plan is live (owners get an email too, but the bell is
            // where they track account state). dedupe on the sub so a retry or the
            // paired async_payment_succeeded can't double-notify.
            await notifyOwner(supa, businessId, {
              type: "plan_active",
              title: `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan is active`,
              body: "Your listing upgrades are live. Manage billing anytime from your dashboard.",
              link: "/owner?tab=billing",
              dedupeKey: `plan_active:${subscription || businessId}`,
            });
            // Welcome / plan-started email to the customer (best-effort). Prefer the
            // owner's profile (name) resolved via the business; fall back to the
            // email Stripe collected at checkout. Post-response via after().
            after(async () => {
              try {
                const owner = await emailForBusinessOwner(supa, businessId);
                const to = owner.email || s.customer_details?.email || null;
                if (to) {
                  const t = planStartedEmail({ name: owner.name || s.customer_details?.name, plan });
                  await sendEmail({ to, subject: t.subject, html: t.html, template: "plan-started", businessId });
                  // Flip the owner's beehiiv lifecycle stage → subscribed so the
                  // abandoned-checkout recovery automation stops and any "upgraded"
                  // nurture can trigger (best-effort, transactional — no welcome).
                  await beehiivSubscribe({ email: to, source: "checkout", stage: "subscribed", sendWelcome: false, extraFields: [{ name: "plan", value: plan }] });
                }
              } catch { /* email best-effort — never affect the webhook ack */ }
            });
          }
        }
        // Event-ticket checkout (separate charges). Record the order + tickets and
        // schedule the organiser payout for 24h after the event (cron transfers it).
        // `payment_status === "paid"` guard: card sessions are always paid at
        // completion, but an async method (PayNow) can complete the session while
        // still unpaid and settle later — never issue tickets before the money
        // lands (audit payNow-01). The async_payment_succeeded handler that
        // fulfills settled PayNow orders is a go-live prereq (docs/engineering/
        // payment-go-live.md) — until then PayNow is safe-but-inert.
        else if (s.mode === "payment" && s.metadata?.kind === "ticket" && (s.payment_status ?? "paid") === "paid" && supa) {
          const m = s.metadata;
          const qty = Math.max(1, parseInt(m.qty || "1", 10));
          const subtotal = parseInt(m.subtotalCents || "0", 10);
          const fee = parseInt(m.feeCents || "0", 10);
          // Organiser's transfer amount. netCents is authoritative (fee-mode +
          // promo aware); sessions created before that metadata existed carry
          // only subtotalCents, whose old semantics WERE the organiser net.
          const net = m.netCents != null && m.netCents !== "" ? parseInt(m.netCents, 10) : subtotal;
          const total = s.amount_total ?? subtotal + fee;
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : null;
          const buyerEmail = s.customer_details?.email || null;
          const connected = m.connectedAccount || null;
          const discount = parseInt(m.discountCents || "0", 10) || 0;
          let utm: unknown = null;
          try {
            utm = m.utm ? JSON.parse(m.utm) : null;
          } catch { /* malformed attribution never blocks fulfillment */ }

          // Resolve the DB event (for the FK + payout date). Mock-only events have
          // no row yet → store a null event_id and a +1d fallback payout date.
          const { data: dbEvent } = await supa.from("events").select("id, date_iso, taken").eq("id", m.eventId || "").maybeSingle();
          const payoutDue = dbEvent?.date_iso ? addDaysISO(new Date(dbEvent.date_iso), 1) : addDaysISO(new Date(), 1);

          const { data: ord, error: ordErr } = await supa.from("orders").insert({
            event_id: dbEvent?.id ?? null,
            business_id: m.businessId || null,
            buyer_email: buyerEmail,
            buyer_name: m.buyer || null,
            amount_cents: total,
            fee_cents: fee,
            net_cents: net,
            currency: s.currency || "sgd",
            qty,
            stripe_payment_intent: pi,
            status: "confirmed",
            connected_account_id: connected,
            payout_status: connected && net > 0 ? "pending" : "none",
            payout_due: payoutDue,
            fee_mode: m.feeMode === "absorb" ? "absorb" : "pass",
            promo_code_id: m.promoCodeId || null,
            discount_cents: discount,
            ref_code: m.refCode || null,
            session_id: m.sessionId || null,
            utm,
          }).select("id").single();
          // Stripe can emit two distinct events for one occurrence — the
          // per-event idempotency claim can't catch that, but the unique index
          // on stripe_payment_intent (0063) can: a duplicate insert 23505s.
          // The order already exists with its tickets → ack and stop, never
          // double-issue tickets or double-count seats.
          if (ordErr?.code === "23505") break;
          // The order is the root of fulfillment — if it fails to insert, DON'T
          // silently issue no tickets while holding the idempotency claim (buyer
          // paid, gets nothing, no retry — audit paidTickets-02). Throw so the
          // outer handler releases the claim and Stripe retries the event.
          if (ordErr || !ord?.id) throw new Error(`ticket order insert failed: ${ordErr?.message || "no row"}`);

          // Count the redemption once the money is actually confirmed (accepting
          // the tiny max_redemptions oversell window vs. reserving at session
          // creation, which would need a TTL-release cron).
          if (ord?.id && m.promoCodeId) {
            try {
              await supa.rpc("redeem_promo", { p_id: m.promoCodeId });
            } catch { /* best-effort counter — never blocks fulfillment */ }
          }

          if (ord?.id) {
            // In-app bell for the organiser that a ticket sold — post-response so
            // a flash sale's many orders never delay the Stripe ack; dedupe on the
            // order so a webhook retry can't double-notify.
            if (m.businessId) {
              after(async () => {
                await notifyOwner(supa, m.businessId, {
                  type: "ticket_sold",
                  title: `You sold ${qty} ticket${qty === 1 ? "" : "s"}`,
                  body: `${m.eventTitle || "Your event"} — S$${(net / 100).toFixed(2)} will be paid out after the event.`,
                  link: "/owner?tab=events",
                  dedupeKey: `ticket_sold:${ord.id}`,
                });
              });
            }
            // Human-friendly qr_refs (lib/ticket-ref) — the emailed reference IS
            // the scannable/typable door code (the old order-id prefix matched
            // nothing at check-in).
            let paidRef = makeOrderRef("TKT");
            for (let attempt = 0; attempt < 3; attempt++) {
              const tix = ticketRefs(paidRef, qty).map((qr) => ({ order_id: ord.id, event_id: dbEvent?.id ?? null, tier: m.tier || null, qr_ref: qr }));
              const { error: tixErr } = await supa.from("tickets").insert(tix);
              if (!tixErr) break;
              if (tixErr.code !== "23505" || attempt === 2) break; // order recorded; tickets recoverable via resend/admin
              paidRef = makeOrderRef("TKT");
            }
            // Atomic increment (security audit M2) so concurrent settlements don't
            // lose updates; fall back to read+write if the RPC isn't deployed yet.
            // Sessions flagged reserved="1" already counted their seats at
            // creation (flash-sale hold) — counting again would double-book.
            if (dbEvent?.id && m.reserved !== "1") {
              const { error: incErr } = await supa.rpc("increment_event_taken", { p_event_id: dbEvent.id, p_qty: qty });
              if (incErr) await supa.from("events").update({ taken: (dbEvent.taken || 0) + qty }).eq("id", dbEvent.id);
            }
            if (buyerEmail) {
              // Post-response (after()): during a flash sale hundreds of these
              // fire — email latency must never delay the Stripe ack/redirect.
              const emailRef = paidRef;
              after(async () => {
                try {
                  const t = ticketConfirmationEmail({
                    eventTitle: m.eventTitle || m.tier || "Event",
                    qty,
                    ref: emailRef,
                  });
                  await sendEmail({ to: buyerEmail, subject: t.subject, html: t.html, template: "ticket-confirmation" });
                } catch { /* email best-effort */ }
              });
            }
          }
        }
        // Zakat / sadaqah donation for a charity event. Record it + mirror the
        // running total into events.display so the public page shows a real figure.
        else if (s.mode === "payment" && s.metadata?.kind === "donation" && supa) {
          const m = s.metadata;
          const amount = s.amount_total ?? parseInt(m.amountCents || "0", 10);
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : null;
          const { error: dErr } = await supa.from("donations").insert({
            event_id: m.eventId || null,
            amount_cents: amount,
            currency: s.currency || "sgd",
            donor_email: s.customer_details?.email || null,
            stripe_payment_intent: pi,
            status: "paid",
          });
          // Mirror the honest running total into the event's display jsonb.
          // Atomic increment so concurrent donations don't lose updates; fall
          // back to read+write only if the RPC isn't deployed yet.
          if (!dErr && m.eventId) {
            const { error: incErr } = await supa.rpc("increment_donation_raised", { p_event_id: m.eventId, p_amount: amount });
            if (incErr) {
              const { data: evRow } = await supa.from("events").select("display").eq("id", m.eventId).maybeSingle();
              const disp = (evRow?.display && typeof evRow.display === "object" ? evRow.display : {}) as Record<string, unknown>;
              const prev = Number(disp.donationRaisedCents) || 0;
              await supa.from("events").update({ display: { ...disp, donationRaisedCents: prev + amount } }).eq("id", m.eventId);
            }
          }
        }
        // Self-serve campaign purchase → flip the pre-created draft to
        // 'scheduled' (serves at starts_on once an admin approves the creative)
        // + record the revenue. Replays are no-ops: the status guard plus the
        // unique stripe_payment_intent index (0044) make this idempotent.
        else if (s.mode === "payment" && s.metadata?.kind === "ad_selfserve" && supa) {
          const m = s.metadata;
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : null;
          const campaignId = m.campaignId || "";
          if (campaignId) {
            const { data: updated } = await supa
              .from("ad_campaigns")
              .update({ status: "scheduled", stripe_payment_intent: pi })
              .eq("id", campaignId)
              .eq("status", "draft") // replay guard
              .select("id, title, placement_key, rate_cents, starts_on, ends_on")
              .maybeSingle();

            // Revenue ledger row (same shape as legacy ad purchases; unique PI
            // makes a replayed insert fail silently → catch + ignore).
            try {
              await supa.from("ad_orders").insert({
                business_id: m.businessId || null,
                product: `selfserve:${updated?.placement_key || "campaign"}`,
                amount_cents: s.amount_total ?? 0,
                stripe_payment_intent: pi,
                status: "paid",
              });
            } catch { /* replay or ledger drift — campaign update is authoritative */ }

            const buyerEmail = s.customer_details?.email || null;
            // Post-response (after()): receipts + review nudges never hold the ack.
            if (updated) {
              // In-app bell: payment landed, creative is queued for review.
              if (m.businessId) {
                await notifyOwner(supa, m.businessId, {
                  type: "ad_submitted",
                  title: "Ad payment received — in review",
                  body: `"${updated.title}" is booked for ${updated.starts_on} → ${updated.ends_on}. It goes live once our team approves the creative.`,
                  link: "/owner?tab=ads",
                  dedupeKey: `ad_live:${campaignId}`,
                });
              }
              after(async () => {
                if (buyerEmail) {
                  try {
                    const currency = (s.currency || "sgd").toUpperCase();
                    const amount = s.amount_total ? `${currency} ${(s.amount_total / 100).toFixed(2)}` : undefined;
                    const t = adPurchaseEmail({ productName: `${updated.title} (${updated.starts_on} → ${updated.ends_on})`, amount, ref: pi ? pi.slice(-8).toUpperCase() : undefined });
                    await sendEmail({ to: buyerEmail, subject: t.subject, html: t.html, template: "ad-purchase", businessId: m.businessId || undefined });
                  } catch { /* email best-effort */ }
                }
                // Nudge the review queue — payment is confirmed, creative awaits approval.
                try {
                  const inbox = process.env.CONTACT_INBOX || "hello@humblehalal.com";
                  await sendEmail({
                    to: inbox,
                    subject: `Paid self-serve campaign awaiting review: ${updated.title}`,
                    template: "ad-selfserve-review",
                    html: `<p>A self-serve campaign has been PAID and is waiting for creative review in the admin dashboard.</p><p><strong>${updated.title}</strong> · ${updated.placement_key} · ${updated.starts_on} → ${updated.ends_on}</p>`,
                  });
                } catch { /* alert best-effort */ }
              });
            }
          }
        }
        // Sponsored-ad / promo purchase → record the ad order (revenue ledger).
        else if (s.mode === "payment" && s.metadata?.kind === "ad" && supa) {
          const m = s.metadata;
          const pi = typeof s.payment_intent === "string" ? s.payment_intent : null;
          await supa.from("ad_orders").insert({
            business_id: m.businessId || null,
            product: m.product || "ad",
            amount_cents: s.amount_total ?? 0,
            stripe_payment_intent: pi,
            status: "paid",
          });
          // Receipt / confirmation email to the buyer (best-effort, post-response).
          const buyerEmail = s.customer_details?.email || null;
          if (buyerEmail) {
            after(async () => {
              try {
                const catalog = m.product ? AD_PRODUCTS[m.product] : undefined;
                const productName = catalog?.name || m.product || "Advertising purchase";
                const cents = s.amount_total ?? catalog?.cents ?? 0;
                const currency = (s.currency || "sgd").toUpperCase();
                const amount = cents ? `${currency} ${(cents / 100).toFixed(2)}` : undefined;
                const t = adPurchaseEmail({ productName, amount, ref: pi ? pi.slice(-8).toUpperCase() : undefined });
                await sendEmail({ to: buyerEmail, subject: t.subject, html: t.html, template: "ad-purchase", businessId: m.businessId || undefined });
              } catch { /* email best-effort */ }
            });
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const businessId = sub.metadata?.business_id || undefined;
        const plan = sub.metadata?.plan || null;
        const active = sub.status === "active" || sub.status === "trialing";
        // Basil API (stripe v22+): current_period_end lives on the subscription
        // ITEMS; the top-level field only exists on older pinned API versions.
        const cpe =
          sub.items?.data?.[0]?.current_period_end ??
          (sub as unknown as { current_period_end?: number }).current_period_end;
        // LEADS subscription — update ITS row (kind/period/quota) and STOP.
        // Must run before the plan block below: that block would otherwise set
        // businesses.plan = 'free' (no plan metadata on a leads sub), silently
        // downgrading a paying listing plan.
        if (sub.metadata?.kind === "leads") {
          if (supa && businessId) {
            const cps =
              sub.items?.data?.[0]?.current_period_start ??
              (sub as unknown as { current_period_start?: number }).current_period_start;
            const quota = parseInt(sub.metadata?.monthly_quota || "0", 10) || null;
            await supa.from("subscriptions").upsert({
              business_id: businessId,
              stripe_subscription_id: sub.id,
              kind: "leads",
              plan: sub.metadata?.lead_plan || null,
              status: sub.status,
              monthly_quota: quota,
              current_period_start: cps ? new Date(cps * 1000).toISOString() : null,
              current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
            }, { onConflict: "stripe_subscription_id" });
          }
          break;
        }
        if (supa && businessId) {
          await supa.from("subscriptions").upsert({
            business_id: businessId,
            stripe_subscription_id: sub.id,
            plan,
            status: sub.status,
            current_period_end: cpe ? new Date(cpe * 1000).toISOString() : null,
          }, { onConflict: "stripe_subscription_id" });
          // Dunning grace: 'past_due' means ONE renewal charge failed and
          // Stripe Smart Retries (up to ~2 weeks) are still running — yanking
          // the paid listing to free on the first declined card punishes a
          // paying customer mid-recovery. Keep their plan untouched during
          // past_due; downgrade only on terminal/none-paying states
          // (canceled, unpaid, incomplete, paused …).
          if (sub.status !== "past_due") {
            await supa.from("businesses").update({
              plan: active && plan ? plan : "free",
              featured: active && FEATURED_PLANS.has(plan || ""),
            }).eq("id", businessId);
          }
          await supa.from("plan_entitlement_events").upsert({
            stripe_event_id: event.id,
            stripe_subscription_id: sub.id,
            business_id: businessId,
            plan: active && plan ? plan : "free",
            subscription_status: sub.status,
            source: "stripe",
          }, { onConflict: "stripe_event_id", ignoreDuplicates: true });
          // In-app bell on terminal cancellation only (not every subscription.*
          // churn event) so the owner knows their listing dropped to free.
          if (event.type === "customer.subscription.deleted") {
            await notifyOwner(supa, businessId, {
              type: "plan_canceled",
              title: "Your plan was canceled",
              body: "Your listing has returned to the free tier. Re-subscribe anytime to restore your upgrades.",
              link: "/owner?tab=billing",
              dedupeKey: `plan_canceled:${sub.id}`,
            });
          }
        }
        break;
      }
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        if (supa) {
          // Read prior state first so we can detect the payouts_enabled flip and
          // congratulate the owner exactly once (account.updated fires often).
          const { data: prior } = await supa.from("stripe_accounts")
            .select("business_id, payouts_enabled").eq("stripe_account_id", acct.id).maybeSingle();
          await supa.from("stripe_accounts").update({
            charges_enabled: acct.charges_enabled,
            payouts_enabled: acct.payouts_enabled,
            details_submitted: acct.details_submitted,
            updated_at: new Date().toISOString(),
          }).eq("stripe_account_id", acct.id);
          if (acct.payouts_enabled && prior && !prior.payouts_enabled && prior.business_id) {
            await notifyOwner(supa, prior.business_id as string, {
              type: "payouts_enabled",
              title: "Payouts enabled 🎉",
              body: "Your Stripe account is ready — you can now sell tickets and get paid.",
              link: "/owner?tab=payouts",
              dedupeKey: `payouts_enabled:${acct.id}`,
            });
          }
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : undefined;
        // Stripe fires charge.refunded for PARTIAL refunds too. `charge.refunded`
        // is true ONLY when the charge is FULLY refunded — gate the full reversal
        // on it so a partial refund (e.g. one of three tickets, or just the booking
        // fee) does NOT void all tickets, flip the whole order to refunded, release
        // full event capacity, or reverse the full donation total. Partial refunds
        // are a no-op here (handle proportional reversal separately if ever needed).
        if (supa && pi && charge.refunded) {
          // Read first so we only reverse once (avoids double-decrementing the
          // event's taken counter if charge.refunded fires for the same order).
          const { data: ord } = await supa.from("orders").select("id, status, event_id, qty, payout_status, stripe_transfer_id").eq("stripe_payment_intent", pi).maybeSingle();
          if (ord?.id && ord.status !== "refunded") {
            await supa.from("orders").update({ status: "refunded" }).eq("id", ord.id);
            await supa.from("tickets").update({ status: "refunded" }).eq("order_id", ord.id).neq("status", "used");
            // Free the refunded capacity back to the event (atomic, clamped ≥0).
            if (ord.event_id && ord.qty) {
              await supa.rpc("decrement_event_taken", { p_event_id: ord.event_id, p_qty: ord.qty });
            }
            // Buyer money returned → the organiser must not keep (or later
            // receive) the payout for it. Reverse an already-sent transfer;
            // otherwise make sure the pending payout can never fire.
            const result = await reverseOrderTransferIfPaid(stripe, supa, ord);
            if (result === "not_needed" && ord.payout_status !== "none") {
              await setPayoutStatus(supa, ord.id, "none");
            }
          } else if (!ord) {
            // No order matched → it may be a donation refund (e.g. issued from
            // the Stripe dashboard). Delta-based so the public total stays
            // honest across partial + full refunds.
            const wasDonation = await reconcileDonationRefund(supa, charge, pi);
            if (!wasDonation) {
              // Ad purchase refund (audit streams-P0-2): fix the revenue ledger
              // AND stop the campaign — a dashboard refund used to leave the ad
              // serving with ad_orders still 'paid'.
              const { data: adOrd } = await supa.from("ad_orders").select("id, status").eq("stripe_payment_intent", pi).maybeSingle();
              if (adOrd?.id && adOrd.status !== "refunded") {
                await supa.from("ad_orders").update({ status: "refunded" }).eq("id", adOrd.id);
              }
              await supa.from("ad_campaigns").update({ status: "ended" }).eq("stripe_payment_intent", pi).neq("status", "ended");
            }
          }
        } else if (supa && pi && (charge.amount_refunded || 0) > 0) {
          // PARTIAL refund: orders stay a deliberate no-op (voiding every ticket
          // over a partial refund would be wrong) — but the public donation
          // "raised" figure must drop by the refunded delta (streams-P2-7).
          await reconcileDonationRefund(supa, charge, pi);
        }
        break;
      }
      // A chargeback debits the PLATFORM (separate-charges model) — never pay
      // the organiser for contested money, and claw back a payout that already
      // went out. The cron only processes payout_status='pending', so 'held'
      // stops it with no cron change. If the dispute is later WON, an admin
      // flips the order back to 'pending' manually (rare; deliberate).
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const pi = typeof dispute.payment_intent === "string" ? dispute.payment_intent : undefined;
        type DisputedOrder = { id: string; payout_status: string | null; stripe_transfer_id: string | null };
        let ord: DisputedOrder | null = null;
        if (supa && pi) {
          const { data } = await supa.from("orders").select("id, payout_status, stripe_transfer_id").eq("stripe_payment_intent", pi).maybeSingle();
          ord = (data as DisputedOrder | null) ?? null;
          if (ord?.id) {
            if (ord.payout_status === "paid") await reverseOrderTransferIfPaid(stripe, supa, ord);
            else if (ord.payout_status === "pending") await setPayoutStatus(supa, ord.id, "held");
          }
        }
        // Disputes have evidence deadlines — alert the inbox (best-effort,
        // post-response). Snapshot the fields the callback needs.
        const disputedOrder = ord;
        after(async () => {
          try {
            const inbox = process.env.CONTACT_INBOX || "hello@humblehalal.com";
            const amount = `${String(dispute.currency || "sgd").toUpperCase()} ${((dispute.amount || 0) / 100).toFixed(2)}`;
            await sendEmail({
              to: inbox,
              subject: `⚠️ Stripe dispute opened — ${amount}`,
              template: "dispute-alert",
              html: `<p>A dispute (${dispute.id}) was opened for ${amount}.</p><p>${disputedOrder?.id ? `Ticket order <strong>${disputedOrder.id}</strong>: ${disputedOrder.payout_status === "paid" ? "payout reversal attempted" : "payout held"}.` : "No ticket order matched — likely a plan/ad/donation charge."}</p><p>Respond in the Stripe dashboard before the evidence deadline.</p>`,
            });
          } catch { /* alert best-effort */ }
        });
        break;
      }
      // A PayNow (or other async-method) refund settles LATER and can FAIL —
      // in which case the money bounced back to our balance and the buyer got
      // nothing, while our DB already says "refunded" (the /api/refunds flow
      // flips optimistically). Flag it loudly for a manual make-good; card
      // refunds never fire this.
      case "refund.failed": {
        const refund = event.data.object as Stripe.Refund;
        const pi = typeof refund.payment_intent === "string" ? refund.payment_intent : undefined;
        let orderId: string | null = null;
        if (supa && pi) {
          const { data: ord2 } = await supa.from("orders").select("id").eq("stripe_payment_intent", pi).maybeSingle();
          orderId = (ord2?.id as string) ?? null;
        }
        after(async () => {
          try {
            const inbox = process.env.CONTACT_INBOX || "hello@humblehalal.com";
            const amount = `${String(refund.currency || "sgd").toUpperCase()} ${((refund.amount || 0) / 100).toFixed(2)}`;
            await sendEmail({
              to: inbox,
              subject: `🚨 Refund FAILED — buyer not repaid (${amount})`,
              template: "refund-failed",
              html: `<p>Stripe could not complete refund ${refund.id} for ${amount} (payment ${pi || "unknown"}).${orderId ? ` Ticket order <strong>${orderId}</strong> is marked refunded in the DB but the buyer has NOT received money.` : ""}</p><p>The amount returned to the platform balance — arrange an alternative refund (e.g. PayNow transfer) and reply to the buyer.</p>`,
            });
          } catch { /* alert best-effort */ }
        });
        break;
      }
      // A session that will never fulfil must give back the seats it held at
      // creation: expired = abandoned before paying; async_payment_failed =
      // completed but the delayed payment (PayNow) ultimately failed.
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const m = s.metadata || {};
        if (supa && m.kind === "ticket" && m.reserved === "1" && m.eventId) {
          const qty = Math.max(1, parseInt(m.qty || "1", 10));
          await supa.rpc("decrement_event_taken", { p_event_id: m.eventId, p_qty: qty });
        }
        // Tell the buyer their delayed payment didn't go through (best-effort) —
        // they saw a success-ish redirect at completion, so silence would read
        // as "I have tickets" when they don't.
        if (event.type === "checkout.session.async_payment_failed") {
          const to = s.customer_details?.email || null;
          if (to) {
            // Organiser-supplied title → escape before interpolating into HTML.
            const safeTitle = m.eventTitle ? String(m.eventTitle).replace(/[<>&"]/g, "") : "";
            after(async () => {
              try {
                await sendEmail({
                  to,
                  subject: "Your payment didn't go through",
                  template: "payment-failed",
                  html: `<p>Assalamualaikum,</p><p>Unfortunately your payment${safeTitle ? ` for <strong>${safeTitle}</strong>` : ""} didn't go through, so no tickets were issued and you have not been charged. Your seats have been released — you're welcome to try booking again.</p>`,
                });
              } catch { /* email best-effort */ }
            });
          }
        }
        break;
      }
      case "payment_intent.succeeded":
        // Event-ticket fulfillment (create order + tickets, decrement capacity,
        // email ticket) lands with the Connect Express events build.
        break;
      case "invoice.payment_succeeded":
        // Subscription state is authoritative via customer.subscription.* above.
        break;
      // Renewal charge failed → the plan is KEPT during past_due (dunning
      // grace) while Smart Retries run — but the owner needs to know and fix
      // the card, or the sub eventually cancels and the listing downgrades.
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const businessId = (inv as unknown as { subscription_details?: { metadata?: Record<string, string> } }).subscription_details?.metadata?.business_id
          || inv.metadata?.business_id || undefined;
        if (supa && businessId) {
          // In-app bell (in addition to the retry email) — a failed renewal is
          // the highest-value owner alert: silent churn if they never update the
          // card. dedupe on the invoice so Smart-Retry re-fires don't spam.
          await notifyOwner(supa, businessId, {
            type: "payment_failed",
            title: "Payment failed — update your card",
            body: "We couldn't collect your latest plan payment. Update your card to keep your plan uninterrupted.",
            link: "/owner?tab=billing",
            dedupeKey: `pay_failed:${inv.id}`,
          });
          after(async () => {
            try {
              const owner = await emailForBusinessOwner(supa, businessId);
              const to = owner.email || inv.customer_email || null;
              if (to) {
                await sendEmail({
                  to,
                  subject: "Your Humble Halal payment didn't go through",
                  template: "payment-retry",
                  html: `<p>Assalamualaikum${owner.name ? ` ${owner.name.split(/\s+/)[0]}` : ""},</p><p>We couldn't collect your latest listing-plan payment — your card may have expired. Your listing stays live while we retry over the next few days.</p><p>Please update your card from your dashboard (Billing) to keep your plan uninterrupted.</p>`,
                  businessId,
                });
              }
            } catch { /* email best-effort */ }
          });
        }
        break;
      }
      // Stripe Radar early-fraud warning: the issuer says this charge looks
      // stolen. Refunding BEFORE it becomes a dispute avoids the dispute fee
      // and the strike on the account. Auto-refund only TICKET orders (bounded,
      // idempotent — the refund flows through the normal charge.refunded path
      // to void tickets/capacity/payout); anything else is alerted for a human.
      case "radar.early_fraud_warning.created": {
        const warning = event.data.object as Stripe.Radar.EarlyFraudWarning;
        const pi = typeof warning.payment_intent === "string" ? warning.payment_intent : undefined;
        let action = "no ticket order matched — review manually";
        if (supa && pi && warning.actionable) {
          const { data: ord3 } = await supa.from("orders").select("id, status").eq("stripe_payment_intent", pi).maybeSingle();
          if (ord3?.id && ord3.status === "confirmed") {
            try {
              await stripe.refunds.create({ payment_intent: pi }, { idempotencyKey: `efw_refund_${ord3.id}` });
              action = `ticket order ${ord3.id} auto-refunded pre-dispute`;
            } catch (e) {
              action = `auto-refund FAILED for order ${ord3.id}: ${(e instanceof Error ? e.message : "error").slice(0, 80)}`;
            }
          }
        }
        const efwAction = action;
        after(async () => {
          try {
            const inbox = process.env.CONTACT_INBOX || "hello@humblehalal.com";
            await sendEmail({
              to: inbox,
              subject: "⚠️ Stripe early fraud warning",
              template: "fraud-warning",
              html: `<p>Stripe Radar flagged payment ${pi || warning.charge} as likely fraudulent (${warning.fraud_type || "unknown type"}).</p><p>Action taken: ${efwAction}.</p><p>Review in the Stripe dashboard.</p>`,
            });
          } catch { /* alert best-effort */ }
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Fulfillment failed AFTER we claimed the idempotency key above. Release the
    // claim so Stripe's retry REPROCESSES this event instead of hitting the 23505
    // guard and being acked as a "duplicate" (which would silently drop a paid
    // order/ticket/donation). Fulfillment is upserts + atomic RPCs, so a clean
    // reprocess on retry is safe. Log it — a failed paid-event fulfillment was
    // previously invisible (only surfaced as a stuck Stripe retry).
    console.error(`[stripe-webhook] fulfillment failed for ${event.type} (${event.id}):`, err instanceof Error ? err.message : err);
    if (supa) {
      try {
        await supa.from("webhook_events").delete().eq("stripe_event_id", event.id);
      } catch (delErr) {
        console.error(`[stripe-webhook] could not release idempotency claim for ${event.id} — Stripe retry may be acked as duplicate:`, delErr instanceof Error ? delErr.message : delErr);
      }
    }
    return NextResponse.json({ ok: false }, { status: 500 }); // Stripe will retry
  }

  return NextResponse.json({ ok: true });
}
