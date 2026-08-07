import { describe, expect, it } from "vitest";
import { isValidHotelStay, isValidIsoDate, validHotelStayOrFallback } from "@/lib/hotel-dates";

describe("hotel date validation", () => {
  it("accepts real ISO calendar dates", () => {
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidHotelStay("2026-08-01", "2026-08-02")).toBe(true);
  });

  it("rejects impossible and malformed calendar dates", () => {
    expect(isValidIsoDate("2026-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-08-1")).toBe(false);
  });

  it("requires checkout to be after check-in", () => {
    expect(isValidHotelStay("2026-08-02", "2026-08-02")).toBe(false);
    expect(isValidHotelStay("2026-08-03", "2026-08-02")).toBe(false);
  });

  it("rejects malformed stays before they reach the rates provider", () => {
    const fallback = { checkin: "2026-09-01", checkout: "2026-09-03" };

    expect(validHotelStayOrFallback("not-a-date", "2026-08-02", fallback)).toBe(fallback);
    expect(validHotelStayOrFallback("2026-02-29", "2026-03-01", fallback)).toBe(fallback);
    expect(validHotelStayOrFallback(["2026-08-01"], "2026-08-02", fallback)).toBe(fallback);
    expect(validHotelStayOrFallback("2026-08-01", "2026-08-03", fallback)).toEqual({
      checkin: "2026-08-01",
      checkout: "2026-08-03",
    });
  });
});
