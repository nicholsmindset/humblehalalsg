import { describe, expect, it } from "vitest";
import { couponAvailability, couponValue } from "@/lib/coupons";

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
});
