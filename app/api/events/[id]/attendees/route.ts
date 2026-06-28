import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Organiser attendee roster for an event (orders + ticket check-in status).
   Owner/admin only. ?format=csv streams a spreadsheet for the door list. */

async function authorize(eventId: string) {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  if (!admin) return { error: NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 }) };
  const { data: ev } = await admin.from("events").select("id, business_id, title").eq("id", eventId).maybeSingle();
  if (!ev) return { error: NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 }) };
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  let ok = profile?.role === "admin";
  if (!ok && ev.business_id) {
    const { data: biz } = await admin.from("businesses").select("id").eq("id", ev.business_id)
      .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
    ok = !!biz;
  }
  if (!ok) return { error: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };
  return { admin, ev };
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorize(id);
  if (a.error) return a.error;
  const { admin, ev } = a;

  const { data: orders } = await admin
    .from("orders")
    .select("id, buyer_name, buyer_email, qty, amount_cents, status, created_at, stripe_payment_intent")
    .eq("event_id", id)
    .order("created_at", { ascending: true })
    .limit(10000); // cap the roster export so a huge event can't exhaust memory

  const { data: tix } = await admin
    .from("tickets").select("order_id, tier, status, checked_in_at").eq("event_id", id);
  const byOrder = new Map<string, { total: number; used: number; tier: string; checkedInAt: string | null }>();
  for (const t of tix || []) {
    const k = String(t.order_id);
    const cur = byOrder.get(k) || { total: 0, used: 0, tier: (t.tier as string) || "", checkedInAt: null };
    cur.total += 1;
    if (t.status === "used") cur.used += 1;
    cur.tier = (t.tier as string) || cur.tier;
    const ci = t.checked_in_at ? String(t.checked_in_at) : null;
    if (ci && (!cur.checkedInAt || ci > cur.checkedInAt)) cur.checkedInAt = ci; // latest scan in the order
    byOrder.set(k, cur);
  }

  const rows = (orders || []).map((o) => {
    const tk = byOrder.get(String(o.id)) || { total: o.qty || 0, used: 0, tier: "", checkedInAt: null };
    return {
      name: o.buyer_name || "Guest",
      email: o.buyer_email || "",
      qty: o.qty || tk.total || 1,
      tier: tk.tier || (o.amount_cents ? "Paid" : "RSVP"),
      orderStatus: o.status,
      checkedIn: `${tk.used}/${tk.total || o.qty || 1}`,
      checkedInAt: tk.checkedInAt,
      amount: ((o.amount_cents || 0) / 100).toFixed(2),
      bookedAt: o.created_at,
    };
  });

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "csv") {
    const header = ["Name", "Email", "Qty", "Tier", "Order status", "Checked in", "Checked in at", "Amount (SGD)", "Booked at"];
    const body = rows.map((r) => [r.name, r.email, r.qty, r.tier, r.orderStatus, r.checkedIn, r.checkedInAt || "", r.amount, r.bookedAt].map(csvCell).join(","));
    const csv = [header.map(csvCell).join(","), ...body].join("\n");
    const fname = `attendees-${String(ev.title || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.csv`;
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${fname}"` },
    });
  }

  const totalBooked = rows.reduce((s, r) => s + Number(r.qty), 0);
  return NextResponse.json({ ok: true, event: { title: ev.title }, totalBooked, attendees: rows });
}
