import { describe, it, expect } from "vitest";
import { ADDITIVES, STATUS_META, searchAdditives } from "../../lib/tools/ingredients";

/* Data-integrity guards for the ingredient/E-number halal checker. The dataset
   is the product; a bad status or a broken search would misinform users on a
   sensitive topic (halal/haram), so these lock the invariants. */

describe("ingredient dataset integrity", () => {
  it("has a meaningful number of entries", () => {
    expect(ADDITIVES.length).toBeGreaterThan(50);
  });

  it("every entry has a name, valid status, and non-trivial origin", () => {
    for (const a of ADDITIVES) {
      expect(a.name.trim().length).toBeGreaterThan(1);
      expect(STATUS_META[a.status]).toBeTruthy();
      expect(a.origin.trim().length).toBeGreaterThan(10);
    }
  });

  it("E-number codes are uppercase-E format and unique", () => {
    const codes = ADDITIVES.map((a) => a.code).filter(Boolean);
    for (const c of codes) expect(c).toMatch(/^E\d{3,4}[a-z]?$/);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("classifies the well-known cases correctly", () => {
    const byCode = (c: string) => ADDITIVES.find((a) => a.code === c);
    expect(byCode("E471")?.status).toBe("mushbooh"); // source-dependent emulsifier
    expect(byCode("E441")?.status).toBe("haram"); // gelatine
    expect(byCode("E120")?.status).toBe("haram"); // carmine/cochineal
    expect(byCode("E330")?.status).toBe("halal"); // citric acid
    expect(byCode("E100")?.status).toBe("halal"); // curcumin
  });
});

describe("searchAdditives", () => {
  it("matches by E-number with or without the leading E", () => {
    expect(searchAdditives("E471").some((a) => a.code === "E471")).toBe(true);
    expect(searchAdditives("471").some((a) => a.code === "E471")).toBe(true);
  });

  it("matches by common name and alias", () => {
    expect(searchAdditives("gelatine").some((a) => a.code === "E441")).toBe(true);
    expect(searchAdditives("gelatin").some((a) => a.code === "E441")).toBe(true);
    expect(searchAdditives("MSG").some((a) => a.code === "E621")).toBe(true);
    expect(searchAdditives("carmine").some((a) => a.status === "haram")).toBe(true);
  });

  it("returns the whole list for an empty query", () => {
    expect(searchAdditives("")).toHaveLength(ADDITIVES.length);
  });

  it("returns nothing for gibberish", () => {
    expect(searchAdditives("zzzznotreal")).toHaveLength(0);
  });
});
