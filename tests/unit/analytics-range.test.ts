import { describe, it, expect } from "vitest";
import { resolveRange, fmt, pct } from "../../lib/analytics-dashboard";

const HOUR = 3600e3;
const span = (r: { from: string; to: string }) => new Date(r.to).getTime() - new Date(r.from).getTime();

describe("resolveRange — SG-time analytics windows", () => {
  it("today is a 24h window", () => {
    expect(span(resolveRange("today"))).toBe(24 * HOUR);
  });
  it("yesterday is a 24h window ending at today's start", () => {
    const y = resolveRange("yesterday");
    const t = resolveRange("today");
    expect(span(y)).toBe(24 * HOUR);
    expect(y.to).toBe(t.from); // contiguous
  });
  it("7d / 30d / 90d span the right number of days", () => {
    expect(Math.round(span(resolveRange("7d")) / (24 * HOUR))).toBe(7);
    expect(Math.round(span(resolveRange("30d")) / (24 * HOUR))).toBe(30);
    expect(Math.round(span(resolveRange("90d")) / (24 * HOUR))).toBe(90);
  });
  it("custom range is inclusive of the 'to' day", () => {
    const r = resolveRange("custom", "2026-01-01", "2026-01-01");
    expect(span(r)).toBe(24 * HOUR); // single day, inclusive
  });
  it("from is always before to", () => {
    for (const k of ["today", "yesterday", "7d", "30d", "90d"] as const) {
      const r = resolveRange(k);
      expect(new Date(r.from).getTime()).toBeLessThan(new Date(r.to).getTime());
    }
  });
});

describe("fmt / pct formatting helpers", () => {
  it("fmt handles null/undefined as 0", () => {
    expect(fmt(null)).toBe("0");
    expect(fmt(undefined)).toBe("0");
    expect(fmt(1234)).toBe("1,234");
  });
  it("pct guards divide-by-zero", () => {
    expect(pct(5, 0)).toBe("0");
    expect(pct(1, 2)).toBe("50.0");
    expect(pct(1, 3, 0)).toBe("33");
  });
});
