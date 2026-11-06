import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  verifyTurnstile: vi.fn(),
  beehiivSubscribe: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: mocks.rateLimit,
  tooMany: () => new Response(null, { status: 429 }),
}));

vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("@/lib/beehiiv", () => ({ beehiivSubscribe: mocks.beehiivSubscribe }));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/emails/newsletter", () => ({ newsletterSignupEmail: vi.fn() }));

import { POST } from "@/app/api/subscribe/route";

describe("newsletter subscription route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ ok: true });
    mocks.verifyTurnstile.mockResolvedValue(true);
  });

  it("rejects email addresses longer than the RFC maximum before calling providers", async () => {
    const email = `${"a".repeat(243)}@example.com`;
    const request = new Request("https://example.test/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const response = await POST(request);

    expect(email).toHaveLength(255);
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Please enter a valid email" });
    expect(mocks.beehiivSubscribe).not.toHaveBeenCalled();
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });
});
