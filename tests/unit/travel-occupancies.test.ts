import { describe, expect, it } from "vitest";
import { sanitizeOccupancies } from "@/lib/travel-data";

describe("sanitizeOccupancies", () => {
  it("preserves valid room and child-age blocks", () => {
    expect(sanitizeOccupancies([
      { adults: 2, children: [4, 12] },
      { adults: 1 },
    ])).toEqual([
      { adults: 2, children: [4, 12] },
      { adults: 1 },
    ]);
  });

  it("uses a safe default for missing occupancy input", () => {
    expect(sanitizeOccupancies(undefined)).toEqual([{ adults: 2 }]);
    expect(sanitizeOccupancies([])).toEqual([{ adults: 2 }]);
  });

  it("bounds room counts, guests, and child ages", () => {
    const rooms = Array.from({ length: 12 }, (_, index) => ({
      adults: index === 0 ? 99 : -1,
      children: [20, -3, "bad", ...Array(8).fill(7)],
    }));

    const result = sanitizeOccupancies(rooms);

    expect(result).toHaveLength(8);
    expect(result[0]).toEqual({
      adults: 9,
      children: [17, 0, 0, 7, 7, 7, 7, 7],
    });
    expect(result[1].adults).toBe(1);
  });

  it("normalizes malformed room entries without throwing", () => {
    expect(sanitizeOccupancies([null, "room", { adults: "3.6", children: "none" }]))
      .toEqual([{ adults: 2 }, { adults: 2 }, { adults: 4 }]);
  });
});
