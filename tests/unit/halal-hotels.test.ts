import { describe, it, expect } from "vitest";
import { EMPTY_FLAGS, hotelHalalScore, scoreBreakdown, type HotelFlags } from "../../lib/halal-hotels";
import { haversineM, nearestHaram, MASJID_NABAWI } from "../../lib/haversine";
import { KAABA } from "../../lib/qibla";

const flags = (over: Partial<HotelFlags> = {}): HotelFlags => ({ ...EMPTY_FLAGS, ...over });
const COORDS = {
  kaaba: KAABA,
  nabawi: MASJID_NABAWI,
  makkahHotel: { lat: 21.4200, lng: 39.8270 }, // a stone's throw from the Haram (~250m)
};

describe("scoreBreakdown — make the halal score legible", () => {
  it("empty overlay → base 28, no line items, total matches hotelHalalScore", () => {
    const b = scoreBreakdown(EMPTY_FLAGS);
    expect(b.base).toBe(28);
    expect(b.items).toHaveLength(0);
    expect(b.total).toBe(28);
    expect(b.total).toBe(hotelHalalScore(EMPTY_FLAGS));
  });

  it("each active flag adds its weighted points; total === hotelHalalScore", () => {
    const f = flags({ halal_food_onsite: true, has_prayer_room: true, alcohol_free: true });
    const b = scoreBreakdown(f);
    expect(b.total).toBe(hotelHalalScore(f)); // 28 + 22 + 16 + 15 = 81
    expect(b.total).toBe(81);
    expect(b.items.map((i) => i.points)).toEqual([22, 16, 15]); // sorted highest-weight first
  });

  it("only active flags appear in the breakdown", () => {
    const b = scoreBreakdown(flags({ qibla_direction: true }));
    expect(b.items).toEqual([{ label: "Qibla direction", points: 6 }]);
    expect(b.total).toBe(34);
  });
});

describe("haversine + nearestHaram — the Umrah distance signal", () => {
  it("distance from the Kaaba to itself is ~0", () => {
    expect(haversineM(COORDS.kaaba, COORDS.kaaba)).toBeCloseTo(0, 5);
  });

  it("a Makkah hotel near the Kaaba resolves to Masjid al-Haram, sub-kilometre", () => {
    const r = nearestHaram(COORDS.makkahHotel);
    expect(r?.haram.key).toBe("makkah");
    expect(r!.distanceM).toBeLessThan(1000);
  });

  it("a Madinah point resolves to Masjid an-Nabawi", () => {
    const r = nearestHaram(COORDS.nabawi);
    expect(r?.haram.key).toBe("madinah");
    expect(r!.distanceM).toBeLessThan(200);
  });

  it("a far-away city is NOT near any Haram (keeps the badge honest)", () => {
    expect(nearestHaram({ lat: 51.5074, lng: -0.1278 })).toBeNull(); // London
    expect(nearestHaram({ lat: 21.4858, lng: 39.1925 })).toBeNull(); // Jeddah (~70km from Makkah)
  });
});
