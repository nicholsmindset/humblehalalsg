import { beforeEach, describe, expect, it, vi } from "vitest";

const { analyticsWeekly, requireAdmin } = vi.hoisted(() => ({
  analyticsWeekly: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin }));
vi.mock("@/lib/liteapi", () => ({
  analyticsWeekly,
  liteapiConfigured: () => true,
  LiteApiError: class LiteApiError extends Error {},
}));

import { GET } from "@/app/api/admin/travel-analytics/route";

describe("GET /api/admin/travel-analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ ok: true });
    analyticsWeekly.mockResolvedValue([]);
  });

  it.each([
    "from=2026-02-31&to=2026-03-10",
    "from=2026-03-10&to=2026-02-28",
    "from=not-a-date&to=2026-03-10",
  ])("rejects an invalid range before calling LiteAPI: %s", async (query) => {
    const response = await GET(new Request(`https://humblehalal.sg/api/admin/travel-analytics?${query}`));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "invalid_range" });
    expect(analyticsWeekly).not.toHaveBeenCalled();
  });

  it("forwards a valid calendar range", async () => {
    const response = await GET(new Request(
      "https://humblehalal.sg/api/admin/travel-analytics?from=2026-02-28&to=2026-03-10",
    ));

    expect(response.status).toBe(200);
    expect(analyticsWeekly).toHaveBeenCalledWith("2026-02-28", "2026-03-10");
  });
});
