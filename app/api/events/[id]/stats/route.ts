import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSafeEventRef } from "@/lib/event-ref";

/* Organiser command-center stats for one event: attendance, check-in, sales,
   payout, requests, tier breakdown + bookings-over-time. Owner/admin only.
   Aggregates orders + tickets in JS — zero migration (all derivable from
   existing columns). Accepts an event id OR slug. */

type AuthOk = {
  ok: true;
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>;
  ev: { id: string; title: string; slug: string; status: string; capacity: number; is_free: boolean; date_iso: string | null; requiresApproval: boolean };
};
type AuthErr = { ok: false; res: NextResponse };

async function authorise(ref: string): Promise<AuthOk | AuthErr> {
  const { userId } = await auth();
  if (!userId) return { ok: false, res: NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, res: NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 }) };
  const { data: ev } = isSafeEventRef(ref)
    ? await admin.from("events").select("id, title, slug, status, capacity, is_free, date_iso, business_id, submitted_by, display").or(`id.eq.${ref},slug.eq.${ref}`).maybeSingle()
    : { data: null };
  if (!ev) return { ok: false, res: NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 }) };
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  let allowed = profile?.role === "admin" || ev.submitted_by === userId;
  if (!allowed && ev.business_id) {
    const { data: biz } = await admin.from("businesses").select("id").eq("id", ev.business_id as string).or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
    allowed = !!biz;
  }
  if (!allowed) return { ok: false, res: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };
  const d = (ev.display && typeof ev.display === "object" ? ev.display : {}) as Record<string, unknown>;
  return {
    ok: true, admin,
    ev: { id: ev.id as string, title: (ev.title as string) || "Event", slug: (ev.slug as string) || (ev.id as string), status: (ev.status as string) || "", capacity: Number(ev.capacity) || 0, is_free: !!ev.is_free, date_iso: (ev.date_iso as string) ?? null, requiresApproval: d.requiresApproval === true },
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authorise(id);
  if (!a.ok) return a.res;
  const { admin, ev } = a;

  const { data: orders } = await admin
    .from("orders")
    .select("id, qty, amount_cents, fee_cents, net_cents, status, payout_status, payout_due, created_at")
    .eq("event_id", ev.id).limit(10000);
  const { data: tix } = await admin.from("tickets").select("tier, status").eq("event_id", ev.id).limit(10000);

  const ords = orders || [];
  const confirmed = ords.filter((o) => o.status === "confirmed");
  const booked = confirmed.reduce((s, o) => s + (Number(o.qty) || 0), 0);
  const grossCents = confirmed.reduce((s, o) => s + (Number(o.amount_cents) || 0), 0);
  const feeCents = confirmed.reduce((s, o) => s + (Number(o.fee_cents) || 0), 0);
  const netCents = confirmed.reduce((s, o) => s + (Number(o.net_cents) || 0), 0);
  const refundedCents = ords.filter((o) => o.status === "refunded").reduce((s, o) => s + (Number(o.amount_cents) || 0), 0);
  const pendingRequests = ords.filter((o) => o.status === "pending" && (Number(o.amount_cents) || 0) === 0).reduce((s, o) => s + (Number(o.qty) || 0), 0);

  const tk = tix || [];
  const issued = tk.length;
  const checkedIn = tk.filter((t) => t.status === "used").length;
  const valid = tk.filter((t) => t.status === "valid").length;
  const refunded = tk.filter((t) => t.status === "refunded").length;
  const cancelled = tk.filter((t) => t.status === "cancelled").length;

  const tierMap = new Map<string, { issued: number; checkedIn: number }>();
  for (const t of tk) {
    const key = (t.tier as string) || "Ticket";
    const cur = tierMap.get(key) || { issued: 0, checkedIn: 0 };
    cur.issued += 1;
    if (t.status === "used") cur.checkedIn += 1;
    tierMap.set(key, cur);
  }
  const tiers = [...tierMap.entries()].map(([tier, v]) => ({ tier, ...v }));

  const dayMap = new Map<string, number>();
  for (const o of confirmed) {
    const day = String(o.created_at || "").slice(0, 10);
    if (day) dayMap.set(day, (dayMap.get(day) || 0) + (Number(o.qty) || 0));
  }
  const series = [...dayMap.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([day, bookings]) => ({ day, bookings }));

  // Worst-case payout status across confirmed orders + earliest due date.
  const rank = ["paid", "none", "skipped", "pending", "failed"];
  let payoutStatus = "none";
  for (const o of confirmed) {
    const ps = String(o.payout_status || "none");
    if (rank.indexOf(ps) > rank.indexOf(payoutStatus)) payoutStatus = ps;
  }
  const dueDate = (confirmed.map((o) => o.payout_due).filter(Boolean) as string[]).sort()[0] || null;

  const capacity = ev.capacity;
  const pctCapacity = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;

  return NextResponse.json({
    ok: true,
    event: { id: ev.id, title: ev.title, slug: ev.slug, status: ev.status, capacity, is_free: ev.is_free, date_iso: ev.date_iso, requiresApproval: ev.requiresApproval },
    tickets: { issued, checkedIn, noShows: valid, valid, refunded, cancelled },
    attendance: { booked, capacity, pctCapacity },
    sales: { grossCents, feeCents, netCents, refundedCents, payout: { status: payoutStatus, dueDate } },
    requests: { pending: pendingRequests },
    tiers,
    series,
  });
}
