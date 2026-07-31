import { describe, expect, it } from "vitest";
import { isValidHotelStay, isValidIsoDate } from "@/lib/hotel-dates";

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
});
