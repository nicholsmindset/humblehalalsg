import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePromoCode, validatePromoCode, PROMO_MESSAGES } from "@/lib/promo";

/* Promo validation is the server-side trust boundary for discounts: the client
   preview from /api/checkout/validate-promo is NEVER trusted, and the
   authoritative discount is recomputed here at Stripe-session creation
   (lib/promo). A bug lets a buyer pay less than the organiser is owed, or a
   0-clamp regression sends the total negative. */

const EVENT = "evt_ABC-123";
const BIZ = "biz_1";

type PromoRow = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  percent_off: number | null;
  amount_off_cents: number | null;
  max_redemptions: number | null;
  redeemed: number | null;
  min_qty: number | null;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  event_id: string | null;
};

function row(over: Partial<PromoRow> = {}): PromoRow {
  return {
    id: "promo_1",
    code: "SAVE10",
    kind: "percent",
    percent_off: 10,
    amount_off_cents: null,
    max_redemptions: null,
    redeemed: 0,
    min_qty: 1,
    starts_at: null,
    expires_at: null,
    active: true,
    event_id: null,
    ...over,
  };
}

/** Minimal chainable Supabase stub: from().select().eq().eq().or().limit() → {data}. */
function fakeAdmin(rows: PromoRow[] | null): SupabaseClient {
  const builder = {
    select: () => builder,
    eq: () => builder,
    or: () => builder,
    limit: () => Promise.resolve({ data: rows }),
  };
  return { from: () => builder } as unknown as SupabaseClient;
}

describe("normalizePromoCode", () => {
  it("trims and upper-cases valid codes", () => {
    expect(normalizePromoCode("  save10 ")).toBe("SAVE10");
    expect(normalizePromoCode("Eid-2026")).toBe("EID-2026");
  });

  it("rejects too-short, too-long, and unsafe codes", () => {
    expect(normalizePromoCode("ab")).toBeNull(); // < 3
    expect(normalizePromoCode("A".repeat(33))).toBeNull(); // > 32
    expect(normalizePromoCode("bad code")).toBeNull(); // space
    expect(normalizePromoCode("nope!")).toBeNull(); // symbol
  });

  it("rejects null / undefined", () => {
    expect(normalizePromoCode(null)).toBeNull();
    expect(normalizePromoCode(undefined)).toBeNull();
  });
});

describe("validatePromoCode — rejection paths", () => {
  it("invalid_code without a businessId (never hits the db)", async () => {
    const r = await validatePromoCode(fakeAdmin(null), {
      code: "SAVE10", eventId: EVENT, businessId: null, subtotalCents: 1000, qty: 1,
    });
    expect(r).toEqual({ ok: false, reason: "invalid_code" });
  });

  it("invalid_code for an unsafe eventId", async () => {
    const r = await validatePromoCode(fakeAdmin([row()]), {
      code: "SAVE10", eventId: "../etc", businessId: BIZ, subtotalCents: 1000, qty: 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_code");
  });

  it("unknown and inactive codes are indistinguishable (both invalid_code)", async () => {
    const unknown = await validatePromoCode(fakeAdmin([]), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 1000, qty: 1,
    });
    const inactive = await validatePromoCode(fakeAdmin([row({ active: false })]), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 1000, qty: 1,
    });
    expect(unknown).toEqual({ ok: false, reason: "invalid_code" });
    expect(inactive).toEqual({ ok: false, reason: "invalid_code" });
  });

  it("not_started before starts_at, expired after expires_at", async () => {
    const future = await validatePromoCode(fakeAdmin([row({ starts_at: "2999-01-01T00:00:00Z" })]), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 1000, qty: 1,
    });
    const past = await validatePromoCode(fakeAdmin([row({ expires_at: "2000-01-01T00:00:00Z" })]), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 1000, qty: 1,
    });
    expect(future.ok).toBe(false);
    if (!future.ok) expect(future.reason).toBe("not_started");
    expect(past.ok).toBe(false);
    if (!past.ok) expect(past.reason).toBe("expired");
  });

  it("min_qty surfaces the required quantity", async () => {
    const r = await validatePromoCode(fakeAdmin([row({ min_qty: 4 })]), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 1000, qty: 2,
    });
    expect(r).toEqual({ ok: false, reason: "min_qty", minQty: 4 });
  });

  it("exhausted once redeemed reaches max_redemptions", async () => {
    const r = await validatePromoCode(fakeAdmin([row({ max_redemptions: 5, redeemed: 5 })]), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 1000, qty: 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("exhausted");
  });
});

describe("validatePromoCode — discount computation", () => {
  it("event-scoped code wins over an org-wide code of the same name", async () => {
    const rows = [
      row({ id: "orgwide", event_id: null, percent_off: 10 }),
      row({ id: "scoped", event_id: EVENT, percent_off: 50 }),
    ];
    const r = await validatePromoCode(fakeAdmin(rows), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 10000, qty: 1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.promoId).toBe("scoped");
      expect(r.discountCents).toBe(5000); // 50% of 10000
    }
  });

  it("percent discount rounds to whole cents", async () => {
    const r = await validatePromoCode(fakeAdmin([row({ kind: "percent", percent_off: 15 })]), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 333, qty: 1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.discountCents).toBe(Math.round(333 * 0.15)); // 50
  });

  it("fixed discount, clamped to the subtotal (never negative total)", async () => {
    const normal = await validatePromoCode(
      fakeAdmin([row({ kind: "fixed", percent_off: null, amount_off_cents: 500 })]),
      { code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 2000, qty: 1 },
    );
    const overshoot = await validatePromoCode(
      fakeAdmin([row({ kind: "fixed", percent_off: null, amount_off_cents: 99999 })]),
      { code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 2000, qty: 1 },
    );
    expect(normal.ok && normal.discountCents).toBe(500);
    expect(overshoot.ok && overshoot.discountCents).toBe(2000); // clamped to subtotal
  });

  it("100%-off never drives the discount past the subtotal", async () => {
    const r = await validatePromoCode(fakeAdmin([row({ percent_off: 100 })]), {
      code: "SAVE10", eventId: EVENT, businessId: BIZ, subtotalCents: 4500, qty: 1,
    });
    expect(r.ok && r.discountCents).toBe(4500);
  });
});

describe("PROMO_MESSAGES", () => {
  it("has a human message for every rejection reason", () => {
    for (const reason of ["invalid_code", "not_started", "expired", "min_qty", "exhausted"] as const) {
      expect(PROMO_MESSAGES[reason]).toBeTruthy();
    }
  });
});
