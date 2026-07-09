import "server-only";
/* Humble Halal — /ask concierge agent (Vercel AI SDK ToolLoopAgent), the
   directory twin of lib/travel-agent. GROUNDED: the searchDirectory tool only
   returns real listings (slug-addressed) with their stated halal tier — the
   model recommends from tool results and never invents places or asserts
   certification. Reuses the travel searchHotels tool for stay-shaped asks. */
import { ToolLoopAgent, tool, type InferAgentUIMessage } from "ai";
import { z } from "zod";
import { AI_MODEL } from "@/lib/ai";
import { getDirectory } from "@/lib/directory";
import { scoreListing } from "@/lib/halal-score";
import { searchHotels } from "@/lib/travel-agent/tools";
import type { Listing } from "@/lib/types";

const tierOf = (l: Listing): string =>
  l.badges.includes("muis") && l.verify?.certNo ? "MUIS Certified"
    : l.badges.includes("admin") ? "Admin Verified"
      : l.badges.includes("owned") ? "Muslim-owned (self-declared)"
        : l.badges.includes("pending") ? "Pending verification"
          : "Self-declared";

// Coarse keyword ranking (same approach as /api/concierge's fallback).
function rank(listings: Listing[], q: string): Listing[] {
  const toks = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (!toks.length) return [...listings].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const score = (l: Listing) => {
    const hay = `${l.name} ${l.cuisine} ${l.area} ${l.cat} ${(l.tags || []).join(" ")}`.toLowerCase();
    return toks.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0) + (l.featured ? 0.5 : 0);
  };
  return [...listings].map((l) => [l, score(l)] as const).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([l]) => l);
}

const searchDirectory = tool({
  description:
    "Search Humble Halal's verified Singapore halal directory (restaurants, cafés, groceries, beauty, services, weddings and more). Returns real listings with their stated halal tier (MUIS Certified / Admin Verified / Muslim-owned / self-declared), prayer-space availability and a link. ALWAYS use this for any 'where can I…' request about Singapore — never answer from memory.",
  inputSchema: z.object({
    query: z.string().describe("What the user wants, e.g. 'nasi padang Tampines' or 'bridal makeup Geylang'"),
    area: z.string().optional().describe("Singapore area/neighbourhood to filter by, if given"),
    prayerSpace: z.boolean().optional().describe("Only places with prayer space"),
    muslimOwned: z.boolean().optional().describe("Only Muslim-owned businesses"),
    certifiedOnly: z.boolean().optional().describe("Only MUIS-certified / admin-verified places"),
  }),
  execute: async ({ query, area, prayerSpace, muslimOwned, certifiedOnly }) => {
    const all = await getDirectory();
    let r = rank(all, [query, area].filter(Boolean).join(" "));
    if (area) r = r.filter((l) => l.area.toLowerCase().includes(area.toLowerCase()));
    if (prayerSpace) r = r.filter((l) => l.prayer);
    if (muslimOwned) r = r.filter((l) => l.badges.includes("owned"));
    if (certifiedOnly) r = r.filter((l) => l.badges.some((b) => b === "muis" || b === "admin"));
    const places = r.slice(0, 6).map((l) => {
      const hs = scoreListing(l);
      return {
        slug: l.slug,
        name: l.name,
        area: l.area,
        category: l.cat,
        cuisine: l.cuisine || "",
        halalTier: tierOf(l),
        halalScore: hs.tier === "declared" || hs.tier === "pending" ? null : hs.score,
        prayerSpace: !!l.prayer,
        rating: l.reviews > 0 ? l.rating : null,
        reviews: l.reviews,
        image: l.image || "",
        url: `/business/${l.slug}`,
      };
    });
    if (!places.length) {
      return { ok: false as const, message: "No listings matched — suggest the user tries a nearby area or broader cuisine.", places: [] };
    }
    return { ok: true as const, places };
  },
});

const TOOLS = { searchDirectory, searchHotels };

const INSTRUCTIONS = [
  "You are the Humble Halal concierge — a warm, practical assistant helping Muslims in Singapore find halal food, Muslim-owned services and Muslim-friendly stays.",
  "",
  "TOOLS — always use them; NEVER invent places, prices or halal status:",
  "- searchDirectory: anything in Singapore (food, groceries, beauty, services, weddings…).",
  "- searchHotels: hotels/stays for travel (Umrah, holidays) — anywhere in the world.",
  "",
  "HOW TO HELP:",
  "- Search first, then write a SHORT, friendly summary (1-3 sentences) of the best matches, naming them in the sentence. The UI already renders a card for every result — with its name, link, area and halal tier — so do NOT re-list the results.",
  "- Multi-turn: refine on follow-ups ('cheaper', 'nearer Bugis', 'with parking') by searching again with tighter filters.",
  "- Ask at most ONE clarifying question, and only when you genuinely can't search.",
  "",
  "FORMAT — plain conversational text only:",
  "- Do NOT use markdown: no headings (#, ##, ###), no horizontal rules (---), no numbered or bulleted lists, no markdown links like [name](url), no bold (**).",
  "- Just write natural sentences. The cards below your message carry the names, links and details.",
  "",
  "HALAL INTEGRITY (non-negotiable):",
  "- We are a discovery platform, NOT a certifier. State each place's tier exactly as returned (MUIS Certified / Muslim-owned / self-declared) and remind users to confirm certification on the official MUIS HalalSG register.",
  "- If nothing fits, say so honestly — never pad with weak matches.",
].join("\n");

/** Stable instance purely for inferring the UIMessage type (tools fix the shape). */
const typingAgent = new ToolLoopAgent({ model: AI_MODEL, instructions: "", tools: TOOLS });
export type ConciergeUIMessage = InferAgentUIMessage<typeof typingAgent>;

export function buildConcierge() {
  return new ToolLoopAgent({ model: AI_MODEL, instructions: INSTRUCTIONS, tools: TOOLS });
}
