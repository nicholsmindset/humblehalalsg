import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getChains: vi.fn(),
  liteapiConfigured: vi.fn(),
}));

vi.mock("@/lib/liteapi", () => mocks);

import { GET } from "@/app/api/travel/chains/route";

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

describe("travel chains route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.liteapiConfigured.mockReturnValue(true);
    mocks.getChains.mockResolvedValue([{ id: 1, name: "Example" }]);
  });

  it("marks successful reference-data responses as CDN-cacheable", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(CACHE_CONTROL);
    expect(await response.json()).toEqual({ ok: true, chains: [{ id: 1, name: "Example" }] });
  });

  it.each([
    ["when LiteAPI is not configured", false, false],
    ["when LiteAPI fails", true, true],
  ])("keeps fallback responses cacheable %s", async (_label, configured, rejects) => {
    mocks.liteapiConfigured.mockReturnValue(configured);
    if (rejects) mocks.getChains.mockRejectedValue(new Error("unavailable"));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(CACHE_CONTROL);
    expect((await response.json()).chains).toEqual([]);
  });
});
