import { describe, it, expect } from "vitest";
import { TOOLS, toolMatches, getTool } from "../../lib/tools";

const bySlug = (slug: string) => {
  const t = getTool(slug);
  if (!t) throw new Error(`missing tool: ${slug}`);
  return t;
};

describe("toolMatches", () => {
  it("matches the plural of a singular title word (the reported bug)", () => {
    // Placeholder suggests "ingredients"; the title says "ingredient".
    const t = bySlug("ingredient-checker");
    expect(toolMatches(t, "ingredients")).toBe(true);
    expect(toolMatches(t, "ingredient")).toBe(true);
  });

  it("matches local/alternate names via keywords", () => {
    expect(toolMatches(bySlug("inheritance"), "faraid")).toBe(true);
    expect(toolMatches(bySlug("qibla"), "kiblat")).toBe(true);
    expect(toolMatches(bySlug("tasbih"), "misbaha")).toBe(true);
    expect(toolMatches(bySlug("prayer-times"), "solat")).toBe(true);
    expect(toolMatches(bySlug("mosque-finder"), "masjid")).toBe(true);
  });

  it("tolerates punctuation and casing", () => {
    expect(toolMatches(bySlug("ingredient-checker"), "E-Number")).toBe(true);
    expect(toolMatches(bySlug("ingredient-checker"), "e number")).toBe(true);
  });

  it("requires every word in a multi-word query to hit", () => {
    expect(toolMatches(bySlug("halal-food"), "halal food")).toBe(true);
    expect(toolMatches(bySlug("prayer-times"), "prayer times")).toBe(true);
    // "prayer sushi" — second word matches nothing.
    expect(toolMatches(bySlug("prayer-times"), "prayer sushi")).toBe(false);
  });

  it("empty query matches everything", () => {
    expect(TOOLS.every((t) => toolMatches(t, ""))).toBe(true);
    expect(TOOLS.every((t) => toolMatches(t, "   "))).toBe(true);
  });

  it("every placeholder-suggested term returns at least one live tool", () => {
    // The search input placeholder advertises these — none should dead-end.
    const suggested = ["quran", "zakat", "prayer times", "qibla", "ingredients"];
    const live = TOOLS.filter((t) => t.live);
    for (const term of suggested) {
      expect(live.some((t) => toolMatches(t, term)), `no match for "${term}"`).toBe(true);
    }
  });
});
