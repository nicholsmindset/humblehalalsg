import { describe, expect, it } from "vitest";
import { parseWeatherQuery } from "../../lib/weather-query";

const now = new Date("2026-07-28T12:00:00Z");
const parse = (query: string) => parseWeatherQuery(new URLSearchParams(query), now);

describe("parseWeatherQuery", () => {
  it("rejects missing, blank, non-finite, and out-of-range coordinates", () => {
    expect(parse("")).toEqual({ ok: false, error: "bad coords" });
    expect(parse("lat=&lng=")).toEqual({ ok: false, error: "bad coords" });
    expect(parse("lat=NaN&lng=103.8")).toEqual({ ok: false, error: "bad coords" });
    expect(parse("lat=91&lng=103.8")).toEqual({ ok: false, error: "bad coords" });
    expect(parse("lat=1.3&lng=181")).toEqual({ ok: false, error: "bad coords" });
  });

  it("accepts valid boundary coordinates and supplies the six-day default range", () => {
    expect(parse("lat=-90&lng=180")).toEqual({
      ok: true,
      lat: -90,
      lng: 180,
      start: "2026-07-28",
      end: "2026-08-03",
    });
  });

  it("accepts a valid requested date range", () => {
    expect(parse("lat=1.3521&lng=103.8198&checkin=2026-08-01&checkout=2026-08-05")).toEqual({
      ok: true,
      lat: 1.3521,
      lng: 103.8198,
      start: "2026-08-01",
      end: "2026-08-05",
    });
  });

  it("rejects malformed, impossible, and reversed date ranges", () => {
    expect(parse("lat=1.3&lng=103.8&checkin=tomorrow")).toEqual({ ok: false, error: "bad dates" });
    expect(parse("lat=1.3&lng=103.8&checkin=2026-02-30")).toEqual({ ok: false, error: "bad dates" });
    expect(parse("lat=1.3&lng=103.8&checkin=2026-08-05&checkout=2026-08-01")).toEqual({
      ok: false,
      error: "bad dates",
    });
  });
});
