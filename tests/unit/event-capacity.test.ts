import { describe, expect, it } from "vitest";
import { eventCapacity } from "@/lib/event-capacity";

describe("eventCapacity", () => {
  it("accepts non-negative integer capacities", () => {
    expect(eventCapacity(0)).toBe(0);
    expect(eventCapacity(250)).toBe(250);
    expect(eventCapacity("250")).toBe(250);
  });

  it("rejects fractional, negative, and non-finite capacities", () => {
    expect(eventCapacity(1.5)).toBeNull();
    expect(eventCapacity(-1)).toBeNull();
    expect(eventCapacity(Number.NaN)).toBeNull();
    expect(eventCapacity(Number.POSITIVE_INFINITY)).toBeNull();
    expect(eventCapacity(null)).toBeNull();
    expect(eventCapacity("")).toBeNull();
  });

  it("rejects values that overflow the PostgreSQL integer column", () => {
    expect(eventCapacity(2_147_483_647)).toBe(2_147_483_647);
    expect(eventCapacity(2_147_483_648)).toBeNull();
  });
});
