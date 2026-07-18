import { describe, it, expect } from "vitest";
import { capacityGate, clampTicketQty, buildTicketLineItems } from "@/lib/ticket-checkout";
import { computeOrder, CURRENCY } from "@/lib/fees";

/* Paid-ticket checkout correctness (lib/ticket-checkout). The capacity gate is
   the double-sell guard (audit M2); buildTicketLineItems is what the buyer is
   actually charged — its totals must always reconcile with computeOrder. */

describe("capacityGate", () => {
  it("allows unlimited events (capacity 0)", () => {
    expect(capacityGate({ capacity: 0, taken: 999, qty: 5 })).toEqual({ ok: true });
  });

  it("allows a sale that fits within remaining capacity", () => {
    expect(capacityGate({ capacity: 100, taken: 90, qty: 10 })).toEqual({ ok: true });
    expect(capacityGate({ capacity: 100, taken: 0, qty: 1 })).toEqual({ ok: true });
  });

  it("reports insufficient_capacity with seats left when the qty overshoots", () => {
    expect(capacityGate({ capacity: 100, taken: 96, qty: 5 })).toEqual({ ok: false, reason: "insufficient_capacity", left: 4 });
  });

  it("reports sold_out with 0 left when nothing remains", () => {
    expect(capacityGate({ capacity: 100, taken: 100, qty: 1 })).toEqual({ ok: false, reason: "sold_out", left: 0 });
    // Over-taken (shouldn't happen, but clamp left at 0, never negative)
    expect(capacityGate({ capacity: 100, taken: 105, qty: 1 })).toEqual({ ok: false, reason: "sold_out", left: 0 });
  });

  it("treats a null/undefined taken as 0", () => {
    expect(capacityGate({ capacity: 10, taken: null, qty: 3 })).toEqual({ ok: true });
    expect(capacityGate({ capacity: 10, taken: undefined, qty: 11 })).toEqual({ ok: false, reason: "insufficient_capacity", left: 10 });
  });
});

describe("clampTicketQty", () => {
  it("clamps to 1–20 and defaults garbage to 1", () => {
    expect(clampTicketQty(5)).toBe(5);
    expect(clampTicketQty(0)).toBe(1);
    expect(clampTicketQty(-3)).toBe(1);
    expect(clampTicketQty(999)).toBe(20);
    expect(clampTicketQty("4")).toBe(4);
    expect(clampTicketQty("abc")).toBe(1);
    expect(clampTicketQty(undefined)).toBe(1);
  });
});

describe("buildTicketLineItems", () => {
  const NAME = "Halal Food Fest — General";

  it("pass mode, no discount: face × qty + a separate booking-fee line", () => {
    const face = 2000, qty = 3;
    const order = computeOrder(face, qty); // pass mode default
    const items = buildTicketLineItems({ order, faceCents: face, qty, feeMode: "pass", ticketName: NAME, currency: CURRENCY });
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ quantity: 3, price_data: { currency: CURRENCY, unit_amount: 2000, product_data: { name: NAME } } });
    expect(items[1].price_data.unit_amount).toBe(order.feeCents);
    expect(items[1].price_data.product_data.name).toBe("Booking fee");
    // Reconcile with the money math: face×qty + fee === buyer total.
    expect(items[0].price_data.unit_amount * items[0].quantity + items[1].price_data.unit_amount).toBe(order.totalCents);
  });

  it("absorb mode: single line at face × qty, fee comes out of the organiser (no fee line)", () => {
    const face = 2000, qty = 2;
    const order = computeOrder(face, qty, { feeMode: "absorb" });
    const items = buildTicketLineItems({ order, faceCents: face, qty, feeMode: "absorb", ticketName: NAME, currency: CURRENCY });
    expect(items).toHaveLength(1);
    expect(items[0].price_data.unit_amount * items[0].quantity).toBe(order.totalCents);
  });

  it("with a discount: collapses to one exact-total line naming the promo, never a per-unit mismatch", () => {
    const face = 2000, qty = 2;
    const order = computeOrder(face, qty, { discountCents: 1000 }); // pass mode + $10 off
    const items = buildTicketLineItems({ order, faceCents: face, qty, feeMode: "pass", ticketName: NAME, promoCode: "EID10", currency: CURRENCY });
    // ticket line collapsed to qty 1 at (subtotal − discount); fee line still added in pass mode.
    expect(items[0].quantity).toBe(1);
    expect(items[0].price_data.unit_amount).toBe(order.subtotalCents - order.discountCents);
    expect(items[0].price_data.product_data.name).toContain("EID10");
    const charged = items.reduce((sum, i) => sum + i.price_data.unit_amount * i.quantity, 0);
    expect(charged).toBe(order.totalCents); // buyer is charged exactly the computed total
  });

  it("charged total always reconciles with computeOrder across modes/discounts", () => {
    for (const feeMode of ["pass", "absorb"] as const) {
      for (const discountCents of [0, 500, 1000]) {
        const face = 1500, qty = 3;
        const order = computeOrder(face, qty, { feeMode, discountCents });
        const items = buildTicketLineItems({ order, faceCents: face, qty, feeMode, ticketName: NAME, promoCode: "X", currency: CURRENCY });
        const charged = items.reduce((sum, i) => sum + i.price_data.unit_amount * i.quantity, 0);
        expect(charged).toBe(order.totalCents);
      }
    }
  });
});
