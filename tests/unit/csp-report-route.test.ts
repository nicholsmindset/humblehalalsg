import { afterEach, describe, expect, it, vi } from "vitest";

const { rateLimit } = vi.hoisted(() => ({
  rateLimit: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/ratelimit", () => ({ rateLimit }));

import { POST } from "@/app/api/csp-report/route";

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("POST /api/csp-report", () => {
  it("logs a valid report", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const response = await POST(new Request("https://humblehalal.sg/api/csp-report", {
      method: "POST",
      body: JSON.stringify({ "csp-report": { "blocked-uri": "https://evil.example/script.js" } }),
    }));

    expect(response.status).toBe(204);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("drops bodies larger than the byte limit", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const report = JSON.stringify({ "csp-report": { "blocked-uri": "https://evil.example/script.js" } });
    const response = await POST(new Request("https://humblehalal.sg/api/csp-report", {
      method: "POST",
      body: report + " ".repeat(32_768),
    }));

    expect(response.status).toBe(204);
    expect(warn).not.toHaveBeenCalled();
  });
});
