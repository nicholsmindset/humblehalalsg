import { NextResponse } from "next/server";
import { authoriseEventManager } from "@/lib/event-auth";
import { normalizePromoCode, normalizePromoPositiveInt } from "@/lib/promo";

/* Organiser promo-code management for one event (owner/admin only; RLS-bypassing
   writes stay behind this authorisation, per the 0017 service-role convention).
   GET lists the event's codes plus the organiser's org-wide codes; POST creates;
   DELETE deactivates (soft) once a code has been redeemed — order rows keep
   their promo_code_id — and hard-deletes never-used codes. */

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authoriseEventManager(id);
  if (!a.ok) return a.res;
  if (!a.ev.business_id) return NextResponse.json({ ok: true, codes: [] });

  const { data } = await a.admin
    .from("promo_codes")
    .select("id, code, kind, percent_off, amount_off_cents, max_redemptions, redeemed, min_qty, starts_at, expires_at, active, event_id, created_at")
    .eq("business_id", a.ev.business_id)
    .or(`event_id.is.null,event_id.eq.${a.ev.id}`)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, codes: data ?? [] });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authoriseEventManager(id);
  if (!a.ok) return a.res;
  if (!a.ev.business_id) {
    return NextResponse.json({ ok: false, reason: "no_business" }, { status: 422 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    code?: string;
    kind?: string;
    percentOff?: number;
    amountOffCents?: number;
    maxRedemptions?: number;
    minQty?: number;
    startsAt?: string;
    expiresAt?: string;
    orgWide?: boolean;
  };

  const code = normalizePromoCode(body.code);
  if (!code) return NextResponse.json({ ok: false, reason: "bad_code" }, { status: 422 });

  const kind = body.kind === "fixed" ? "fixed" : body.kind === "percent" ? "percent" : null;
  if (!kind) return NextResponse.json({ ok: false, reason: "bad_kind" }, { status: 422 });
  const percentOff = kind === "percent" ? normalizePromoPositiveInt(body.percentOff, 100) : null;
  const amountOffCents = kind === "fixed" ? normalizePromoPositiveInt(body.amountOffCents) : null;
  if (kind === "percent" && percentOff == null) {
    return NextResponse.json({ ok: false, reason: "bad_percent" }, { status: 422 });
  }
  if (kind === "fixed" && amountOffCents == null) {
    return NextResponse.json({ ok: false, reason: "bad_amount" }, { status: 422 });
  }

  const maxRedemptions = body.maxRedemptions != null ? normalizePromoPositiveInt(body.maxRedemptions) : null;
  if (body.maxRedemptions != null && maxRedemptions == null) {
    return NextResponse.json({ ok: false, reason: "bad_max_redemptions" }, { status: 422 });
  }
  const minQty = body.minQty != null ? normalizePromoPositiveInt(body.minQty) : 1;
  if (minQty == null) {
    return NextResponse.json({ ok: false, reason: "bad_min_qty" }, { status: 422 });
  }
  const startsAt = body.startsAt && !Number.isNaN(Date.parse(body.startsAt)) ? new Date(body.startsAt).toISOString() : null;
  const expiresAt = body.expiresAt && !Number.isNaN(Date.parse(body.expiresAt)) ? new Date(body.expiresAt).toISOString() : null;

  const { data, error } = await a.admin
    .from("promo_codes")
    .insert({
      business_id: a.ev.business_id,
      event_id: body.orgWide ? null : a.ev.id,
      code,
      kind,
      percent_off: percentOff,
      amount_off_cents: amountOffCents,
      max_redemptions: maxRedemptions,
      min_qty: minQty,
      starts_at: startsAt,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json({ ok: false, reason: duplicate ? "duplicate_code" : "db_error" }, { status: duplicate ? 409 : 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authoriseEventManager(id);
  if (!a.ok) return a.res;

  const promoId = new URL(req.url).searchParams.get("promoId") || "";
  if (!promoId) return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });

  // Scope the lookup to this organiser's business so one owner can never
  // touch another's codes, whatever id they pass.
  const { data: promo } = await a.admin
    .from("promo_codes")
    .select("id, redeemed")
    .eq("id", promoId)
    .eq("business_id", a.ev.business_id ?? "")
    .maybeSingle();
  if (!promo) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  if (Number(promo.redeemed) > 0) {
    await a.admin.from("promo_codes").update({ active: false }).eq("id", promo.id);
    return NextResponse.json({ ok: true, deactivated: true });
  }
  await a.admin.from("promo_codes").delete().eq("id", promo.id);
  return NextResponse.json({ ok: true, deleted: true });
}
