import { describe, it, expect } from "vitest";
import { similarityScore, similarEvents } from "../../lib/similar-events";
import type { EventItem } from "../../lib/types";

/* Recommendation scoring drives the "You may also like" module on event pages
   and (later) email blocks — keep the ranking rules pinned. */

const NOW = new Date("2026-07-01T00:00:00Z");

function ev(over: Partial<EventItem>): EventItem {
  return {
    id: "e0",
    slug: "e0",
    title: "Event",
    catId: "bazaar",
    cat: "Bazaars & Markets",
    img: "",
    tone: "emerald",
    free: true,
    priceFrom: 0,
    dateLabel: "",
    timeLabel: "",
    dateISO: "2026-07-10",
    venue: "",
    area: "Geylang Serai",
    capacity: 0,
    taken: 0,
    organiserId: null,
    organiser: "",
    organiserBiz: false,
    blurb: "",
    tags: [],
    prayerNearby: false,
    halalCatering: false,
    featured: false,
    attendees: 0,
    ...over,
  };
}

describe("similarityScore", () => {
  const anchor = ev({ id: "a", slug: "a", catId: "bazaar", area: "Geylang Serai", dateISO: "2026-07-10", organiserId: "b1" });

  it("never recommends the anchor itself", () => {
    expect(similarityScore(anchor, anchor, NOW)).toBe(0);
  });

  it("never recommends past events", () => {
    const past = ev({ id: "p", slug: "p", dateISO: "2026-06-01" });
    expect(similarityScore(anchor, past, NOW)).toBe(0);
  });

  it("weights category (3) > area (2) > organiser (1)", () => {
    const far = "2026-09-30"; // outside the ±14d proximity window
    const sameCat = similarityScore(anchor, ev({ id: "c", slug: "c", catId: "bazaar", area: "Yishun", dateISO: far }), NOW);
    const sameArea = similarityScore(anchor, ev({ id: "r", slug: "r", catId: "talk", area: "Geylang Serai", dateISO: far }), NOW);
    const sameOrg = similarityScore(anchor, ev({ id: "o", slug: "o", catId: "talk", area: "Yishun", organiserId: "b1", dateISO: far }), NOW);
    expect(sameCat).toBeGreaterThan(sameArea);
    expect(sameArea).toBeGreaterThan(sameOrg);
    expect(sameOrg).toBeGreaterThan(0);
  });

  it("adds date proximity that decays to zero across 14 days", () => {
    const near = similarityScore(anchor, ev({ id: "n", slug: "n", catId: "talk", area: "Yishun", dateISO: "2026-07-11" }), NOW);
    const edge = similarityScore(anchor, ev({ id: "e", slug: "e", catId: "talk", area: "Yishun", dateISO: "2026-07-23" }), NOW);
    const boundary = similarityScore(anchor, ev({ id: "b", slug: "b", catId: "talk", area: "Yishun", dateISO: "2026-07-24" }), NOW);
    const outside = similarityScore(anchor, ev({ id: "x", slug: "x", catId: "talk", area: "Yishun", dateISO: "2026-08-30" }), NOW);
    expect(near).toBeGreaterThan(edge);
    expect(edge).toBeGreaterThan(0);
    expect(boundary).toBe(0); // exactly 14 days out — decayed to nothing
    expect(outside).toBe(0);
  });
});

describe("similarEvents", () => {
  const anchor = ev({ id: "a", slug: "a", catId: "bazaar", area: "Geylang Serai", dateISO: "2026-07-10", organiserId: "b1" });

  it("ranks by score and caps at the limit", () => {
    const pool = [
      anchor,
      ev({ id: "best", slug: "best", catId: "bazaar", area: "Geylang Serai", dateISO: "2026-07-12", organiserId: "b1" }),
      ev({ id: "good", slug: "good", catId: "bazaar", area: "Yishun", dateISO: "2026-07-12" }),
      ev({ id: "meh", slug: "meh", catId: "talk", area: "Geylang Serai", dateISO: "2026-09-01" }),
      ev({ id: "past", slug: "past", catId: "bazaar", area: "Geylang Serai", dateISO: "2026-01-01" }),
      ev({ id: "unrelated", slug: "unrelated", catId: "talk", area: "Yishun", dateISO: "2026-10-01" }),
    ];
    const out = similarEvents(anchor, pool, 3, NOW);
    expect(out.map((e) => e.id)).toEqual(["best", "good", "meh"]);
  });

  it("returns an empty list when nothing is related", () => {
    const pool = [ev({ id: "u", slug: "u", catId: "talk", area: "Yishun", dateISO: "2026-10-01" })];
    expect(similarEvents(anchor, pool, 4, NOW)).toEqual([]);
  });
});
