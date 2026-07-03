import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { makeOrderRef, ticketRefs } from "@/lib/ticket-ref";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { joinApprovedEmail, joinDeclinedEmail } from "@/lib/emails/templates";

/* Organiser view of join requests for an approval-gated event, plus approve /
   decline. A join request = a free pending order (status='pending',
   amount_cents=0). Approve → order 'confirmed' + issue tickets + bump taken.
   Decline → 'cancelled'. Authorised for the event's business owner or an admin
   (mirrors /api/tickets/checkin). Zero migration. */

type AuthOk = { ok: true; admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>; ev: { id: string; business_id: string | null; title: string } };
type AuthErr = { ok: false; res: NextResponse };

async function authorise(eventRef: string): Promise<AuthOk | AuthErr> {
  const { userId } = await auth();
  if (!userId) return { ok: false, res: NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, res: NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 }) };
  const { data: ev } = await admin.from("events").select("id, business_id, title").or(`id.eq.${eventRef},slug.eq.${eventRef}`).maybeSingle();
  if (!ev) return { ok: false, res: NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 }) };
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  let allowed = profile?.role === "admin";
  if (!allowed && ev.business_id) {
    const { data: biz } = await admin.from("businesses").select("id").eq("id", ev.business_id as string).or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
    allowed = !!biz;
  }
  if (!allowed) return { ok: false, res: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };
  return { ok: true, admin, ev: { id: ev.id as string, business_id: (ev.business_id as string) ?? null, title: (ev.title as string) || "your event" } };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorise(id);
  if (!a.ok) return a.res;
  const { data: orders } = await a.admin
    .from("orders")
    .select("id, buyer_name, buyer_email, qty, created_at")
    .eq("event_id", a.ev.id).eq("status", "pending").eq("amount_cents", 0)
    .order("created_at", { ascending: true }).limit(200);
  const requests = (orders || []).map((o) => ({ id: o.id as string, name: (o.buyer_name as string) || "Guest", email: (o.buyer_email as string) || "", qty: Number(o.qty) || 1, at: o.created_at }));
  return NextResponse.json({ ok: true, event: a.ev.title, requests });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorise(id);
  if (!a.ok) return a.res;
  const { admin, ev } = a;

  const body = (await req.json().catch(() => ({}))) as { orderId?: string; action?: string };
  const orderId = String(body.orderId || "");
  const action = body.action === "approve" ? "approve" : body.action === "decline" ? "decline" : "";
  if (!orderId || !action) return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });

  const { data: ord } = await admin.from("orders").select("id, event_id, qty, status, amount_cents, buyer_email").eq("id", orderId).maybeSingle();
  if (!ord || ord.event_id !== ev.id || ord.status !== "pending" || (Number(ord.amount_cents) || 0) !== 0) {
    return NextResponse.json({ ok: false, reason: "not_a_pending_request" }, { status: 404 });
  }
  const qty = Math.max(1, Number(ord.qty) || 1);
  const buyerEmail = (ord.buyer_email as string) || "";

  if (action === "decline") {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
    if (buyerEmail) {
      const { subject, html } = joinDeclinedEmail({ eventTitle: ev.title });
      await sendEmail({
        to: buyerEmail, template: "join-declined",
        subject,
        html,
      });
    }
    return NextResponse.json({ ok: true, action: "declined" });
  }

  // approve → confirm the order, issue tickets, bump taken
  const { error: uErr } = await admin.from("orders").update({ status: "confirmed" }).eq("id", orderId).eq("status", "pending");
  if (uErr) return NextResponse.json({ ok: false, reason: "update_failed" }, { status: 500 });
  // Human-friendly qr_refs (lib/ticket-ref) — same format as direct RSVPs.
  let approvedRef = makeOrderRef("RSVP");
  for (let attempt = 0; attempt < 3; attempt++) {
    const tix = ticketRefs(approvedRef, qty).map((qr) => ({ order_id: orderId, event_id: ev.id, tier: "RSVP", qr_ref: qr }));
    const { error: tixErr } = await admin.from("tickets").insert(tix);
    if (!tixErr) break;
    if (tixErr.code !== "23505" || attempt === 2) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
    approvedRef = makeOrderRef("RSVP");
  }
  const { error: incErr } = await admin.rpc("increment_event_taken", { p_event_id: ev.id, p_qty: qty });
  if (incErr) {
    const { data: e2 } = await admin.from("events").select("taken").eq("id", ev.id).maybeSingle();
    await admin.from("events").update({ taken: (Number(e2?.taken) || 0) + qty }).eq("id", ev.id);
  }
  if (buyerEmail) {
    const { subject, html } = joinApprovedEmail({ eventTitle: ev.title });
    await sendEmail({
      to: buyerEmail, template: "join-approved",
      subject,
      html,
    });
  }
  return NextResponse.json({ ok: true, action: "approved" });
}
