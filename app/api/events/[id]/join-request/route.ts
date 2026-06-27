import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { getEvent } from "@/lib/data";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { isSafeEventRef } from "@/lib/event-ref";

/* "Request to join" for an approval-gated event. Creates a PENDING order (no
   tickets, no taken++) the organiser later approves/declines. Zero-migration:
   a join request is a free pending order (status='pending', amount_cents=0). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = await rateLimit(req, "rsvp", 10, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; qty?: number };
  if (body.email && !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ ok: false, reason: "bad_email" }, { status: 422 });
  }
  const qty = Math.max(1, Math.min(10, Number(body.qty) || 1));

  const admin = getSupabaseAdmin();
  const mockEv = getEvent(id);
  if (!admin) {
    if (!mockEv) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, simulated: true, requested: true });
  }

  const { data: row } = isSafeEventRef(id)
    ? await admin.from("events").select("id, business_id").or(`id.eq.${id},slug.eq.${id}`).maybeSingle()
    : { data: null };
  if (!row) {
    if (!mockEv) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, simulated: true, requested: true });
  }

  // Link the requester's account when signed in, so they see the approved ticket.
  let userId: string | null = null;
  let authEmail: string | null = null;
  try {
    const server = await getSupabaseServer();
    const res = server ? await server.auth.getUser() : { data: { user: null } };
    userId = res.data.user?.id ?? null;
    authEmail = res.data.user?.email ?? null;
  } catch { /* anonymous is fine */ }

  const { error } = await admin.from("orders").insert({
    event_id: row.id,
    business_id: (row.business_id as string) ?? null,
    buyer_email: body.email || authEmail,
    buyer_name: body.name ?? null,
    buyer_user_id: userId,
    amount_cents: 0,
    fee_cents: 0,
    qty,
    status: "pending", // free pending order = a join request awaiting approval
    payout_status: "none",
  });
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true, requested: true });
}
