import { beforeEach, describe, expect, it, vi } from "vitest";

const after = vi.fn();
const sendEmail = vi.fn();
const insert = vi.fn();

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after,
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn().mockResolvedValue({ userId: "owner-1" }) }));
vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ ok: true }),
  tooMany: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ sendEmail }));
vi.mock("@/lib/plans", () => ({
  planKey: () => "premium",
  canUse: () => true,
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "businesses") {
        const query = {
          select: () => query,
          eq: () => query,
          or: () => query,
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "business-1", name: "Example & Co", slug: "example", plan: "premium" },
            error: null,
          }),
        };
        return query;
      }
      return {
        insert: (value: unknown) => {
          insert(value);
          return {
            select: () => ({
              single: vi.fn().mockResolvedValue({ data: { id: "ticket-1" }, error: null }),
            }),
          };
        },
      };
    },
  }),
}));

describe("owner support route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    sendEmail.mockResolvedValue({ ok: false, simulated: false });
  });

  it("responds after saving without waiting for notification delivery", async () => {
    let notification: (() => Promise<void>) | undefined;
    after.mockImplementation((callback: () => Promise<void>) => {
      notification = callback;
    });

    const { POST } = await import("@/app/api/owner/support/route");
    const response = await POST(new Request("https://example.com/api/owner/support", {
      method: "POST",
      body: JSON.stringify({ businessId: "business-1", subject: "Need help", message: "Please help with my listing" }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "ticket-1", priority: "high" });
    expect(insert).toHaveBeenCalledOnce();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(notification).toBeTypeOf("function");

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await notification?.();

    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      businessId: "business-1",
      template: "owner-support",
    }));
    expect(consoleError).toHaveBeenCalledWith(
      "[owner/support] notification delivery failed",
      { ticketId: "ticket-1" },
    );
    consoleError.mockRestore();
  });
});
