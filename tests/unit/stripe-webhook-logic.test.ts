import { describe, it, expect } from "vitest";
import {
  FEATURED_PLANS,
  addDaysISO,
  donationRefundDelta,
  resolveTicketOrderMoney,
  ticketPayoutStatus,
  subscriptionListingUpdate,
} from "@/lib/stripe-webhook-logic";

/* The Stripe webhook is the single most money-critical file. These cover the
   pure decisions extracted out of it (lib/stripe-webhook-logic): refund
   reconciliation once-each math, the order money split, the payout gate, and the
   dunning-grace subscription downgrade rule. */

describe("addDaysISO", () => {
  it("returns YYYY-MM-DD `days` after the base (UTC)", () => {
    expect(addDaysISO(new Date("2026-07-18T09:30:00Z"), 1)).toBe("2026-07-19");
    expect(addDaysISO(new Date("2026-07-18T00:00:00Z"), 0)).toBe("2026-07-18");
  });

  it("rolls over month and year boundaries", () => {
    expect(addDaysISO(new Date("2026-01-31T00:00:00Z"), 1)).toBe("2026-02-01");
    expect(addDaysISO(new Date("2026-12-31T00:00:00Z"), 1)).toBe("2027-01-01");
  });
});

describe("donationRefundDelta — decrement the public total exactly once", () => {
  const donated = 10_000; // S$100 donation

  it("applies each partial refund's delta as it grows", () => {
    const first = donationRefundDelta({ amountRefundedCents: 3000, alreadyRefundedCents: 0, donatedCents: donated, chargeFullyRefunded: false });
    expect(first).toMatchObject({ newRefundedCents: 3000, deltaCents: 3000, shouldApply: true, markRefunded: false });

    // second partial: cumulative amount_refunded 5000, already 3000 → delta 2000
    const second = donationRefundDelta({ amountRefundedCents: 5000, alreadyRefundedCents: 3000, donatedCents: donated, chargeFullyRefunded: false });
    expect(second).toMatchObject({ newRefundedCents: 5000, deltaCents: 2000, shouldApply: true });
  });

  it("marks refunded on the full refund and applies only the remaining delta", () => {
    const full = donationRefundDelta({ amountRefundedCents: 10_000, alreadyRefundedCents: 5000, donatedCents: donated, chargeFullyRefunded: true });
    expect(full).toMatchObject({ newRefundedCents: 10_000, deltaCents: 5000, shouldApply: true, markRefunded: true });
  });

  it("is a no-op when Stripe re-delivers an already-processed refund (once-each)", () => {
    const replay = donationRefundDelta({ amountRefundedCents: 10_000, alreadyRefundedCents: 10_000, donatedCents: donated, chargeFullyRefunded: true });
    expect(replay.deltaCents).toBe(0);
    expect(replay.shouldApply).toBe(false);
  });

  it("clamps to the donation amount so a weird payload can't over-decrement", () => {
    const weird = donationRefundDelta({ amountRefundedCents: 99_999, alreadyRefundedCents: 0, donatedCents: donated, chargeFullyRefunded: true });
    expect(weird.newRefundedCents).toBe(donated); // never more than what was donated
    expect(weird.deltaCents).toBe(donated);
  });

  it("falls back to the raw refunded amount when the donation size is unknown", () => {
    const r = donationRefundDelta({ amountRefundedCents: 4000, alreadyRefundedCents: 0, donatedCents: 0, chargeFullyRefunded: false });
    expect(r.newRefundedCents).toBe(4000);
  });
});

describe("resolveTicketOrderMoney", () => {
  it("uses the authoritative netCents when present", () => {
    const money = resolveTicketOrderMoney(
      { qty: "3", subtotalCents: "6000", feeCents: "450", netCents: "5000", discountCents: "1000", feeMode: "absorb" },
      6450,
    );
    expect(money).toEqual({ qty: 3, subtotalCents: 6000, feeCents: 450, netCents: 5000, totalCents: 6450, discountCents: 1000, feeMode: "absorb" });
  });

  it("falls back to subtotal for net on legacy sessions (missing or blank netCents)", () => {
    const missing = resolveTicketOrderMoney({ qty: "2", subtotalCents: "4000", feeCents: "300" }, 4300);
    const blank = resolveTicketOrderMoney({ qty: "2", subtotalCents: "4000", feeCents: "300", netCents: "" }, 4300);
    expect(missing.netCents).toBe(4000);
    expect(blank.netCents).toBe(4000);
  });

  it("computes total as subtotal+fee only when amount_total is absent", () => {
    expect(resolveTicketOrderMoney({ subtotalCents: "4000", feeCents: "300" }, null).totalCents).toBe(4300);
    expect(resolveTicketOrderMoney({ subtotalCents: "4000", feeCents: "300" }, 9999).totalCents).toBe(9999);
  });

  it("defaults fee mode to pass and floors qty to 1", () => {
    const m = resolveTicketOrderMoney({ qty: "0" }, 0);
    expect(m.feeMode).toBe("pass");
    expect(m.qty).toBe(1);
  });
});

describe("ticketPayoutStatus", () => {
  it("is pending only for a connected account with a positive net", () => {
    expect(ticketPayoutStatus("acct_1", 5000)).toBe("pending");
    expect(ticketPayoutStatus("acct_1", 0)).toBe("none"); // nothing to pay out
    expect(ticketPayoutStatus(null, 5000)).toBe("none"); // no destination
    expect(ticketPayoutStatus(undefined, 5000)).toBe("none");
  });
});

describe("subscriptionListingUpdate — dunning grace", () => {
  it("keeps a paid plan live and flags featured for active premium/featured plans", () => {
    expect(subscriptionListingUpdate("active", "premium")).toEqual({ effectivePlan: "premium", featured: true, shouldUpdateBusiness: true });
    expect(subscriptionListingUpdate("active", "basic")).toEqual({ effectivePlan: "basic", featured: false, shouldUpdateBusiness: true });
    expect(subscriptionListingUpdate("trialing", "featured")).toMatchObject({ effectivePlan: "featured", featured: true });
  });

  it("does NOT touch the business row while past_due (Smart Retries still running)", () => {
    const r = subscriptionListingUpdate("past_due", "premium");
    expect(r.shouldUpdateBusiness).toBe(false);
  });

  it("downgrades to free on terminal states", () => {
    for (const status of ["canceled", "unpaid", "incomplete_expired", "paused"]) {
      const r = subscriptionListingUpdate(status, "premium");
      expect(r).toEqual({ effectivePlan: "free", featured: false, shouldUpdateBusiness: true });
    }
  });
});

describe("FEATURED_PLANS", () => {
  it("contains exactly the plans that light up the featured flag", () => {
    expect(FEATURED_PLANS.has("featured")).toBe(true);
    expect(FEATURED_PLANS.has("premium")).toBe(true);
    expect(FEATURED_PLANS.has("basic")).toBe(false);
    expect(FEATURED_PLANS.has("free")).toBe(false);
  });
});
