import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: mocks.rateLimit,
  tooMany: () => new Response(null, { status: 429 }),
}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseAdmin: mocks.getSupabaseAdmin }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));

import { POST } from "@/app/api/reports/route";

function request(body: Record<string, unknown>) {
  return new Request("https://humblehalal.sg/api/reports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rateLimit.mockResolvedValue({ ok: true });
});

describe("POST /api/reports", () => {
  it("rejects unknown reason codes before writing to the moderation queue", async () => {
    const response = await POST(request({ reason: "priority-takedown" }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Pick what's wrong." });
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("rejects oversized details instead of silently truncating the report", async () => {
    const response = await POST(request({ reason: "other", details: "a".repeat(1501) }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "One or more fields are too long." });
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("rejects invalid optional email addresses", async () => {
    const response = await POST(request({ reason: "hours", email: "not-an-email" }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "Enter a valid email address." });
    expect(mocks.getSupabaseAdmin).not.toHaveBeenCalled();
  });
});
