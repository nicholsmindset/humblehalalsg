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
    expect(free.subtotalCents).toBe(0);
    expect(free.feeCents).toBe(0);
    expect(free.totalCents).toBe(0);
    expect(free.netCents).toBe(0);
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

describe("computeOrder — fee modes (pass vs absorb)", () => {
  it("defaults to pass mode: buyer pays fee on top, organiser nets full face", () => {
    const o = computeOrder(2000, 2);
    expect(o.feeMode).toBe("pass");
    expect(o.subtotalCents).toBe(4000);
    expect(o.feeCents).toBe(300); // 5% of 4000 + 2×50
    expect(o.totalCents).toBe(4300);
    expect(o.netCents).toBe(4000);
  });

  it("absorb mode: buyer pays face only, fee comes out of the organiser's net", () => {
    const o = computeOrder(2000, 2, { feeMode: "absorb" });
    expect(o.totalCents).toBe(4000); // buyer sees no booking fee
    expect(o.feeCents).toBe(300);
    expect(o.netCents).toBe(3700);
    expect(o.netCents + o.feeCents).toBe(o.totalCents);
  });

  it("absorb mode never sends the organiser negative on cheap tickets", () => {
    // S$0.40 ticket: fee (2 + 50 = 52¢) would exceed the 40¢ collected → clamp
    const o = computeOrder(40, 1, { feeMode: "absorb" });
    expect(o.totalCents).toBe(40);
    expect(o.feeCents).toBe(40);
    expect(o.netCents).toBe(0);
  });
});

describe("computeOrder — promo discounts", () => {
  it("applies the discount before the fee, in pass mode", () => {
    // $20 × 2 with $10 off → discounted 3000; fee = 150 + 100 = 250
    const o = computeOrder(2000, 2, { discountCents: 1000 });
    expect(o.discountCents).toBe(1000);
    expect(o.feeCents).toBe(250);
    expect(o.totalCents).toBe(3250);
    expect(o.netCents).toBe(3000);
  });

  it("applies the discount before the fee, in absorb mode", () => {
    const o = computeOrder(2000, 2, { feeMode: "absorb", discountCents: 1000 });
    expect(o.totalCents).toBe(3000);
    expect(o.feeCents).toBe(250);
    expect(o.netCents).toBe(2750);
  });

  it("clamps the discount to the subtotal (100%-off never goes negative)", () => {
    const o = computeOrder(2000, 1, { discountCents: 99999 });
    expect(o.discountCents).toBe(2000);
    expect(o.totalCents).toBe(0);
    expect(o.feeCents).toBe(0);
    expect(o.netCents).toBe(0);
  });

  it("ignores negative discounts", () => {
    const o = computeOrder(2000, 1, { discountCents: -500 });
    expect(o.discountCents).toBe(0);
    expect(o.totalCents).toBe(2150);
  });

  it("buyer total + organiser net + platform fee always reconcile", () => {
    for (const feeMode of ["pass", "absorb"] as const) {
      for (const discountCents of [0, 250, 1000]) {
        const o = computeOrder(1500, 3, { feeMode, discountCents });
        // Whatever the mode, the buyer's money splits exactly between organiser and platform.
        expect(o.netCents + o.feeCents).toBe(o.totalCents);
        expect(o.subtotalCents - o.discountCents).toBe(feeMode === "pass" ? o.netCents : o.totalCents);
      }
    }
  });
});

describe("toCents / fromCents round-trip", () => {
  it("converts dollars to cents and back", () => {
    expect(toCents(20)).toBe(2000);
    expect(toCents(19.99)).toBe(1999);
    expect(fromCents(2000)).toBe(20);
  });
});
