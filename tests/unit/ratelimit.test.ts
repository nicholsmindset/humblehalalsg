import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Per-IP abuse throttle for public/paid endpoints (lib/ratelimit). Without
   Upstash env (the case here and in CI) it uses the in-memory fixed window.
   Two invariants matter most: (1) the limit actually trips, and (2) the client
   IP can't be spoofed to evade it — the platform-injected header wins over the
   client-controllable x-forwarded-for (security audit M7). */

function req(headers: Record<string, string>): Request {
  return new Request("https://humblehalal.sg/api/x", { headers });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit — in-memory fixed window", () => {
  it("allows up to the limit, then denies with retryAfter = windowSec", async () => {
    const ip = { "x-real-ip": "10.0.0.1" };
    // Unique bucket per test — the in-memory map is module-global.
    const a = await rateLimit(req(ip), "b-basic", 2, 60);
    const b = await rateLimit(req(ip), "b-basic", 2, 60);
    const c = await rateLimit(req(ip), "b-basic", 2, 60);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(c.ok).toBe(false);
    expect(c.retryAfter).toBe(60);
  });

  it("keys separately per IP", async () => {
    const one = await rateLimit(req({ "x-real-ip": "1.1.1.1" }), "b-perip", 1, 60);
    const two = await rateLimit(req({ "x-real-ip": "2.2.2.2" }), "b-perip", 1, 60);
    expect(one.ok).toBe(true);
    expect(two.ok).toBe(true); // different IP, own budget
  });

  it("can't be evaded by rotating x-forwarded-for when the trusted header is present", async () => {
    // Same trusted platform IP, different (spoofable) x-forwarded-for each time.
    const first = await rateLimit(
      req({ "x-vercel-forwarded-for": "9.9.9.9", "x-forwarded-for": "1.1.1.1" }), "b-spoof", 1, 60,
    );
    const second = await rateLimit(
      req({ "x-vercel-forwarded-for": "9.9.9.9", "x-forwarded-for": "2.2.2.2" }), "b-spoof", 1, 60,
    );
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false); // still the same key → throttled
  });

  it("resets after the window elapses", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const ip = { "x-real-ip": "7.7.7.7" };
    expect((await rateLimit(req(ip), "b-window", 1, 1)).ok).toBe(true);
    expect((await rateLimit(req(ip), "b-window", 1, 1)).ok).toBe(false);
    vi.advanceTimersByTime(1500); // past resetAt
    expect((await rateLimit(req(ip), "b-window", 1, 1)).ok).toBe(true);
  });
});

describe("tooMany", () => {
  it("returns a 429 with a Retry-After header and a JSON body", async () => {
    const res = tooMany(30);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(await res.json()).toMatchObject({ ok: false });
  });
});
