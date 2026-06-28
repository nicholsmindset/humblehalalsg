import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/* Resend the signed-in user's tickets to their own email — each as a link to
   its /tickets/[id] page (which renders the scannable QR). Eventbrite-style
   "email me my tickets". Auth-scoped to the caller's own orders; only `valid`
   tickets are sent. Graceful (simulated) without Supabase/Resend configured. */

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export async function POST() {
  const { userId } = await auth();
  const cu = await currentUser();
  const email = cu?.primaryEmailAddress?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress ?? "";
  if (!userId || !email) return NextResponse.json({ ok: false, reason: "not_signed_in" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "unavailable" }, { status: 503 });

  const { data: orders } = await admin
    .from("orders")
    .select("id")
    .or(`buyer_user_id.eq.${userId},buyer_email.eq.${email}`);
  const orderIds = (orders || []).map((o) => o.id as string);
  if (!orderIds.length) return NextResponse.json({ ok: false, reason: "no_tickets" }, { status: 404 });

  const { data: tix } = await admin
    .from("tickets")
    .select("id, qr_ref, tier, status, event_id, created_at")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false })
    .limit(100);
  const valid = (tix || []).filter((t) => t.status === "valid");
  if (!valid.length) return NextResponse.json({ ok: false, reason: "no_tickets" }, { status: 404 });

  const eventIds = [...new Set(valid.map((t) => t.event_id).filter(Boolean))] as string[];
  const titles = new Map<string, string>();
  if (eventIds.length) {
    const { data: evs } = await admin.from("events").select("id, title").in("id", eventIds);
    for (const e of evs || []) titles.set(e.id as string, String(e.title || "Event"));
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.humblehalal.com";
  const rows = valid
    .map((t) => {
      const title = t.event_id ? titles.get(t.event_id) || "Event" : "Event";
      const url = `${base}/tickets/${t.id}`;
      const code = String(t.qr_ref || "").slice(0, 8).toUpperCase();
      return `<tr><td style="padding:12px 0;border-bottom:1px solid #eee;"><strong>${esc(title)}</strong><br><span style="color:#667;font-size:14px;">${esc(t.tier || "Ticket")} &middot; ref ${esc(code)}</span><br><a href="${url}" style="color:#0F5C4A;font-weight:600;">Open ticket &amp; QR &rarr;</a></td></tr>`;
    })
    .join("");

  const html = `<h2 style="font-family:Georgia,serif;color:#0F5C4A;">Your ticket${valid.length > 1 ? "s" : ""} &#127915;</h2>
<p>Open a ticket on your phone and show the QR at the door.</p>
<table style="width:100%;border-collapse:collapse;max-width:520px;">${rows}</table>
<p style="color:#889;font-size:13px;margin-top:18px;">Tickets are tied to your Humble Halal account &mdash; sign in on your phone to view the QR.</p>`;

  const r = await sendEmail({
    to: email,
    subject: `Your ticket${valid.length > 1 ? "s" : ""} — Humble Halal`,
    template: "ticket-resend",
    html,
  });
  return NextResponse.json({ ok: r.ok, simulated: r.simulated, count: valid.length });
}
