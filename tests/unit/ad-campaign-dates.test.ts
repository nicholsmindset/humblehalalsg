import { describe, expect, it } from "vitest";
import { adCampaignEndDate } from "../../lib/ad-campaign-dates";

describe("adCampaignEndDate", () => {
  it("returns the inclusive final day of a calendar-month campaign", () => {
    expect(adCampaignEndDate("2026-08-18", 1)).toBe("2026-09-17");
    expect(adCampaignEndDate("2026-01-31", 1)).toBe("2026-03-02");
  });

  it("accepts valid leap days", () => {
    expect(adCampaignEndDate("2028-02-29", 1)).toBe("2028-03-28");
  });

  it.each(["2026-02-29", "2026-02-31", "2026-13-01", "not-a-date"])(
    "rejects invalid start date %s",
    (startsOn) => {
      expect(adCampaignEndDate(startsOn, 1)).toBeNull();
    },
  );

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid duration %s",
    (months) => {
      expect(adCampaignEndDate("2026-08-18", months)).toBeNull();
    },
  );
});
