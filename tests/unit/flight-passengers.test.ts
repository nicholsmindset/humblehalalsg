import { describe, expect, it } from "vitest";
import { normalizeFlightPassengerCount } from "@/lib/flights";

const adults = { min: 1, max: 9, fallback: 1 };
const dependants = { min: 0, max: 8, fallback: 0 };

describe("normalizeFlightPassengerCount", () => {
  it("preserves valid whole passenger counts", () => {
    expect(normalizeFlightPassengerCount(2, adults)).toBe(2);
    expect(normalizeFlightPassengerCount("3", dependants)).toBe(3);
  });

  it("converts fractional counts to whole passengers", () => {
    expect(normalizeFlightPassengerCount(2.9, adults)).toBe(2);
    expect(normalizeFlightPassengerCount("1.8", dependants)).toBe(1);
  });

  it("bounds counts to the provider limits", () => {
    expect(normalizeFlightPassengerCount(-4, adults)).toBe(1);
    expect(normalizeFlightPassengerCount(99, adults)).toBe(9);
    expect(normalizeFlightPassengerCount(-4, dependants)).toBe(0);
    expect(normalizeFlightPassengerCount(99, dependants)).toBe(8);
  });

  it("falls back for non-finite input", () => {
    expect(normalizeFlightPassengerCount("not-a-count", adults)).toBe(1);
    expect(normalizeFlightPassengerCount(Infinity, dependants)).toBe(0);
  });
});
