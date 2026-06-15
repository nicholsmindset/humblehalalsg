import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

/* Organiser event management — edit + cancel. Authorised for the event's
   business owner or an admin. Cancel is a soft status flip (preserves orders)
   and best-effort emails ticket holders. */

async function authorize(eventId: string) {
  const server = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!server || !admin) return { error: NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 }) };
  const { data: { user } } = await server.auth.getUser();
  if (!user) return { error: NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 }) };
  const { data: ev } = await admin.from("events").select("id, business_id, status, display, slug").eq("id", eventId).maybeSingle();
  if (!ev) return { error: NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 }) };
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  let ok = profile?.role === "admin";
  if (!ok && ev.business_id) {
    const { data: biz } = await admin.from("businesses").select("id").eq("id", ev.business_id)
      .or(`owner_id.eq.${user.id},claimed_by.eq.${user.id}`).maybeSingle();
    ok = !!biz;
  }
  if (!ok) return { error: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };
  return { admin, ev, userId: user.id };
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

  // Refund paid orders for this event (best-effort). The charge.refunded webhook
  // also reverses them, so this is idempotent enough for a cancellation.
  try {
    const stripe = getStripe();
    const { data: paid } = await admin
      .from("orders").select("id, stripe_payment_intent")
      .eq("event_id", id).gt("amount_cents", 0).neq("status", "refunded");
    for (const o of paid || []) {
      if (stripe && o.stripe_payment_intent) {
        await stripe.refunds.create({ payment_intent: o.stripe_payment_intent as string }).catch(() => {});
      }
      await admin.from("orders").update({ status: "refunded", payout_status: "none" }).eq("id", o.id);
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

  return NextResponse.json({ ok: true, cancelled: true });
}
