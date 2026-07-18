import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { eventCancelledEmail } from "@/lib/emails/templates";
import { getStripe } from "@/lib/stripe";
import { reverseOrderTransferIfPaid } from "@/lib/payout-reversal";
import { revalidatePublic } from "@/lib/revalidate";
import { recordRedirect, clearRedirect, eventRedirectTarget } from "@/lib/gone-redirects";

/** Best relevant /events hub for an event's own category/area (in `display`). */
function eventHub(display: unknown): string {
  const d = (display && typeof display === "object" ? display : {}) as Record<string, unknown>;
  return eventRedirectTarget(typeof d.catId === "string" ? d.catId : "community", typeof d.area === "string" ? d.area : "");
}

/* Organiser event management — edit + cancel. Authorised for the event's
   business owner or an admin. Cancel is a soft status flip (preserves orders)
   and best-effort emails ticket holders. */

async function authorize(eventId: string) {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  if (!admin) return { error: NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 }) };
  const { data: ev } = await admin.from("events").select("id, business_id, submitted_by, status, display, slug, is_free").eq("id", eventId).maybeSingle();
  if (!ev) return { error: NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 }) };
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  const isAdmin = profile?.role === "admin";
  let ok = isAdmin || ev.submitted_by === userId;
  if (!ok && ev.business_id) {
    const { data: biz } = await admin.from("businesses").select("id").eq("id", ev.business_id)
      .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
    ok = !!biz;
  }
  if (!ok) return { error: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };
  return { admin, ev, userId, isAdmin };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorize(id);
  if (a.error) return a.error;
  const { admin, ev, isAdmin } = a;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }

  const patch: Record<string, unknown> = {};
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim();
  if (typeof b.capacity === "number") patch.capacity = Math.max(0, b.capacity);
  if (typeof b.date_iso === "string" || b.date_iso === null) patch.date_iso = b.date_iso ? String(b.date_iso).slice(0, 40) : null;
  // Pricing mode can be changed while a submission is pending/draft. Once live,
  // changing free ↔ paid would invalidate existing orders and ticket tiers.
  if (typeof b.is_free === "boolean" && ["pending", "draft"].includes(String(ev.status))) patch.is_free = b.is_free;
  // Moderation state is admin-owned. Previously an organiser could PATCH
  // status="published" and bypass the review queue entirely.
  if (isAdmin && (b.status === "draft" || b.status === "published" || b.status === "cancelled")) patch.status = b.status;
  // Merge display patch (venue, dateLabel, blurb, Islamic fields, etc.) without clobbering.
  if (b.display && typeof b.display === "object") {
    const cur = (ev.display && typeof ev.display === "object" ? ev.display : {}) as Record<string, unknown>;
    const incoming = b.display as Record<string, unknown>;
    const allowed = ["catId", "cat", "blurb", "venue", "area", "dateLabel", "timeLabel", "endTime", "organiser", "img", "prayerNearby", "halalCatering", "prayerSlotNote", "genderArrangement", "seatingNote", "refundPolicy", "donationEnabled", "requiresApproval", "feeMode"];
    const displayPatch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (!(key in incoming)) continue;
      const value = incoming[key];
      if (typeof value === "boolean") displayPatch[key] = value;
      else if (value === null) displayPatch[key] = null;
      else if (typeof value === "string") displayPatch[key] = value.slice(0, key === "blurb" ? 4000 : 500);
    }
    if ("priceFrom" in incoming && Number.isFinite(Number(incoming.priceFrom))) displayPatch.priceFrom = Math.max(0, Number(incoming.priceFrom));
    patch.display = { ...cur, ...displayPatch };
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, reason: "nothing_to_update" }, { status: 422 });

  const { error } = await admin.from("events").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, reason: "update_failed" }, { status: 500 });
  // Status change → keep the durable 301 in sync (draft/cancelled = gone → hub).
  if (patch.status && ev.slug) {
    if (patch.status === "published") await clearRedirect(`/events/${ev.slug}`);
    else await recordRedirect(`/events/${ev.slug}`, eventHub(ev.display), "event");
  }
  // Pending paid-event tiers are safe to replace because no orders have been
  // issued yet. Once published, prices/quantities remain immutable here.
  if (["pending", "draft"].includes(String(ev.status)) && Array.isArray(b.tiers)) {
    const tiers = b.tiers.slice(0, 8).map((item) => {
      const tier = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        event_id: id,
        name: String(tier.name || "Ticket").trim().slice(0, 80) || "Ticket",
        price_cents: Math.max(0, Math.round(Number(tier.price) * 100) || 0),
        qty: Math.max(0, Math.round(Number(tier.qty) || Number(b.capacity) || 0)),
        sold: 0,
      };
    }).filter((tier) => tier.name);
    const { error: deleteError } = await admin.from("ticket_tiers").delete().eq("event_id", id).eq("sold", 0);
    if (!deleteError && tiers.length) {
      const { error: tierError } = await admin.from("ticket_tiers").insert(tiers);
      if (tierError) return NextResponse.json({ ok: false, reason: "tier_update_failed" }, { status: 500 });
    }
  }
  // Include the detail page — without it, edits/cancellations served stale
  // ISR HTML until the hourly revalidate (previously: until the next deploy).
  revalidatePublic(["/events", ...(ev.slug ? [`/events/${ev.slug}`] : [`/events/${id}`])]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorize(id);
  if (a.error) return a.error;
  const { admin } = a;

  // Soft-cancel: flip status, invalidate unused tickets, notify holders.
  const { error } = await admin.from("events").update({ status: "cancelled" }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, reason: "cancel_failed" }, { status: 500 });
  // Cancelled event is gone from public surfaces → 301 its URL to a relevant hub.
  if (a.ev.slug) await recordRedirect(`/events/${a.ev.slug}`, eventHub(a.ev.display), "event");
  await admin.from("tickets").update({ status: "cancelled" }).eq("event_id", id).eq("status", "valid");

  // Refund paid orders + donations for this event. We only mark a row refunded
  // when Stripe actually reverses the charge — never optimistically — so the DB
  // can't claim "refunded" while the customer's money is still held. The
  // charge.refunded webhook reverses tickets/capacity; idempotency keys make a
  // double-fire (cancel + manual refund) safe.
  try {
    const stripe = getStripe();
    if (stripe) {
      const { data: paid } = await admin
        .from("orders").select("id, stripe_payment_intent, payout_status, stripe_transfer_id")
        .eq("event_id", id).gt("amount_cents", 0).neq("status", "refunded");
      for (const o of paid || []) {
        if (!o.stripe_payment_intent) continue;
        try {
          await stripe.refunds.create(
            { payment_intent: o.stripe_payment_intent as string },
            { idempotencyKey: `refund_order_${o.id}` },
          );
          await admin.from("orders").update({ status: "refunded" }).eq("id", o.id);
          // A late cancellation can land AFTER the 24h payout ran — claw the
          // organiser transfer back, or the platform refunds buyers while the
          // organiser keeps the money.
          const reversal = await reverseOrderTransferIfPaid(stripe, admin, o);
          if (reversal === "not_needed") await admin.from("orders").update({ payout_status: "none" }).eq("id", o.id);
        } catch (err) {
          console.error("event-cancel: order refund failed", o.id, err);
        }
      }

      // Refund zakat/sadaqah donations too, then reset the public running total.
      const { data: dons } = await admin
        .from("donations").select("id, stripe_payment_intent")
        .eq("event_id", id).eq("status", "paid");
      let anyDonationRefunded = false;
      for (const d of dons || []) {
        if (!d.stripe_payment_intent) continue;
        try {
          await stripe.refunds.create(
            { payment_intent: d.stripe_payment_intent as string },
            { idempotencyKey: `refund_donation_${d.id}` },
          );
          await admin.from("donations").update({ status: "refunded" }).eq("id", d.id);
          anyDonationRefunded = true;
        } catch (err) {
          console.error("event-cancel: donation refund failed", d.id, err);
        }
      }
      if (anyDonationRefunded) {
        const cur = (a.ev.display && typeof a.ev.display === "object" ? a.ev.display : {}) as Record<string, unknown>;
        await admin.from("events").update({ display: { ...cur, donationRaisedCents: 0 } }).eq("id", id);
      }
    }
  } catch { /* refunds best-effort */ }

  // Email ticket holders (best-effort).
  try {
    const { data: orders } = await admin.from("orders").select("buyer_email").eq("event_id", id).not("buyer_email", "is", null);
    const emails = [...new Set((orders || []).map((o) => o.buyer_email as string).filter(Boolean))];
    const title = (a.ev.display as Record<string, unknown>)?.title || "the event";
    const { subject, html } = eventCancelledEmail({ eventTitle: String(title), refunded: true });
    for (const to of emails.slice(0, 500)) {
      await sendEmail({
        to,
        subject,
        template: "event-cancelled",
        html,
      }).catch(() => {});
    }
  } catch { /* notifications best-effort */ }

  revalidatePublic(["/events", ...(a.ev.slug ? [`/events/${a.ev.slug}`] : [`/events/${id}`])]);
  return NextResponse.json({ ok: true, cancelled: true });
}
