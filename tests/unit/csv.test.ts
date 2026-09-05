import { describe, expect, it } from "vitest";
import { csvCell } from "@/lib/csv";

describe("csvCell", () => {
  it("quotes values and escapes embedded quotes", () => {
    expect(csvCell('Humble "Halal", SG')).toBe('"Humble ""Halal"", SG"');
    expect(csvCell(null)).toBe('""');
  });

  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)", "\t=1+1", "  =1+1"])(
    "neutralizes spreadsheet formula %j",
    (value) => {
      expect(csvCell(value)).toBe(`"'${value}"`);
    },
  );

  it("does not alter formula characters in the middle of text", () => {
    expect(csvCell("guest@example.com")).toBe('"guest@example.com"');
  });
});
