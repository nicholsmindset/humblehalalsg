import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  logAudit: vi.fn(),
  revalidatePublic: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));
vi.mock("@/lib/audit", () => ({ logAudit: mocks.logAudit }));
vi.mock("@/lib/revalidate", () => ({ revalidatePublic: mocks.revalidatePublic }));

function queryResult(result: { data?: unknown; error?: unknown }) {
  const query = {
    select: vi.fn(() => query),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return query;
}

describe("admin media moderation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ ok: true, userId: "admin-1" });
  });

  it("returns a gateway error when the media lookup fails", async () => {
    const lookup = queryResult({ data: null, error: { message: "database unavailable" } });
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(lookup) });

    const { PATCH } = await import("@/app/api/admin/media/route");
    const response = await PATCH(new Request("https://example.com/api/admin/media", {
      method: "PATCH",
      body: JSON.stringify({ id: "photo-1", action: "edit", caption: "Updated" }),
    }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "query_failed" });
    expect(mocks.logAudit).not.toHaveBeenCalled();
    expect(mocks.revalidatePublic).not.toHaveBeenCalled();
  });

  it("does not report success or run side effects when an edit fails", async () => {
    const lookup = queryResult({
      data: { id: "photo-1", business_id: "business-1", url: "https://example.com/photo.jpg", businesses: { slug: "example" } },
      error: null,
    });
    const update = queryResult({ error: { message: "write failed" } });
    mocks.getSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(update) });

    const { PATCH } = await import("@/app/api/admin/media/route");
    const response = await PATCH(new Request("https://example.com/api/admin/media", {
      method: "PATCH",
      body: JSON.stringify({ id: "photo-1", action: "edit", caption: "Updated" }),
    }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "update_failed" });
    expect(mocks.logAudit).not.toHaveBeenCalled();
    expect(mocks.revalidatePublic).not.toHaveBeenCalled();
  });
});
