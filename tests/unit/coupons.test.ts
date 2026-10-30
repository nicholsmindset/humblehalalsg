import { describe, expect, it } from "vitest";
import {
  couponAvailability,
  couponDateInput,
  couponPositiveInteger,
  couponTimeInput,
  couponValue,
} from "@/lib/coupons";

describe("business coupons", () => {
  it("formats percentage and fixed-value discounts without ambiguity", () => {
    expect(couponValue({ discount_type: "percent", discount_value: 15, reward_text: null })).toBe("15% off");
    expect(couponValue({ discount_type: "fixed", discount_value: 1250, reward_text: null })).toBe("$12.50 off");
  });

  it("requires explicit reward copy for item and bundle offers", () => {
    expect(couponValue({ discount_type: "free_item", discount_value: null, reward_text: "Free teh tarik" })).toBe("Free teh tarik");
    expect(couponValue({ discount_type: "bundle", discount_value: null, reward_text: "2 mains for $20" })).toBe("2 mains for $20");
  });

  it("never reports negative inventory", () => {
    expect(couponAvailability({ total_limit: 100, claimed_count: 12 })).toBe(88);
    expect(couponAvailability({ total_limit: 10, claimed_count: 12 })).toBe(0);
    expect(couponAvailability({ total_limit: null, claimed_count: 999 })).toBeNull();
  });

  it("normalizes valid coupon dates and rejects malformed calendar dates", () => {
    expect(couponDateInput("2026-08-09")).toBe("2026-08-09T00:00:00.000Z");
    expect(couponDateInput("2026-02-30")).toBeNull();
    expect(couponDateInput("not-a-date")).toBeNull();
  });

  it("accepts only real 24-hour redemption times", () => {
    expect(couponTimeInput(" 09:30 ")).toBe("09:30");
    expect(couponTimeInput("23:59")).toBe("23:59");
    expect(couponTimeInput("24:00")).toBeNull();
    expect(couponTimeInput("12:60")).toBeNull();
  });

  it("normalizes coupon limits to bounded database integers", () => {
    expect(couponPositiveInteger("2.6", 1, 20)).toBe(3);
    expect(couponPositiveInteger(100, 1, 20)).toBe(20);
    expect(couponPositiveInteger("not-a-number", 1, 20)).toBe(1);
    expect(couponPositiveInteger("", null)).toBeNull();
    expect(couponPositiveInteger(Number.MAX_SAFE_INTEGER, null)).toBe(2_147_483_647);
  });
});
