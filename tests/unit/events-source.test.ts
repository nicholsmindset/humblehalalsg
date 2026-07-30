import { describe, expect, it } from "vitest";
import { todaySG } from "@/lib/events-source";

describe("todaySG", () => {
  it("uses the Singapore calendar day after the UTC date boundary", () => {
    const earlyMorningInSingapore = new Date("2026-07-30T16:30:00.000Z");

    expect(todaySG(earlyMorningInSingapore)).toBe("2026-07-31");
  });

  it("keeps the UTC date before midnight in Singapore", () => {
    const lateEveningInSingapore = new Date("2026-07-30T15:30:00.000Z");

    expect(todaySG(lateEveningInSingapore)).toBe("2026-07-30");
  });
});
