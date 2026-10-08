import { beforeEach, describe, expect, it, vi } from "vitest";

const { rateLimit, sendEmail, verifyTurnstile } = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  sendEmail: vi.fn(),
  verifyTurnstile: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit,
  tooMany: vi.fn(),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile }));
vi.mock("@/lib/email", () => ({ sendEmail }));

import { POST } from "@/app/api/contact/route";

function request(body: Record<string, unknown>) {
  return new Request("https://humblehalal.sg/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  rateLimit.mockResolvedValue({ ok: true });
  verifyTurnstile.mockResolvedValue(true);
  sendEmail.mockResolvedValue(undefined);
});

describe("POST /api/contact", () => {
  it("rejects an oversized email instead of sending to a truncated address", async () => {
    const email = `${"a".repeat(245)}@example.com`;

    const response = await POST(request({ name: "Aisha", email, message: "Please help", turnstileToken: "ok" }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "One or more fields are too long" });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects an oversized message instead of silently discarding its tail", async () => {
    const response = await POST(request({
      name: "Aisha",
      email: "aisha@example.com",
      message: "a".repeat(4001),
      turnstileToken: "ok",
    }));

    expect(response.status).toBe(422);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
