import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { travelDisabledResponse } from "@/proxy";

describe("travel launch shutdown", () => {
  it.each([
    "/travel",
    "/travel/flights",
    "/api/travel/search",
    "/api/admin/travel-revenue",
    "/api/admin/verify-hotel",
    "/api/cron/fare-alerts",
    "/api/cron/flight-retry",
  ])("returns 410 before the route can call a provider: %s", (path) => {
    const response = travelDisabledResponse(new NextRequest(`https://humblehalal.com${path}`));
    expect(response?.status).toBe(410);
  });

  it("does not block unrelated directory and AI routes", () => {
    expect(travelDisabledResponse(new NextRequest("https://humblehalal.com/explore"))).toBeNull();
    expect(travelDisabledResponse(new NextRequest("https://humblehalal.com/api/concierge"))).toBeNull();
  });
});
