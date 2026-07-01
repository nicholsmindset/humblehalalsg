import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";
import { revalidatePublic } from "@/lib/revalidate";

/* Organiser event management — edit + cancel. Authorised for the event's
   business owner or an admin. Cancel is a soft status flip (preserves orders)
   and best-effort emails ticket holders. */

async function authorize(eventId: string) {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  if (!admin) return { error: NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 }) };
  const { data: ev } = await admin.from("events").select("id, business_id, status, display, slug").eq("id", eventId).maybeSingle();
  if (!ev) return { error: NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 }) };
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  let ok = profile?.role === "admin";
  if (!ok && ev.business_id) {
    const { data: biz } = await admin.from("businesses").select("id").eq("id", ev.business_id)
      .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
    ok = !!biz;
  }
  if (!ok) return { error: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };
  return { admin, ev, userId };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorize(id);
  if (a.error) return a.error;
  const { admin, ev } = a;

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }

  const patch: Record<string, unknown> = {};
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim();
  if (typeof b.capacity === "number") patch.capacity = Math.max(0, b.capacity);
  if (b.status === "draft" || b.status === "published" || b.status === "cancelled") patch.status = b.status;
  // Merge display patch (venue, dateLabel, blurb, Islamic fields, etc.) without clobbering.
  if (b.display && typeof b.display === "object") {
    const cur = (ev.display && typeof ev.display === "object" ? ev.display : {}) as Record<string, unknown>;
    patch.display = { ...cur, ...(b.display as Record<string, unknown>) };
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, reason: "nothing_to_update" }, { status: 422 });

  const { error } = await admin.from("events").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, reason: "update_failed" }, { status: 500 });
  revalidatePublic(["/events"]);
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
        .from("orders").select("id, stripe_payment_intent")
        .eq("event_id", id).gt("amount_cents", 0).neq("status", "refunded");
      for (const o of paid || []) {
        if (!o.stripe_payment_intent) continue;
        try {
          await stripe.refunds.create(
            { payment_intent: o.stripe_payment_intent as string },
            { idempotencyKey: `refund_order_${o.id}` },
          );
          await admin.from("orders").update({ status: "refunded", payout_status: "none" }).eq("id", o.id);
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
    for (const to of emails.slice(0, 500)) {
      await sendEmail({
        to,
        subject: "An event you booked has been cancelled",
        template: "event-cancelled",
        html: `<p>We’re sorry — <strong>${String(title)}</strong> has been cancelled by the organiser. Any paid tickets will be refunded. Jazākallāhu khayran for your understanding.</p>`,
      }).catch(() => {});
    }
  } catch { /* notifications best-effort */ }

  revalidatePublic(["/events"]);
  return NextResponse.json({ ok: true, cancelled: true });
}
