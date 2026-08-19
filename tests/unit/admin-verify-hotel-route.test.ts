import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const upsert = vi.fn();
const from = vi.fn(() => ({ upsert }));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: () => ({ from }) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

describe("admin hotel verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ ok: true, userId: "admin-1" });
    upsert.mockResolvedValue({ error: null });
  });

  async function post(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/admin/verify-hotel/route");
    return POST(new Request("https://example.com/api/admin/verify-hotel", {
      method: "POST",
      body: JSON.stringify({ liteapi_hotel_id: "hotel-1", ...body }),
    }));
  }

  it.each([
    ["halal score", { halal_score: "not-a-number" }, "Invalid halal score"],
    ["non-finite mosque distance", { near_mosque_m: "Infinity" }, "Invalid mosque distance"],
    ["negative mosque distance", { near_mosque_m: -1 }, "Invalid mosque distance"],
  ])("rejects an invalid %s", async (_label, body, error) => {
    const response = await post(body);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("clamps a finite score and preserves a valid mosque distance", async () => {
    const response = await post({ halal_score: 120, near_mosque_m: 350.5 });

    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      halal_score: 100,
      near_mosque_m: 350.5,
    }));
  });
});
