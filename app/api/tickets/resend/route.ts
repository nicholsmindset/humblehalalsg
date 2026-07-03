import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { ticketResendEmail } from "@/lib/emails/templates";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Resend the signed-in user's tickets to their own email — each as a link to
   its /tickets/[id] page (which renders the scannable QR). Eventbrite-style
   "email me my tickets". Auth-scoped to the caller's own orders; only `valid`
   tickets are sent. Graceful (simulated) without Supabase/Resend configured. */

export async function POST(req: Request) {
  // Each call sends a real email — cap per IP so a signed-in user can't loop it
  // into Resend-quota burn.
  const rl = await rateLimit(req, "ticket-resend", 5, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
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

  const tickets = valid.map((t) => {
    const title = t.event_id ? titles.get(t.event_id) || "Event" : "Event";
    const raw = String(t.qr_ref || "");
    // New human refs (HH-…) go out whole — they're what the door accepts.
    // Legacy UUID refs shorten to the 8-char prefix check-in resolves.
    const ref = raw.startsWith("HH-") ? raw : raw.slice(0, 8).toUpperCase();
    return { title, ref };
  });

  const { subject, html } = ticketResendEmail({ tickets });
  const r = await sendEmail({
    to: email,
    subject,
    template: "ticket-resend",
    html,
  });
  return NextResponse.json({ ok: r.ok, simulated: r.simulated, count: valid.length });
}
