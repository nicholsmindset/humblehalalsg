import { describe, it, expect } from "vitest";
import { bookingFeeCents, computeOrder, toCents, fromCents, FEE_PCT, FEE_PER_TICKET_CENTS } from "../../lib/fees";

/* Ticketing money math is the single source of truth for what buyers pay and what
   organisers receive (lib/fees). Audit CP4 flagged it as untested. */

describe("bookingFeeCents — our commission (5% of subtotal + S$0.50/ticket)", () => {
  it("is 0 for a zero or negative subtotal", () => {
    expect(bookingFeeCents(0, 1)).toBe(0);
    expect(bookingFeeCents(-100, 3)).toBe(0);
  });

  it("= round(subtotal*5%) + 50¢ per ticket", () => {
    // $60 subtotal (6000¢), 3 tickets → 300 + 150 = 450
    expect(bookingFeeCents(6000, 3)).toBe(Math.round(6000 * FEE_PCT) + FEE_PER_TICKET_CENTS * 3);
    expect(bookingFeeCents(6000, 3)).toBe(450);
  });

  it("treats qty < 1 as 1 ticket for the per-ticket component", () => {
    expect(bookingFeeCents(2000, 0)).toBe(Math.round(2000 * FEE_PCT) + FEE_PER_TICKET_CENTS);
    expect(bookingFeeCents(2000, 0)).toBe(150);
  });

  it("rounds the percentage component to whole cents", () => {
    // 333¢ * 5% = 16.65 → 17
    expect(bookingFeeCents(333, 1)).toBe(17 + FEE_PER_TICKET_CENTS);
  });
});

describe("computeOrder — subtotal (→organiser) + fee (→us) = total (buyer pays)", () => {
  it("multiplies face by qty for the subtotal and adds the booking fee", () => {
    const o = computeOrder(2000, 3); // $20 face × 3
    expect(o.subtotalCents).toBe(6000);
    expect(o.feeCents).toBe(450);
    expect(o.totalCents).toBe(6450);
  });

  it("always satisfies subtotal + fee === total", () => {
    for (const [face, qty] of [[2000, 1], [1234, 4], [999, 2], [5000, 9]] as const) {
      const o = computeOrder(face, qty);
      expect(o.subtotalCents + o.feeCents).toBe(o.totalCents);
    }
  });

  it("never produces negative money and clamps qty to >= 1", () => {
    const o = computeOrder(2000, 0);
    expect(o.subtotalCents).toBe(2000); // qty floored to 1
    expect(o.feeCents).toBeGreaterThanOrEqual(0);
    expect(o.totalCents).toBeGreaterThanOrEqual(o.subtotalCents);

    const free = computeOrder(0, 1);
    expect(free).toEqual({ subtotalCents: 0, feeCents: 0, totalCents: 0 });
  });

  it("the fee (our cut) never exceeds the total the buyer pays", () => {
    const o = computeOrder(1000, 5);
    expect(o.feeCents).toBeLessThan(o.totalCents);
  });

  it("rounds fractional face cents before multiplying", () => {
    const o = computeOrder(333.7, 1); // round(333.7)=334
    expect(o.subtotalCents).toBe(334);
  });
});

describe("toCents / fromCents round-trip", () => {
  it("converts dollars to cents and back", () => {
    expect(toCents(20)).toBe(2000);
    expect(toCents(19.99)).toBe(1999);
    expect(fromCents(2000)).toBe(20);
  });
});
