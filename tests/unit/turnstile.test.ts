import { describe, it, expect, vi, afterEach } from "vitest";

/* Cloudflare Turnstile guards the highest-abuse public forms (leads, contact,
   subscribe). It's a DARK ROLLOUT: with no secret it must be a transparent no-op
   so nothing breaks before the owner provisions keys; once configured, a
   missing/invalid token is rejected, and a Cloudflare outage only fails open
   where the caller opted in (lib/turnstile). SECRET is read at module load, so
   each case re-imports with the env it needs. */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function load(secret?: string) {
  vi.resetModules();
  vi.stubEnv("TURNSTILE_SECRET_KEY", secret ?? "");
  return import("@/lib/turnstile");
}

describe("turnstile — unconfigured (dark rollout)", () => {
  it("is a no-op that passes everything and reports not configured", async () => {
    const { verifyTurnstile, turnstileConfigured } = await load(undefined);
    expect(turnstileConfigured()).toBe(false);
    expect(await verifyTurnstile("anything")).toBe(true);
    expect(await verifyTurnstile(null)).toBe(true); // still no-op when unconfigured
  });
});

describe("turnstile — configured", () => {
  it("reports configured", async () => {
    const { turnstileConfigured } = await load("secret");
    expect(turnstileConfigured()).toBe(true);
  });

  it("passes when Cloudflare returns success:true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
    const { verifyTurnstile } = await load("secret");
    expect(await verifyTurnstile("good-token", "1.2.3.4")).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects a missing/empty/non-string token without calling Cloudflare", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { verifyTurnstile } = await load("secret");
    expect(await verifyTurnstile("")).toBe(false);
    expect(await verifyTurnstile(null)).toBe(false);
    expect(await verifyTurnstile(123)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when Cloudflare returns success:false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ success: false }) }));
    const { verifyTurnstile } = await load("secret");
    expect(await verifyTurnstile("bad-token")).toBe(false);
  });

  it("on a Cloudflare outage, fails closed by default and open only when asked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const { verifyTurnstile } = await load("secret");
    expect(await verifyTurnstile("token")).toBe(false); // default: fail closed
    expect(await verifyTurnstile("token", null, { failOpen: true })).toBe(true);
  });
});
