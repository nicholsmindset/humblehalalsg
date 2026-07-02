/* Humble Halal — server-side promo-code validation (single source of truth).
   Used by /api/checkout/validate-promo (live feedback in the checkout UI) and
   /api/checkout/ticket (authoritative re-check at session creation — the server
   NEVER trusts a client-computed discount). Discounts are pre-computed here and
   applied to our own Stripe line items, not via Stripe coupons (see 0041). */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PromoReason = "invalid_code" | "not_started" | "expired" | "min_qty" | "exhausted";

export type PromoCheck =
  | { ok: true; promoId: string; code: string; kind: "percent" | "fixed"; discountCents: number }
  | { ok: false; reason: PromoReason; minQty?: number };

const SAFE_REF = /^[a-zA-Z0-9_-]{1,64}$/;

/** Human-readable messages the checkout UI can show per rejection reason. */
export const PROMO_MESSAGES: Record<PromoReason, string> = {
  invalid_code: "That code isn't valid for this event.",
  not_started: "This code isn't active yet.",
  expired: "This code has expired.",
  min_qty: "This code needs a larger ticket quantity.",
  exhausted: "This code has been fully redeemed.",
};

export function normalizePromoCode(raw: unknown): string | null {
  const code = String(raw ?? "").trim().toUpperCase();
  return /^[A-Z0-9_-]{3,32}$/.test(code) ? code : null;
}

/** Validate a code against an event + organiser and compute the discount for a
 *  given subtotal/qty. Event-scoped codes win over org-wide codes of the same
 *  name. Inactive and unknown codes are indistinguishable on purpose. */
export async function validatePromoCode(
  admin: SupabaseClient,
  opts: { code: string; eventId: string; businessId: string | null; subtotalCents: number; qty: number },
): Promise<PromoCheck> {
  const code = normalizePromoCode(opts.code);
  if (!code || !opts.businessId || !SAFE_REF.test(opts.eventId)) return { ok: false, reason: "invalid_code" };

  const { data: rows } = await admin
    .from("promo_codes")
    .select("id, code, kind, percent_off, amount_off_cents, max_redemptions, redeemed, min_qty, starts_at, expires_at, active, event_id")
    .eq("business_id", opts.businessId)
    .eq("code", code)
    .or(`event_id.is.null,event_id.eq.${opts.eventId}`)
    .limit(10);

  const promo = rows?.find((r) => r.event_id === opts.eventId) ?? rows?.find((r) => r.event_id == null);
  if (!promo || !promo.active) return { ok: false, reason: "invalid_code" };

  const now = Date.now();
  if (promo.starts_at && Date.parse(promo.starts_at) > now) return { ok: false, reason: "not_started" };
  if (promo.expires_at && Date.parse(promo.expires_at) < now) return { ok: false, reason: "expired" };
  const minQty = Math.max(1, Number(promo.min_qty) || 1);
  if (opts.qty < minQty) return { ok: false, reason: "min_qty", minQty };
  if (promo.max_redemptions != null && Number(promo.redeemed) >= Number(promo.max_redemptions)) {
    return { ok: false, reason: "exhausted" };
  }

  const subtotal = Math.max(0, Math.round(opts.subtotalCents));
  const discountCents =
    promo.kind === "percent"
      ? Math.min(subtotal, Math.round((subtotal * Number(promo.percent_off)) / 100))
      : Math.min(subtotal, Math.max(0, Number(promo.amount_off_cents) || 0));

  return { ok: true, promoId: promo.id as string, code, kind: promo.kind as "percent" | "fixed", discountCents };
}
