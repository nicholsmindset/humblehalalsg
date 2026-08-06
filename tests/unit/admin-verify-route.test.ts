import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: vi.fn(), supabaseConfigured: false }));
vi.mock("@/lib/revalidate", () => ({ revalidatePublic: vi.fn() }));

describe("manual admin verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T16:30:00Z")); // 6 Aug in Singapore
  });

  it("rejects a MUIS certificate that expired before today", async () => {
    const { POST } = await import("@/app/api/admin/verify/route");
    const response = await POST(new Request("https://example.com/api/admin/verify", {
      method: "POST",
      body: JSON.stringify({ business_id: "biz-1", action: "muis", certNo: "MUIS-1", expiry: "2026-08-05" }),
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "cert_expired" });
  });

  it("accepts a certificate through its expiry day", async () => {
    const { POST } = await import("@/app/api/admin/verify/route");
    const response = await POST(new Request("https://example.com/api/admin/verify", {
      method: "POST",
      body: JSON.stringify({ business_id: "biz-1", action: "muis", certNo: "MUIS-1", expiry: "2026-08-06" }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, simulated: true });
  });
});
