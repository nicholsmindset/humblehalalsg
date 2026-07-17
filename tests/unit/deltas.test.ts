import { describe, it, expect } from "vitest";
import { pctChange, formatDelta } from "../../lib/deltas";

describe("pctChange — no fake deltas policy", () => {
  it("computes normal changes", () => {
    expect(pctChange(118, 100)).toBeCloseTo(18);
    expect(pctChange(80, 100)).toBeCloseTo(-20);
    expect(pctChange(100, 100)).toBe(0);
  });
  it("returns null when the prior period has no data (never a fake 0%)", () => {
    expect(pctChange(50, 0)).toBeNull();
    expect(pctChange(50, -1)).toBeNull();
    expect(pctChange(NaN, 100)).toBeNull();
    expect(pctChange(50, NaN)).toBeNull();
  });
});

describe("formatDelta", () => {
  it("signs and rounds", () => {
    expect(formatDelta(18.4)).toBe("+18%");
    expect(formatDelta(-4.6)).toBe("-5%");
    expect(formatDelta(0)).toBe("0%");
  });
});
