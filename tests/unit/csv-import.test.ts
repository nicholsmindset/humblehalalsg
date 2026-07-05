import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/csv";
import { mapCat, mapHalalHint, mapArea, postalFrom } from "@/lib/import-mapping";

describe("parseCsv (RFC-4180)", () => {
  it("parses plain rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });
  it("handles quoted fields with commas and escaped quotes", () => {
    expect(parseCsv('name,addr\n"Cafe ""Nur""","1 Bedok Rd, #01-01"')).toEqual([
      ["name", "addr"],
      ['Cafe "Nur"', "1 Bedok Rd, #01-01"],
    ]);
  });
  it("keeps newlines inside quotes", () => {
    expect(parseCsv('a\n"line1\nline2"')).toEqual([["a"], ["line1\nline2"]]);
  });
  it("handles CRLF endings and drops blank rows", () => {
    expect(parseCsv("a,b\r\n1,2\r\n\r\n , \r\n3,4")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
  });
});

describe("import mapping", () => {
  it("maps free-text categories to canonical ids", () => {
    expect(mapCat("Restaurant — Buffet")).toBe("restaurants");
    expect(mapCat("cafes")).toBe("cafes"); // already canonical stays put
    expect(mapCat("Halal Butcher")).toBe("groceries");
    expect(mapCat("")).toBe("restaurants"); // fallback
  });
  it("never grants a verified tier from spreadsheet text", () => {
    expect(mapHalalHint("MUIS certified").hint).toMatch(/verify on HalalSG/);
    expect(mapHalalHint("Muslim-owned")).toEqual({ hint: null, attr: "muslim-owned" });
  });
  it("blanks non-areas", () => {
    expect(mapArea("Multiple")).toBeNull();
    expect(mapArea("Bedok")).toBe("Bedok");
  });
  it("extracts 6-digit postals from either field", () => {
    expect(postalFrom("460123", "")).toBe("460123");
    expect(postalFrom("", "1 Bedok Rd Singapore 460123")).toBe("460123");
    expect(postalFrom("12345", "no postal here")).toBeNull();
  });
});
