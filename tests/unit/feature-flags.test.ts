import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { envFlags, FLAG_ENV } from "@/lib/flags";

describe("envFlags", () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it("reads truthy env vars into the Flags shape", () => {
    process.env.PASSPORT_ENABLED = "1";
    process.env.PAID_ADS_ENABLED = "";
    const f = envFlags();
    expect(f.passport).toBe(true);
    expect(f.paidAds).toBe(false);
  });

  it("covers every flag key with an env var name", () => {
    expect(Object.keys(FLAG_ENV).sort()).toEqual([
      "aiConcierge","certVault","halalVerdicts","leadRouting","paidAds",
      "paidFlights","paidHotels","paidLeads","paidPlans","paidTickets",
      "passport","payNow","semanticSearch",
    ].sort());
  });
});

// `lib/feature-flags.ts` is a real (unmocked) server-only module under test here.
// The `server-only` marker package throws unconditionally unless the bundler
// resolves the `react-server` export condition (Next.js sets this; plain
// Vitest/node resolution does not), so it must be stubbed for this test file —
// otherwise the mere `import "server-only"` at the top of the module under
// test throws before any of our logic ever runs. This does not weaken the
// test: it only prevents an unrelated resolution error, it doesn't touch the
// precedence/fail-safe assertions below.
vi.mock("server-only", () => ({}));

// Mock the Supabase admin client. `rows` is what the settings/overrides reads return.
// `throwSettings`/`throwOverrides` let tests force a genuine DB error (not just a
// null row) so the resolver's try/catch fail-safe path is actually exercised.
const state: {
  settings: Record<string, unknown> | null;
  overrides: { enabled: boolean }[];
  throwSettings: boolean;
  throwOverrides: boolean;
} = { settings: null, overrides: [], throwSettings: false, throwOverrides: false };
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === "platform_settings" && state.throwSettings) throw new Error("db down");
            return { data: table === "platform_settings" ? state.settings : null };
          },
          // business_feature_overrides read: .eq().eq().maybeSingle()
          eq: () => ({
            maybeSingle: async () => {
              if (state.throwOverrides) throw new Error("db down");
              return { data: state.overrides[0] ?? null };
            },
          }),
        }),
      }),
    }),
  }),
}));

describe("resolver precedence", () => {
  beforeEach(() => {
    state.settings = null; state.overrides = [];
    state.throwSettings = false; state.throwOverrides = false;
    for (const k of Object.keys(process.env)) if (k.endsWith("_ENABLED")) delete process.env[k];
    // reset the module cache between tests
  });

  it("global override wins over env", async () => {
    process.env.PASSPORT_ENABLED = "1";           // env ON
    state.settings = { passport_enabled: false };  // global OFF
    const { getServerFlags, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect((await getServerFlags()).passport).toBe(false);
  });

  it("null global defers to env", async () => {
    process.env.PAID_ADS_ENABLED = "1";
    state.settings = { paid_ads_enabled: null };
    const { getServerFlags, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect((await getServerFlags()).paidAds).toBe(true);
  });

  it("business override wins over global", async () => {
    state.settings = { lead_routing_enabled: false };  // global OFF
    state.overrides = [{ enabled: true }];              // business ON
    const { resolveBusinessFlag, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect(await resolveBusinessFlag("leadRouting", "biz-1")).toBe(true);
  });

  it("fails safe to env when the DB throws", async () => {
    process.env.CERT_VAULT_ENABLED = "1";
    state.settings = null; // maybeSingle returns {data:null} → no override → env
    const { getServerFlags, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect((await getServerFlags()).certVault).toBe(true);
  });

  // The brief's "fails safe to env when the DB throws" case above never actually
  // throws (maybeSingle just resolves {data:null}), so it doesn't prove the
  // try/catch does anything. These two make the mocked query genuinely reject
  // and confirm the resolver still resolves to env instead of rejecting.
  it("fails safe to env when the global-settings query genuinely throws", async () => {
    process.env.CERT_VAULT_ENABLED = "1";
    state.throwSettings = true;
    const { getServerFlags, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    await expect(getServerFlags()).resolves.toEqual(
      expect.objectContaining({ certVault: true })
    );
  });

  it("resolveBusinessFlag falls through to global/env when the override query genuinely throws", async () => {
    process.env.LEAD_ROUTING_ENABLED = "1";
    state.settings = { lead_routing_enabled: null }; // global defers to env
    state.throwOverrides = true;
    const { resolveBusinessFlag, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    await expect(resolveBusinessFlag("leadRouting", "biz-1")).resolves.toBe(true);
  });

  it("caches global overrides for the TTL window; bustFlagCache forces a re-read", async () => {
    state.settings = { paid_ads_enabled: true };
    const { getServerFlags, bustFlagCache } = await import("@/lib/feature-flags");
    bustFlagCache();
    expect((await getServerFlags()).paidAds).toBe(true);

    // DB now says OFF, but within the 30s TTL the cached (true) value should stick.
    state.settings = { paid_ads_enabled: false };
    expect((await getServerFlags()).paidAds).toBe(true);

    // Busting the cache should pick up the new DB value immediately.
    bustFlagCache();
    expect((await getServerFlags()).paidAds).toBe(false);
  });
});
