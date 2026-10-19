import { describe, expect, it } from "vitest";
import { normalizeOneMapResults } from "@/lib/onemap";

describe("normalizeOneMapResults", () => {
  it("normalizes valid OneMap search results", () => {
    expect(normalizeOneMapResults([{
      ADDRESS: "1 NORTH BRIDGE ROAD",
      ROAD_NAME: "NORTH BRIDGE ROAD",
      BUILDING: "NATIONAL GALLERY",
      POSTAL: "178957",
      LATITUDE: "1.290270",
      LONGITUDE: "103.851959",
    }])).toEqual([{
      address: "1 North Bridge Road",
      road: "North Bridge Road",
      building: "National Gallery",
      postal: "178957",
      lat: 1.29027,
      lng: 103.851959,
    }]);
  });

  it("drops malformed, non-finite, and out-of-range coordinates", () => {
    expect(normalizeOneMapResults([
      { LATITUDE: "", LONGITUDE: "103.8" },
      { LATITUDE: "not-a-number", LONGITUDE: "103.8" },
      { LATITUDE: "Infinity", LONGITUDE: "103.8" },
      { LATITUDE: "91", LONGITUDE: "103.8" },
      { LATITUDE: "1.3", LONGITUDE: "181" },
    ])).toEqual([]);
  });

  it("skips invalid entries before applying the eight-result cap", () => {
    const valid = Array.from({ length: 9 }, (_, index) => ({
      ADDRESS: `ADDRESS ${index}`,
      LATITUDE: "1.3",
      LONGITUDE: "103.8",
    }));

    expect(normalizeOneMapResults([{ LATITUDE: "bad", LONGITUDE: "bad" }, ...valid])).toHaveLength(8);
  });

  it("handles sentinel and non-string optional fields", () => {
    expect(normalizeOneMapResults([{
      ADDRESS: null,
      ROAD_NAME: 123,
      BUILDING: " nil ",
      POSTAL: "NULL",
      LATITUDE: "1.3",
      LONGITUDE: "103.8",
    }])).toEqual([{
      address: "",
      road: "",
      building: "",
      postal: "",
      lat: 1.3,
      lng: 103.8,
    }]);
  });
});
