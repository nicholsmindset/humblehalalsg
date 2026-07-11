import { describe, it, expect, vi } from "vitest";

// lib/lead-routing transitively imports server-only modules (lib/email etc.);
// the `server-only` marker throws outside Next's react-server resolution, so
// stub it exactly like tests/unit/feature-flags.test.ts does. Only the PURE
// pickNextExclusive is under test — no server behaviour is weakened.
vi.mock("server-only", () => ({}));

import { pickNextExclusive, type MatchCandidate } from "@/lib/lead-routing";

const c = (id: string, over: Partial<MatchCandidate> = {}): MatchCandidate => ({
  business_id: id, slug: id, name: id, owner_id: "u", claimed_by: null,
  plan: "free", hasQuota: false, claimed: true, ...over,
});

describe("pickNextExclusive — round-robin fairness", () => {
  it("returns null when every candidate has already been routed for this lead", () => {
    expect(pickNextExclusive([c("a")], {}, new Set(["a"]))).toBeNull();
    expect(pickNextExclusive([], {}, new Set())).toBeNull();
  });

  it("pins the consumer's source listing first regardless of rotation", () => {
    const pool = [c("a"), c("b"), c("src")];
    const last = { a: null, b: null, src: "2026-07-01T00:00:00Z" }; // src routed most recently
    expect(pickNextExclusive(pool, last, new Set(), "src")?.business_id).toBe("src");
  });

  it("never picks an already-routed business, even the pinned source", () => {
    const pool = [c("a"), c("src")];
    expect(pickNextExclusive(pool, {}, new Set(["src"]), "src")?.business_id).toBe("a");
  });

  it("prefers never-routed businesses over previously routed ones", () => {
    const pool = [c("veteran"), c("fresh")];
    const last = { veteran: "2026-07-10T00:00:00Z", fresh: null };
    expect(pickNextExclusive(pool, last, new Set())?.business_id).toBe("fresh");
  });

  it("rotates to the least-recently-routed when all have history", () => {
    const pool = [c("recent"), c("stale")];
    const last = { recent: "2026-07-11T00:00:00Z", stale: "2026-07-01T00:00:00Z" };
    expect(pickNextExclusive(pool, last, new Set())?.business_id).toBe("stale");
  });

  it("ties break by the match-quality ranking (candidate order)", () => {
    const pool = [c("better"), c("worse")]; // candidates arrive pre-ranked
    expect(pickNextExclusive(pool, { better: null, worse: null }, new Set())?.business_id).toBe("better");
    const same = "2026-07-05T00:00:00Z";
    expect(pickNextExclusive(pool, { better: same, worse: same }, new Set())?.business_id).toBe("better");
  });

  it("walks the whole pool as prior hops accumulate (cascade behaviour)", () => {
    const pool = [c("a"), c("b"), c("d")];
    const routed = new Set<string>();
    const order: string[] = [];
    for (let i = 0; i < 4; i++) {
      const next = pickNextExclusive(pool, {}, routed);
      if (!next) break;
      order.push(next.business_id);
      routed.add(next.business_id);
    }
    expect(order).toEqual(["a", "b", "d"]); // each exactly once, then exhausted
  });
});
