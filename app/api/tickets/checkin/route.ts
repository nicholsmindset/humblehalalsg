import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Check a ticket in at the door (QR scan). Flips a 'valid' ticket → 'used' and
   records who/when. Authorised for the event organiser (the business owner) or
   an admin. Re-scans of a used/refunded/cancelled ticket are rejected so a code
   can't be reused. Degrades to simulated when the backend isn't configured. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "checkin", 600, 3600); if (!rl.ok) return tooMany(rl.retryAfter);

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let body: { qrRef?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }
  const qrRef = String(body.qrRef || "").trim();
  if (!qrRef) return NextResponse.json({ ok: false, reason: "no_code" }, { status: 422 });

  // Load the ticket + its event/order context.
  const { data: t } = await admin
    .from("tickets")
    .select("id, status, event_id, order_id, tier, checked_in_at")
    .eq("qr_ref", qrRef)
    .maybeSingle();
  if (!t) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  // Authorise: admin OR the owner of the event's business.
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  const isAdmin = profile?.role === "admin";
  let authorised = isAdmin;
  if (!authorised && t.event_id) {
    const { data: ev } = await admin.from("events").select("business_id").eq("id", t.event_id).maybeSingle();
    if (ev?.business_id) {
      const { data: biz } = await admin
        .from("businesses").select("id").eq("id", ev.business_id)
        .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
      authorised = !!biz;
    }
  }
  if (!authorised) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  if (t.status === "used") {
    return NextResponse.json({ ok: false, reason: "already_used", checkedInAt: t.checked_in_at, tier: t.tier });
  }
  if (t.status !== "valid") {
    return NextResponse.json({ ok: false, reason: t.status }); // refunded / cancelled
  }

  // Resolve buyer name for the door (best-effort, from the order).
  const { data: ord } = await admin.from("orders").select("buyer_name, buyer_email").eq("id", t.order_id).maybeSingle();

  const { error } = await admin
    .from("tickets")
    .update({ status: "used", checked_in_at: new Date().toISOString(), checked_in_by: userId })
    .eq("id", t.id)
    .eq("status", "valid"); // guard against a concurrent double-scan
  if (error) return NextResponse.json({ ok: false, reason: "update_failed" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    tier: t.tier || "Ticket",
    attendee: ord?.buyer_name || ord?.buyer_email || "Guest",
  });
}
