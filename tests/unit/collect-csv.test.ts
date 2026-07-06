import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/csv";
import { slugify as slugifyApp } from "@/lib/slug";
// The collect pipeline's helpers (ESM script, no app imports at module top).
import { slugify, csvCell, toCsv, pickOfficial, findPhone } from "../../scripts/collect/lib.mjs";

describe("collect/lib slug parity", () => {
  it("matches lib/slug.ts exactly (dedup keys must line up with the server)", () => {
    for (const name of ["Cafe Barakah", "Al-Amin Mart & Deli", "Warong Nasi Pariaman", "Nur’s Kitchen"]) {
      expect(slugify(name)).toBe(slugifyApp(name));
    }
  });
});

describe("collect/lib CSV writer round-trips through parseCsv", () => {
  it("escapes commas, quotes and newlines so the admin import re-parses them", () => {
    const headers = ["name", "address", "description"];
    const rows = [
      { name: 'Cafe "Nur"', address: "1 Bedok Rd, #01-01", description: "line1\nline2" },
      { name: "Plain", address: "", description: "" },
    ];
    const grid = parseCsv(toCsv(headers, rows));
    expect(grid[0]).toEqual(headers);
    expect(grid[1]).toEqual(['Cafe "Nur"', "1 Bedok Rd, #01-01", "line1\nline2"]);
    expect(grid[2]).toEqual(["Plain", "", ""]);
  });
  it("leaves simple cells unquoted", () => {
    expect(csvCell("Tampines")).toBe("Tampines");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell(null)).toBe("");
  });
});

describe("collect/lib official-site guards", () => {
  it("skips aggregators/socials and matches the business's own domain", () => {
    const results = [
      { url: "https://www.tripadvisor.com/x" },
      { url: "https://cafebarakah.example.sg/" },
    ];
    expect(pickOfficial(results, "Cafe Barakah")?.url).toBe("https://cafebarakah.example.sg/");
    expect(pickOfficial([{ url: "https://facebook.com/x" }], "Cafe Barakah")).toBeNull();
  });
  it("reads a Singapore phone, ignoring 6-digit postals", () => {
    expect(findPhone("Call us +65 6123 4567 today")).toBe("+65 6123 4567");
    expect(findPhone("Singapore 460123 only")).toBeNull();
  });
});
