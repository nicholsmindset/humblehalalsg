import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { travelDisabledResponse } from "@/proxy";
import { categories, listings } from "@/lib/data";

describe("travel launch shutdown", () => {
  it.each([
    "/travel",
    "/travel/flights",
    "/api/travel/search",
    "/api/admin/travel-revenue",
    "/api/admin/verify-hotel",
    "/api/cron/fare-alerts",
    "/api/cron/flight-retry",
    "/blog/category/muslim-travel",
    "/blog/halal-cruises-from-singapore",
    "/blog/halal-food-johor-bahru-guide",
    "/blog/crossing-to-johor-bahru-checkpoints-transport",
    "/blog/umrah-from-singapore-guide",
  ])("returns 410 before the route can call a provider: %s", (path) => {
    const response = travelDisabledResponse(new NextRequest(`https://humblehalal.com${path}`));
    expect(response?.status).toBe(410);
  });

  it("does not block unrelated directory and AI routes", () => {
    expect(travelDisabledResponse(new NextRequest("https://humblehalal.com/explore"))).toBeNull();
    expect(travelDisabledResponse(new NextRequest("https://humblehalal.com/api/concierge"))).toBeNull();
  });

  it("omits travel from the built-in directory fallback", () => {
    expect(categories.some((category) => category.id === "travel")).toBe(false);
    expect(listings.some((listing) => listing.catId === "travel")).toBe(false);
  });
});
