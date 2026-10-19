import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const getSupabaseAdmin = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/payout-reversal", () => ({ reverseOrderTransferIfPaid: vi.fn() }));

describe("refund order claim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ userId: "admin_123" });
  });

  it("only claims an order that is still confirmed", async () => {
    const claimEq = vi.fn();
    const claimQuery = {
      eq: vi.fn(function (this: typeof claimQuery, column: string, value: string) {
        claimEq(column, value);
        return this;
      }),
      select: vi.fn().mockResolvedValue({ data: [] }),
    };
    const orderLookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "order_123",
          event_id: null,
          business_id: null,
          status: "confirmed",
          amount_cents: 0,
          stripe_payment_intent: null,
          qty: 1,
          payout_status: "none",
          stripe_transfer_id: null,
        },
      }),
    };
    const profileLookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
    };
    let orderCall = 0;
    getSupabaseAdmin.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return profileLookup;
        if (table === "orders" && orderCall++ === 0) return orderLookup;
        if (table === "orders") return { update: vi.fn(() => claimQuery) };
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const { POST } = await import("@/app/api/refunds/route");
    const response = await POST(new Request("https://humblehalal.com/api/refunds", {
      method: "POST",
      body: JSON.stringify({ orderId: "order_123" }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, already: true });
    expect(claimEq).toHaveBeenCalledWith("id", "order_123");
    expect(claimEq).toHaveBeenCalledWith("status", "confirmed");
  });
});
