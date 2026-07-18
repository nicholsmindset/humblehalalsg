/* Brand-styled hero-image prompt builder for blog posts (Phase 2 image pipeline).
   Pure — no server-only — so the generator script (scripts/gen-blog-images.mts)
   and any future route can share it. Bakes hard halal/brand guardrails into the
   prompt text (the fal text-to-image endpoint has no separate negative prompt). */

/** Humble Halal look: warm editorial photography, cream/teal/gold palette. */
const BRAND_STYLE =
  "Editorial blog hero photograph for a Singapore halal lifestyle brand. Warm natural light, " +
  "shallow depth of field, clean modern composition, inviting and trustworthy mood, soft brand " +
  "palette of warm cream (#F8F6F1), deep teal (#12525B) and subtle gold accents. Photorealistic, " +
  "high detail, generous negative space top-left for a headline overlay. 16:9 horizontal.";

/** Hard guardrails — always appended. Keeps output halal-appropriate + on-brand. */
const GUARDRAILS =
  "No text, no words, no letters, no logos, no watermarks. No alcohol, wine, beer, bars or " +
  "nightlife. No pork. Do NOT depict faces of people praying, any Quran/scripture text, Arabic " +
  "calligraphy, or religious figures. Respectful and tasteful.";

/** Per-category subject cue. Cuisine/questions lean on the specific keyword. */
function subjectFor(category: string, title: string, primaryKeyword: string): string {
  const kw = primaryKeyword.replace(/\bhalal\b/gi, "").replace(/\bsingapore\b/gi, "").trim() || title;
  switch (category) {
    case "cuisines":
      return `A beautifully plated halal ${kw} dish, top-down or three-quarter view, fresh and appetising, on a natural-toned table in Singapore.`;
    case "areas-malls":
      return `An inviting halal food spread in the foreground with a tasteful Singapore mall or neighbourhood dining setting softly blurred behind.`;
    case "muslim-travel":
      return `A serene Muslim-friendly travel scene — a tidy plated halal meal or a calm destination view, evoking ${kw}.`;
    case "muslim-services":
      return `An elegant, warm lifestyle still-life evoking a Muslim-owned service in Singapore (${kw}) — tasteful objects and soft styling, no people's faces.`;
    case "prayers-deen":
      return `A calm, reverent still-life — a folded prayer mat and wooden prayer beads by a sunlit window, or serene mosque architecture at soft light. No people, no scripture text.`;
    case "seasonal-events":
      return `A warm festive halal scene — dates, lanterns and a tasteful table setting evoking the season in Singapore. No people's faces.`;
    case "halal-questions":
      return `A clean, bright flat-lay of the food or ingredient in question (${kw}), generic and unbranded, on a marble or wooden surface.`;
    case "restaurants-cafes":
      return `A cosy halal café or restaurant table scene in Singapore — coffee, brunch plates and warm light.`;
    default:
      return `A tasteful halal food or lifestyle scene in Singapore evoking "${title}".`;
  }
}

export interface HeroPromptInput {
  title: string;
  category: string;
  primaryKeyword: string;
}

/** Assemble the full text-to-image prompt for a post's hero. */
export function buildHeroPrompt({ title, category, primaryKeyword }: HeroPromptInput): string {
  return `${BRAND_STYLE} ${subjectFor(category, title, primaryKeyword)} ${GUARDRAILS}`;
}
