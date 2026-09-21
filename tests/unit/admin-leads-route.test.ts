import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: vi.fn() }));

describe("admin lead queue", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reports a database failure instead of returning an empty queue", async () => {
    const { requireAdmin } = await import("@/lib/admin-auth");
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, userId: "admin-1" });

    const queryResult = Promise.resolve({
      data: null,
      error: { message: "database unavailable" },
    });
    const query = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(() => queryResult),
    };
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn(() => query),
    } as never);

    const { GET } = await import("@/app/api/admin/leads/route");
    const response = await GET(new Request("https://example.com/api/admin/leads"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "query_failed" });
  });
});
