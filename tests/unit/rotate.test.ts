import { describe, it, expect } from "vitest";
import { seededShuffle, sgDateKey } from "@/lib/rotate";

describe("daily rotation", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("same seed → same order (SSR and client agree)", () => {
    expect(seededShuffle(items, "2026-07-05home")).toEqual(seededShuffle(items, "2026-07-05home"));
  });
  it("different day → different order (rotation actually rotates)", () => {
    const a = seededShuffle(items, "2026-07-05home");
    const b = seededShuffle(items, "2026-07-06home");
    expect(a).not.toEqual(b);
  });
  it("keeps every item (shuffle, not sample)", () => {
    expect([...seededShuffle(items, "x")].sort()).toEqual([...items].sort());
  });
  it("does not mutate the input", () => {
    const src = [...items];
    seededShuffle(src, "y");
    expect(src).toEqual(items);
  });
  it("sgDateKey is YYYY-MM-DD", () => {
    expect(sgDateKey(new Date("2026-07-05T10:00:00+08:00"))).toBe("2026-07-05");
    // 23:30 UTC = 07:30 SG next day
    expect(sgDateKey(new Date("2026-07-05T23:30:00Z"))).toBe("2026-07-06");
  });
});
