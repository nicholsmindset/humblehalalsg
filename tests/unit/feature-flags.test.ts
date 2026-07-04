import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
