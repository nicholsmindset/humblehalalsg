import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getEvent } from "@/lib/data";
import { rowToEvent } from "@/lib/events-source";
import { isSafeEventRef } from "@/lib/event-ref";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { validatePromoCode, PROMO_MESSAGES } from "@/lib/promo";

/* Live promo-code preview for the checkout screen. Advisory only — the ticket
   route re-validates and recomputes the discount at session creation, so a
   stale/forged preview can never change what is charged. Rate-limited to keep
   code enumeration impractical. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "validate-promo", 30, 600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const body = (await req.json().catch(() => ({}))) as { eventId?: string; code?: string; tier?: string; qty?: number };
  const eventId = String(body.eventId || "");
  const qty = Math.max(1, Math.min(20, Number(body.qty) || 1));

  const supa = getSupabaseAdmin();
  if (!supa) return NextResponse.json({ ok: false, reason: "not_configured", message: "Promo codes aren't available right now." });

  let ev = getEvent(eventId);
  if (!ev && isSafeEventRef(eventId)) {
    const { data: row } = await supa
      .from("events")
      .select("*")
      .or(`id.eq.${eventId},slug.eq.${eventId}`)
      .eq("status", "published")
      .maybeSingle();
    if (row) ev = rowToEvent(row);
  }
  if (!ev) return NextResponse.json({ ok: false, reason: "event_not_found" }, { status: 404 });

  const tier = ev.tiers?.find((t) => t.name === body.tier) ?? ev.tiers?.[0];
  const faceCents = Math.round((tier ? tier.price : ev.priceFrom) * 100);

  const check = await validatePromoCode(supa, {
    code: String(body.code || ""),
    eventId: ev.id,
    businessId: ev.organiserId,
    subtotalCents: faceCents * qty,
    qty,
  });

  if (!check.ok) {
    return NextResponse.json({ ok: false, reason: check.reason, minQty: check.minQty, message: PROMO_MESSAGES[check.reason] }, { status: 422 });
  }
  return NextResponse.json({ ok: true, code: check.code, kind: check.kind, discountCents: check.discountCents });
}
