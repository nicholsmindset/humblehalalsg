import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  searchAirports: vi.fn(),
  searchLocalAirports: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: mocks.rateLimit,
  tooMany: (retryAfter: number) => new Response(
    JSON.stringify({ ok: false, error: "rate_limited" }),
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  ),
}));

vi.mock("@/lib/liteapi", () => ({
  liteapiConfigured: () => true,
  searchAirports: mocks.searchAirports,
}));

vi.mock("@/lib/airports", () => ({
  searchLocalAirports: mocks.searchLocalAirports,
}));

import { GET } from "@/app/api/travel/flights/airports/route";

describe("airport autocomplete route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchLocalAirports.mockReturnValue([]);
    mocks.searchAirports.mockResolvedValue([]);
  });

  it("rejects rate-limited requests before searching local or live providers", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, retryAfter: 42 });
    const request = new Request("https://example.test/api/travel/flights/airports?q=sin");

    const response = await GET(request);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(mocks.rateLimit).toHaveBeenCalledWith(request, "airport-search", 60, 60);
    expect(mocks.searchLocalAirports).not.toHaveBeenCalled();
    expect(mocks.searchAirports).not.toHaveBeenCalled();
  });
});
