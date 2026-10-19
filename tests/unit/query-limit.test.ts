import { describe, expect, it } from "vitest";
import { queryLimit } from "@/lib/query-limit";

describe("queryLimit", () => {
  it("returns bounded integer limits", () => {
    expect(queryLimit("2.9", 30, 100)).toBe(2);
    expect(queryLimit("0", 30, 100)).toBe(1);
    expect(queryLimit("200", 30, 100)).toBe(100);
  });

  it("uses the fallback for missing and non-finite limits", () => {
    expect(queryLimit(null, 30, 100)).toBe(30);
    expect(queryLimit("", 30, 100)).toBe(30);
    expect(queryLimit("not-a-number", 30, 100)).toBe(30);
    expect(queryLimit("Infinity", 30, 100)).toBe(30);
  });
});
