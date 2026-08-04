import { afterEach, describe, expect, it, vi } from "vitest";
import { timeAgo } from "@/lib/time";

describe("timeAgo", () => {
  afterEach(() => vi.useRealTimers());

  it("does not report zero years near the one-year boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T00:00:00Z"));

    expect(timeAgo(new Date("2025-08-09T00:00:00Z"))).toBe("12 months ago");
    expect(timeAgo(new Date("2025-08-04T00:00:00Z"))).toBe("1 year ago");
  });
});
