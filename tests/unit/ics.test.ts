import { describe, expect, it } from "vitest";
import { buildIcs } from "../../lib/ics";
import type { EventItem } from "../../lib/types";

function event(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "event-1",
    title: "Test event",
    catId: "community",
    cat: "Community",
    img: "",
    tone: "",
    free: true,
    priceFrom: 0,
    dateLabel: "1 August 2026",
    timeLabel: "7:00 PM – 9:00 PM",
    dateISO: "2026-08-01",
    venue: "Test venue",
    area: "Singapore",
    capacity: 100,
    taken: 0,
    organiserId: null,
    organiser: "Test organiser",
    organiserBiz: false,
    blurb: "Test description",
    tags: [],
    prayerNearby: false,
    halalCatering: false,
    featured: false,
    attendees: 0,
    ...overrides,
  };
}

describe("buildIcs", () => {
  it("keeps same-day event end times on the start date", () => {
    const ics = buildIcs(event());

    expect(ics).toContain("DTSTART:20260801T190000");
    expect(ics).toContain("DTEND:20260801T210000");
  });

  it("moves an overnight event end time to the following date", () => {
    const ics = buildIcs(event({ timeLabel: "10:00 PM – 1:00 AM", endsAt: "2026-08-01" }));

    expect(ics).toContain("DTSTART:20260801T220000");
    expect(ics).toContain("DTEND:20260802T010000");
  });

  it("uses the event end date for multi-day events", () => {
    const ics = buildIcs(event({ endsAt: "2026-08-03" }));

    expect(ics).toContain("DTSTART:20260801T190000");
    expect(ics).toContain("DTEND:20260803T210000");
  });

  it.each(["25:90 – 30:75", "7:00ish PM – later", "13:00 PM – 14:00 PM"])(
    "falls back to valid calendar times for malformed label %s",
    (timeLabel) => {
      const ics = buildIcs(event({ timeLabel }));

      expect(ics).toContain("DTSTART:20260801T090000");
      expect(ics).toContain("DTEND:20260801T100000");
    },
  );

  it("escapes every newline style inside text properties", () => {
    const ics = buildIcs(event({
      title: "First\r\nSecond\rThird\nFourth",
      blurb: "Details\rATTENDEE:mailto:unexpected@example.com",
    }));

    expect(ics).toContain("SUMMARY:First\\nSecond\\nThird\\nFourth\r\n");
    expect(ics).toContain("DESCRIPTION:Details\\nATTENDEE:mailto:unexpected@example.com\r\n");
    expect(ics).not.toContain("\rATTENDEE:");
  });
});
