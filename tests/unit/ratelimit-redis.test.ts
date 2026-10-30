import { afterEach, describe, expect, it, vi } from "vitest";

const request = new Request("https://humblehalal.sg/api/paid", {
  headers: { "x-real-ip": "203.0.113.10" },
});

async function loadRateLimit() {
  vi.resetModules();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret");
  return (await import("@/lib/ratelimit")).rateLimit;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("rateLimit — Upstash failures", () => {
  it("denies fail-closed buckets when INCR returns an HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
    const rateLimit = await loadRateLimit();

    await expect(rateLimit(request, "paid-ai", 10, 60, { failClosed: true }))
      .resolves.toEqual({ ok: false, retryAfter: 60 });
  });

  it("denies fail-closed buckets when INCR returns a malformed count", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "rate limit exceeded" })));
    const rateLimit = await loadRateLimit();

    await expect(rateLimit(request, "paid-ai", 10, 60, { failClosed: true }))
      .resolves.toEqual({ ok: false, retryAfter: 60 });
  });

  it("preserves fail-open behavior for ordinary buckets during an outage", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
    const rateLimit = await loadRateLimit();

    await expect(rateLimit(request, "public", 10, 60))
      .resolves.toEqual({ ok: true, retryAfter: 0 });
  });
});
