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

  // Escape ilike wildcards so a typed code can't turn into a pattern match.
  const esc = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);
  type TicketRow = { id: string; status: string; event_id: string | null; order_id: string | null; tier: string | null; checked_in_at: string | null };
  const SELECT = "id, status, event_id, order_id, tier, checked_in_at";

  // Resolve the ticket generously — door staff type what the email shows:
  //  1. exact qr_ref (QR scan payload / new HH-XXX-YYYYYY refs)
  //  2. case-insensitive match (typed in the wrong case)
  //  3. order reference (HH-RSVP-ABC123 for a multi-ticket order whose tickets
  //     are -1…-n): admit the order's next unused ticket per entry
  //  4. legacy 8-char prefix from old resend emails (UUID qr_refs)
  let t: TicketRow | null = null;
  {
    const { data } = await admin.from("tickets").select(SELECT).eq("qr_ref", qrRef).maybeSingle();
    t = (data as TicketRow | null) ?? null;
  }
  if (!t) {
    const { data } = await admin.from("tickets").select(SELECT).ilike("qr_ref", esc(qrRef)).limit(2);
    if (data?.length === 1) t = data[0] as TicketRow;
  }
  if (!t && /^HH-(RSVP|TKT)-[A-Z0-9]+$/i.test(qrRef)) {
    const { data } = await admin
      .from("tickets").select(SELECT)
      .ilike("qr_ref", `${esc(qrRef)}-%`)
      .order("qr_ref")
      .limit(20);
    const group = (data as TicketRow[] | null) || [];
    t = group.find((x) => x.status === "valid") || group[0] || null;
  }
  if (!t && /^[0-9A-F]{8}$/i.test(qrRef)) {
    const { data } = await admin.from("tickets").select(SELECT).ilike("qr_ref", `${esc(qrRef)}%`).limit(2);
    if (data?.length === 1) t = data[0] as TicketRow;
  }
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
