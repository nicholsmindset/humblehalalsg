import { describe, it, expect } from "vitest";
import { rankLeadCandidates, routeLeadExclusive, type MatchCandidate, type LeadRow } from "@/lib/lead-routing";

/* Lead marketplace routing. Two invariants here:
   1. rankLeadCandidates — the ORDER a lead fans out in (source listing first,
      claimed over unclaimed, quota, then plan). A bug mis-prioritises who gets it.
   2. routeLeadExclusive consent gate — PDPA: a lead's contact details must NEVER
      be forwarded without consent_contact. The guard short-circuits before any DB
      access, so we assert it touches nothing (see lib/lead-mask for the masking). */

function cand(id: string, over: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    business_id: id, slug: id, name: id, owner_id: id, claimed_by: null,
    plan: "free", hasQuota: false, claimed: true, ...over,
  };
}

describe("rankLeadCandidates", () => {
  it("pins the consumer's source listing to slot 1, even if weaker on every other axis", () => {
    const pool = [
      cand("premium-claimed", { plan: "premium", hasQuota: true, claimed: true }),
      cand("src", { slug: "src", plan: "free", hasQuota: false, claimed: false }),
    ];
    expect(rankLeadCandidates(pool, "src")[0].business_id).toBe("src");
  });

  it("ranks claimed businesses above unclaimed outreach targets", () => {
    const pool = [cand("unclaimed", { claimed: false }), cand("claimed", { claimed: true })];
    expect(rankLeadCandidates(pool, null)[0].business_id).toBe("claimed");
  });

  it("ranks quota-holders above those without (both claimed)", () => {
    const pool = [cand("no-quota", { hasQuota: false }), cand("has-quota", { hasQuota: true })];
    expect(rankLeadCandidates(pool, null)[0].business_id).toBe("has-quota");
  });

  it("ranks higher listing plans first as the final tiebreak", () => {
    const pool = [
      cand("verified", { plan: "verified" }),
      cand("premium", { plan: "premium" }),
      cand("free", { plan: "free" }),
    ];
    expect(rankLeadCandidates(pool, null).map((c) => c.plan)).toEqual(["premium", "verified", "free"]);
  });

  it("applies the priority order end to end", () => {
    const pool = [
      cand("free-claimed", { plan: "free", hasQuota: false, claimed: true }),
      cand("unclaimed-premium", { plan: "premium", hasQuota: true, claimed: false }),
      cand("src", { slug: "src", claimed: false }),
      cand("premium-quota", { plan: "premium", hasQuota: true, claimed: true }),
    ];
    expect(rankLeadCandidates(pool, "src").map((c) => c.business_id)).toEqual([
      "src", "premium-quota", "free-claimed", "unclaimed-premium",
    ]);
  });

  it("does not mutate the input array", () => {
    const pool = [cand("a", { plan: "free" }), cand("b", { plan: "premium" })];
    const before = pool.map((c) => c.business_id);
    rankLeadCandidates(pool, null);
    expect(pool.map((c) => c.business_id)).toEqual(before);
  });
});

describe("routeLeadExclusive — consent gate (PII never forwarded unconsented)", () => {
  // A DB proxy that throws on ANY access — proving the guard returns before touching data.
  const explodingDb = new Proxy({}, {
    get() { throw new Error("DB must not be touched when consent is missing"); },
  }) as never;

  const leadWith = (consent: LeadRow["consent_contact"]): LeadRow => ({
    id: "lead_1", name: "Aisha", vertical_id: "catering", area: "East", budget: "$$",
    event_date: null, source_listing_slug: null, status: "new",
    consent_contact: consent, email: "aisha@example.com", phone: "91234567", details: "50 pax",
  });
  const target = cand("biz_1");

  it("blocks and never queries the DB when consent is explicitly false", async () => {
    await expect(routeLeadExclusive(explodingDb, leadWith(false), target)).resolves.toBe("blocked");
  });

  it("blocks when consent is null or undefined (must be an explicit true)", async () => {
    await expect(routeLeadExclusive(explodingDb, leadWith(null), target)).resolves.toBe("blocked");
    await expect(routeLeadExclusive(explodingDb, leadWith(undefined), target)).resolves.toBe("blocked");
  });
});
