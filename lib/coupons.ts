export type CouponDiscountType = "percent" | "fixed" | "free_item" | "bundle";

export interface PublicCoupon {
  id: string;
  business_id: string;
  business_name?: string;
  business_slug?: string;
  title: string;
  details: string | null;
  discount_type: CouponDiscountType;
  discount_value: number | null;
  reward_text: string | null;
  min_spend_cents: number;
  starts_at: string;
  ends_at: string | null;
  valid_days: number[];
  redeem_start: string | null;
  redeem_end: string | null;
  total_limit: number | null;
  claimed_count: number;
  terms: string | null;
}

export function couponDateInput(value: unknown): string | null {
  const input = typeof value === "string" ? value.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;

  const date = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input
    ? null
    : date.toISOString();
}

export function couponTimeInput(value: unknown): string | null {
  const input = typeof value === "string" ? value.trim() : "";
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input) ? input : null;
}

export function couponPositiveInteger(value: unknown, fallback: number, max?: number): number;
export function couponPositiveInteger(value: unknown, fallback: null, max?: number): number | null;
export function couponPositiveInteger(value: unknown, fallback: number | null, max = 2_147_483_647): number | null {
  const input = Number(value);
  if (!Number.isFinite(input) || input <= 0) return fallback;
  return Math.min(max, Math.max(1, Math.round(input)));
}

export function couponValue(c: Pick<PublicCoupon, "discount_type" | "discount_value" | "reward_text">): string {
  if (c.discount_type === "percent") return `${c.discount_value || 0}% off`;
  if (c.discount_type === "fixed") return `$${((c.discount_value || 0) / 100).toFixed(2)} off`;
  return c.reward_text || (c.discount_type === "free_item" ? "Free item" : "Bundle deal");
}

export function couponAvailability(c: Pick<PublicCoupon, "total_limit" | "claimed_count">): number | null {
  return c.total_limit == null ? null : Math.max(0, c.total_limit - c.claimed_count);
}
