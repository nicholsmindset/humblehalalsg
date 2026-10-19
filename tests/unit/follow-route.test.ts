import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
const getSupabaseAdmin = vi.fn();
const award = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: "user-1" })) }));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn(async () => ({ ok: true })),
  tooMany: vi.fn(),
}));
vi.mock("@/lib/feature-flags", () => ({ getServerFlags: vi.fn(async () => ({ passport: true })) }));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServer: vi.fn(async () => ({
    from: vi.fn(() => ({ upsert })),
  })),
  getSupabaseAdmin,
}));
vi.mock("@/lib/passport-server", () => ({
  award,
  loadStats: vi.fn(),
  emitProgress: vi.fn(),
}));

describe("follow route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not award points when the follow cannot be persisted", async () => {
    upsert.mockResolvedValue({ error: { message: "foreign key violation" } });
    const { POST } = await import("@/app/api/follow/route");

    const response = await POST(new Request("https://example.com/api/follow", {
      method: "POST",
      body: JSON.stringify({ businessId: "missing-business", follow: true }),
    }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "could_not_update" });
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
    expect(award).not.toHaveBeenCalled();
  });
});
