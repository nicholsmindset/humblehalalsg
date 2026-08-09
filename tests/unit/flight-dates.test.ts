import { describe, expect, it } from "vitest";
import { normalizeFlightDates, singaporeDate } from "@/lib/flight-dates";

describe("flight date normalization", () => {
  it("uses the Singapore calendar date", () => {
    expect(singaporeDate(new Date("2026-08-09T16:30:00.000Z"))).toBe("2026-08-10");
  });

  it("keeps valid future dates", () => {
    expect(normalizeFlightDates("2026-09-01", "2026-09-08", "round", "2026-08-10")).toEqual({
      date: "2026-09-01",
      returnDate: "2026-09-08",
    });
  });

  it.each(["2026-02-30", "not-a-date", "2026-08-09"])("defaults invalid or past outbound date %s", (date) => {
    expect(normalizeFlightDates(date, null, "one", "2026-08-10")).toEqual({
      date: "2026-08-31",
      returnDate: null,
    });
  });

  it("defaults a return date that precedes the outbound date", () => {
    expect(normalizeFlightDates("2026-09-10", "2026-09-09", "round", "2026-08-10")).toEqual({
      date: "2026-09-10",
      returnDate: "2026-09-17",
    });
  });

  it("discards return dates for one-way searches", () => {
    expect(normalizeFlightDates("2026-09-10", "2026-09-17", "one", "2026-08-10")).toEqual({
      date: "2026-09-10",
      returnDate: null,
    });
  });
});
