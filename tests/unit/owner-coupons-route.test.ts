import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  revalidatePublic: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));
vi.mock("@/lib/plans", () => ({ canUse: vi.fn(() => true) }));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn(async () => ({ ok: true })),
  tooMany: vi.fn(),
}));
vi.mock("@/lib/revalidate", () => ({ revalidatePublic: mocks.revalidatePublic }));

import { DELETE, PATCH } from "@/app/api/owner/coupons/route";

function dbWithMutationError(redemptionCount = 0) {
  const mutationError = { message: "database unavailable" };

  return {
    from: vi.fn((table: string) => {
      if (table === "businesses") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "biz-1", slug: "my-shop", owner_id: "user-1", claimed_by: null },
              }),
            }),
          }),
        };
      }

      if (table === "coupon_redemptions") {
        return {
          select: () => ({ eq: async () => ({ count: redemptionCount }) }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: "promo-1", business_id: "biz-1", status: "approved" },
            }),
          }),
        }),
        update: () => ({ eq: async () => ({ error: mutationError }) }),
        delete: () => ({ eq: async () => ({ error: mutationError }) }),
      };
    }),
  };
}

describe("owner coupon mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user-1" });
  });

  it("does not report a coupon as paused when the update fails", async () => {
    mocks.getSupabaseAdmin.mockReturnValue(dbWithMutationError());

    const response = await PATCH(new Request("https://example.com/api/owner/coupons", {
      method: "PATCH",
      body: JSON.stringify({ id: "promo-1", action: "pause" }),
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "save_failed" });
    expect(mocks.revalidatePublic).not.toHaveBeenCalled();
  });

  it("does not report a coupon as deleted when the delete fails", async () => {
    mocks.getSupabaseAdmin.mockReturnValue(dbWithMutationError());

    const response = await DELETE(new Request("https://example.com/api/owner/coupons?id=promo-1", {
      method: "DELETE",
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "save_failed" });
  });

  it("does not report a redeemed coupon as archived when the update fails", async () => {
    mocks.getSupabaseAdmin.mockReturnValue(dbWithMutationError(1));

    const response = await DELETE(new Request("https://example.com/api/owner/coupons?id=promo-1", {
      method: "DELETE",
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "save_failed" });
  });
});
