import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createVoucher: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/liteapi", () => ({
  createVoucher: mocks.createVoucher,
  liteapiConfigured: () => true,
  LiteApiError: class LiteApiError extends Error {},
}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: () => null }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

const request = (overrides: Record<string, unknown>) =>
  new Request("https://example.com/api/admin/travel-vouchers", {
    method: "POST",
    body: JSON.stringify({ code: "SAVE10", discountType: "percentage", discountValue: 10, ...overrides }),
  });

describe("admin travel voucher creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ ok: true, userId: "admin-1" });
    mocks.createVoucher.mockResolvedValue({ code: "SAVE10" });
  });

  it.each([
    [{ validityStart: "2026-02-30" }, "date"],
    [{ validityStart: "2026-09-10", validityEnd: "2026-09-01" }, "date"],
    [{ usagesLimit: 0.4 }, "usage"],
  ])("rejects an invalid voucher constraint", async (overrides, errorFragment) => {
    const { POST } = await import("@/app/api/admin/travel-vouchers/route");
    const response = await POST(request(overrides));

    expect(response.status).toBe(422);
    const result = await response.json() as { ok: boolean; error: string };
    expect(result.ok).toBe(false);
    expect(result.error.toLowerCase()).toContain(errorFragment);
    expect(mocks.createVoucher).not.toHaveBeenCalled();
  });

  it("forwards valid dates and an integer usage limit", async () => {
    const { POST } = await import("@/app/api/admin/travel-vouchers/route");
    const response = await POST(request({
      validityStart: "2026-09-01",
      validityEnd: "2026-09-30",
      usagesLimit: 25,
    }));

    expect(response.status).toBe(200);
    expect(mocks.createVoucher).toHaveBeenCalledWith(expect.objectContaining({
      validity_start: "2026-09-01",
      validity_end: "2026-09-30",
      usages_limit: 25,
    }));
  });
});
