import { beforeEach, describe, expect, it, vi } from "vitest";

const authoriseEventManager = vi.fn();

vi.mock("@/lib/event-auth", () => ({ authoriseEventManager }));

function adminWithMutationError(redeemed: number, mutation: "update" | "delete") {
  const lookup = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: "promo-1", redeemed }, error: null }),
  };
  const write = {
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: { message: `${mutation} failed` } }),
  };

  return {
    from: vi.fn()
      .mockReturnValueOnce(lookup)
      .mockReturnValueOnce(write),
  };
}

describe("event promo-code deletion", () => {
  beforeEach(() => {
    authoriseEventManager.mockReset();
  });

  it.each([
    { redeemed: 1, mutation: "update" as const },
    { redeemed: 0, mutation: "delete" as const },
  ])("returns an error when the $mutation fails", async ({ redeemed, mutation }) => {
    const admin = adminWithMutationError(redeemed, mutation);
    authoriseEventManager.mockResolvedValue({
      ok: true,
      admin,
      userId: "user-1",
      ev: { id: "event-1", business_id: "business-1" },
    });

    const { DELETE } = await import("@/app/api/events/[id]/promo-codes/route");
    const response = await DELETE(
      new Request("https://example.com/api/events/event-1/promo-codes?promoId=promo-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "event-1" }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "db_error" });
  });
});
