import { describe, it, expect } from "vitest";
import {
  classifyChannel,
  buildFunnel,
  listingCompleteness,
  avgCompleteness,
  searchOpportunities,
  deriveInsight,
  deriveAlerts,
  recommendExperiment,
} from "@/lib/analytics-overview";

/* Pure logic behind the admin analytics overview (lib/analytics-overview). These
   drive what admins see — the funnel rates, the "listings complete %" KPI, the
   high-demand/low-conversion search table, the insight banner and the alerts —
   so the derivations must be exact. */

describe("classifyChannel", () => {
  it("maps no referrer to direct", () => {
    expect(classifyChannel(null)).toBe("direct");
    expect(classifyChannel("")).toBe("direct");
    expect(classifyChannel("   ")).toBe("direct");
  });

  it("maps search engines to organic (host or full URL)", () => {
    expect(classifyChannel("google.com")).toBe("organic");
    expect(classifyChannel("https://www.google.com/search?q=halal")).toBe("organic");
    expect(classifyChannel("bing.com")).toBe("organic");
  });

  it("maps known social hosts to social", () => {
    expect(classifyChannel("facebook.com")).toBe("social");
    expect(classifyChannel("l.instagram.com")).toBe("social");
    expect(classifyChannel("t.co")).toBe("social");
    expect(classifyChannel("https://www.tiktok.com/@x")).toBe("social");
  });

  it("maps anything else with a host to referral", () => {
    expect(classifyChannel("somereview.sg")).toBe("referral");
    expect(classifyChannel("https://blog.example.com/post")).toBe("referral");
  });
});

describe("buildFunnel", () => {
  it("computes stage percentages and the funnel rates", () => {
    const f = buildFunnel({ sessions: 4434, listingViews: 116, actions: 19, qualified: 5 });
    expect(f.stages.map((s) => s.key)).toEqual(["sessions", "listing_views", "actions", "qualified"]);
    expect(f.stages[0]).toMatchObject({ value: 4434, pctOfTop: 100, pctOfPrev: 100 });
    expect(f.viewRate).toBe(2.6); // 116/4434
    expect(f.actionRate).toBe(16.4); // 19/116
    expect(f.leadRate).toBe(26.3); // 5/19
  });

  it("flags the biggest relative drop-off stage", () => {
    // sessions→views retains only 2.6% — by far the worst step.
    const f = buildFunnel({ sessions: 4434, listingViews: 116, actions: 19, qualified: 5 });
    expect(f.biggestDropoffStage).toBe("listing_views");
  });

  it("never divides by zero on an empty funnel", () => {
    const f = buildFunnel({ sessions: 0, listingViews: 0, actions: 0, qualified: 0 });
    expect(f.viewRate).toBe(0);
    expect(f.actionRate).toBe(0);
    expect(f.leadRate).toBe(0);
    expect(f.biggestDropoffStage).toBeNull();
  });
});

describe("listingCompleteness / avgCompleteness", () => {
  it("scores a fully-filled listing at 100 and an empty one at 0", () => {
    expect(listingCompleteness({
      hasPhoto: true, hasDescription: true, hasContact: true, hasHours: true,
      hasCategory: true, hasArea: true, verified: true,
    })).toBe(100);
    expect(listingCompleteness({})).toBe(0);
  });

  it("weights a photo (25) above area (5)", () => {
    expect(listingCompleteness({ hasPhoto: true })).toBe(25);
    expect(listingCompleteness({ hasArea: true })).toBe(5);
  });

  it("averages across listings and rounds", () => {
    expect(avgCompleteness([{ hasPhoto: true }, {}])).toBe(13); // (25+0)/2 = 12.5 → 13
    expect(avgCompleteness([])).toBe(0);
  });
});

describe("searchOpportunities", () => {
  const rows = [
    { query: "halal buffet singapore", searches: 1204, result_clicks: 25, searches_that_converted: 12 }, // ctr ~2.1%, conv ~1%
    { query: "halal catering", searches: 876, result_clicks: 28, searches_that_converted: 9 }, // conv ~1%
    { query: "muslim wedding venue", searches: 522, result_clicks: 21, searches_that_converted: 21 }, // conv ~4%
    { query: "rare typo", searches: 2, result_clicks: 0, searches_that_converted: 0 }, // below min
  ];

  it("drops terms below the minimum search floor and ranks by unmet demand", () => {
    const ops = searchOpportunities(rows, { minSearches: 5 });
    expect(ops.map((o) => o.query)).not.toContain("rare typo");
    expect(ops[0].query).toBe("halal buffet singapore"); // highest demand × lowest conversion
  });

  it("computes CTR and conversion, and grades high-demand/low-conversion as High", () => {
    const [top] = searchOpportunities(rows, { minSearches: 5 });
    expect(top.ctr).toBeCloseTo(2.1, 1);
    expect(top.convRate).toBeCloseTo(1, 0);
    expect(top.opportunity).toBe("High");
  });

  it("respects the limit", () => {
    expect(searchOpportunities(rows, { limit: 2 })).toHaveLength(2);
  });
});

describe("deriveInsight", () => {
  it("flags the headline case: traffic up, conversion down", () => {
    const i = deriveInsight({ total_sessions: 4434, search_conv_rate: 4.3 }, { total_sessions: 3800, search_conv_rate: 4.7 });
    expect(i.tone).toBe("watch");
    expect(i.headline).toMatch(/conversion declined/i);
  });

  it("is positive when both rise", () => {
    const i = deriveInsight({ total_sessions: 100, search_conv_rate: 5 }, { total_sessions: 80, search_conv_rate: 4 });
    expect(i.tone).toBe("positive");
  });

  it("is neutral without a comparison period", () => {
    expect(deriveInsight(null, null).tone).toBe("neutral");
  });
});

describe("deriveAlerts", () => {
  it("surfaces expiring certs (critical at 10+), demand spikes and moderation, most-urgent first", () => {
    const alerts = deriveAlerts({ expiringCerts: 12, demandSpikePct: 78, moderationPending: 3 });
    expect(alerts[0]).toMatchObject({ level: "critical" });
    expect(alerts[0].title).toMatch(/12 certificates expire/);
    expect(alerts.some((a) => /demand spike \+78%/.test(a.title))).toBe(true);
    expect(alerts.some((a) => /3 items need moderation/.test(a.title))).toBe(true);
  });

  it("emits nothing when everything is healthy", () => {
    expect(deriveAlerts({ expiringCerts: 0, demandSpikePct: 0, moderationPending: 0 })).toEqual([]);
  });

  it("ignores a sub-threshold demand spike", () => {
    expect(deriveAlerts({ demandSpikePct: 10 })).toEqual([]);
  });
});

describe("recommendExperiment", () => {
  const searchOps = [
    { query: "halal buffet", searches: 1204, ctr: 2.1, convRate: 1, opportunity: "High" as const },
    { query: "halal catering", searches: 876, ctr: 3.2, convRate: 1, opportunity: "High" as const },
    { query: "muslim wedding venue", searches: 522, ctr: 4, convRate: 4, opportunity: "Medium" as const },
  ];

  it("returns null without a funnel", () => {
    expect(recommendExperiment(null, searchOps)).toBeNull();
  });

  it("recommends richer result cards when the search→views step is the biggest drop", () => {
    const funnel = buildFunnel({ sessions: 4434, listingViews: 116, actions: 19, qualified: 5 }); // drop = listing_views
    const exp = recommendExperiment(funnel, searchOps);
    expect(exp?.title).toMatch(/result cards/i);
    expect(exp?.upliftMin).toBeGreaterThan(0);
    expect(exp?.upliftMax).toBeGreaterThanOrEqual(exp!.upliftMin);
    expect(exp?.confidence).toBe("High"); // 3 opportunities → high confidence
  });

  it("recommends prominent contact actions when views→actions is the drop", () => {
    const funnel = buildFunnel({ sessions: 100, listingViews: 100, actions: 5, qualified: 3 }); // drop = actions
    expect(recommendExperiment(funnel, searchOps)?.title).toMatch(/contact actions/i);
  });

  it("recommends a leaner quote form when actions→qualified is the drop", () => {
    const funnel = buildFunnel({ sessions: 100, listingViews: 100, actions: 100, qualified: 2 }); // drop = qualified
    expect(recommendExperiment(funnel, searchOps)?.title).toMatch(/quote form/i);
  });

  it("downgrades confidence when there are no search opportunities", () => {
    const funnel = buildFunnel({ sessions: 4434, listingViews: 116, actions: 19, qualified: 5 });
    expect(recommendExperiment(funnel, [])?.confidence).toBe("Low");
  });
});
