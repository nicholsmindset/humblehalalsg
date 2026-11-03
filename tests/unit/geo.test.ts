import { describe, expect, it } from "vitest";
import { parseCoordinate } from "@/lib/geo";

describe("parseCoordinate", () => {
  it("accepts numeric coordinates at their valid boundaries", () => {
    expect(parseCoordinate("-90", 90)).toBe(-90);
    expect(parseCoordinate(180, 180)).toBe(180);
  });

  it("preserves null so callers can clear a coordinate", () => {
    expect(parseCoordinate(null, 90)).toBeNull();
  });

  it.each(["", "   ", "north", 90.01, -180.01, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid coordinate %p",
    (value) => {
      const limit = typeof value === "number" && Math.abs(value) > 100 ? 180 : 90;
      expect(parseCoordinate(value, limit)).toBeUndefined();
    },
  );
});
