import { z } from "zod";

/* TikTok UGC (Track B). A creator/user submits a TikTok URL about a listing; an
   AI classifies it (food/place-related? safe? which business?) as a DRAFT; an
   admin approves; approved videos render on the listing as consent-gated embeds
   with attribution. Mirrors lib/listing-enrich.ts.

   HALAL-SAFETY: the AI never asserts halal certification and never auto-publishes.
   A video is just user commentary — approval attaches it to a listing, it does
   NOT change the listing's halal status. Every video is human-reviewed. */

// ── URL parsing ────────────────────────────────────────────────────────────
export interface ParsedTikTok {
  valid: boolean;
  canonical: string;   // normalised URL (query stripped)
  videoId: string;     // numeric id, or "" for short links we can't embed yet
  handle: string;      // @handle without the @, or ""
  short: boolean;      // vt.tiktok.com / /t/ short link → needs admin to resolve
}

/** Parse + validate a TikTok URL. Accepts full (`/@user/video/123…`) and short
 *  (`vt.tiktok.com/…`, `/t/…`) links. Only full links carry an embeddable
 *  video id; short links are accepted but flagged `short` for admin follow-up. */
export function parseTikTokUrl(raw: string): ParsedTikTok {
  const out: ParsedTikTok = { valid: false, canonical: "", videoId: "", handle: "", short: false };
  const trimmed = String(raw || "").trim();
  if (!trimmed) return out;
  let u: URL;
  try { u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`); } catch { return out; }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const isTikTok = host === "tiktok.com" || host.endsWith(".tiktok.com");
  if (!isTikTok) return out;

  out.canonical = `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/$/, "");
  const videoMatch = u.pathname.match(/\/video\/(\d{6,25})/);
  const handleMatch = u.pathname.match(/\/@([\w.]{1,40})/);
  if (handleMatch) out.handle = handleMatch[1];
  if (videoMatch) { out.videoId = videoMatch[1]; out.valid = true; return out; }

  // Short link (vt.tiktok.com/XXXX, tiktok.com/t/XXXX) — valid submission, but
  // we can't extract a video id client-side, so mark it for admin resolution.
  if (host.startsWith("vt.") || /^\/t\//.test(u.pathname) || /^\/[\w-]{6,20}\/?$/.test(u.pathname)) {
    out.short = true; out.valid = true; return out;
  }
  return out;
}

/** Build the canonical embeddable URL for a business handle + video id. */
export function embedUrl(handle: string, videoId: string): string {
  return `https://www.tiktok.com/@${handle || "placeholder"}/video/${videoId}`;
}

/** Normalise an admin-entered business reference to a slug. Admins naturally
 *  paste the full listing URL ("https://…/business/atrium-restaurant") into the
 *  attach field — accept that, a bare slug, or a slug with stray slashes.
 *  Anything that still isn't a slug falls through to the no-match error. */
export function normalizeBusinessSlugInput(raw: string): string {
  let s = String(raw || "").trim();
  if (!s) return "";
  s = s.split("?")[0].split("#")[0];
  const m = s.match(/\/business\/([^/]+)\/?$/);
  if (m) return m[1].toLowerCase();
  return s.replace(/^\/+|\/+$/g, "").toLowerCase();
}

// ── AI classification ──────────────────────────────────────────────────────
export const TiktokSchema = z.object({
  foodRelated: z.boolean().describe("True if the video is about a specific food business, dish, café, restaurant, hawker stall, or eating experience in Singapore. False for unrelated/generic content."),
  matchedBusinessSlug: z.string().describe("The slug of the ONE candidate business this video is about, chosen ONLY from the provided candidate list. Empty string if none of the candidates clearly match."),
  confidence: z.number().min(0).max(1).describe("0-1 confidence that matchedBusinessSlug is correct. Use <0.5 when unsure."),
  captionSummary: z.string().describe("One factual sentence (max ~120 chars) describing what the video shows, grounded ONLY in the handle/caption/note provided. No invented dishes or claims."),
  sentiment: z.enum(["positive", "neutral", "negative", "unknown"]).describe("Overall sentiment toward the business, if discernible; otherwise 'unknown'."),
  safe: z.boolean().describe("True if the content is appropriate to feature on a family-friendly halal directory (no hate, adult, unsafe, or off-brand content). False if unsure."),
  reason: z.string().describe("Short reason for the match/no-match and safety decision (max ~160 chars)."),
});

export type TiktokClassification = z.infer<typeof TiktokSchema>;

export const TIKTOK_SYSTEM_PROMPT = `You are a moderation assistant for Humble Halal, Singapore's trusted halal & Muslim-owned business directory. Users submit TikTok videos about food places; you produce a DRAFT classification that a human will review. Nothing you output is published automatically.

STRICT RULES — this is a trust product:
1. Match ONLY to a business in the provided candidate list, by slug. If nothing clearly matches, return an empty matchedBusinessSlug and low confidence. Never invent a slug.
2. Use ONLY the facts provided (URL, handle, caption, submitter note). Do NOT invent dishes, prices, awards, or halal-certification claims. Featuring a video does NOT certify the business as halal.
3. Be conservative on safety: if you cannot tell the content is appropriate for a family-friendly Muslim audience, set safe=false.
4. Keep summaries factual, short, and neutral. No hype.

Return only the structured fields requested.`;

export function tiktokUserPrompt(input: {
  url: string;
  handle?: string | null;
  note?: string | null;
  claimedBusinessName?: string | null;
  candidates: { slug: string; name: string; area?: string | null; category?: string | null }[];
}): string {
  const cand = input.candidates.length
    ? input.candidates.map((c) => `- slug="${c.slug}" · ${c.name}${c.area ? ` · ${c.area}` : ""}${c.category ? ` · ${c.category}` : ""}`).join("\n")
    : "(no candidates found)";
  const facts = [
    `TikTok URL: ${input.url}`,
    input.handle ? `Creator handle: @${input.handle}` : "",
    input.claimedBusinessName ? `Submitter says it's about: ${input.claimedBusinessName}` : "",
    input.note ? `Submitter note: ${input.note}` : "",
  ].filter(Boolean).join("\n");
  return `Classify this TikTok submission and match it to at most ONE candidate business (by slug).\n\n${facts}\n\nCandidate businesses:\n${cand}`;
}

/** Approval-time gate: block a draft that is unsafe or not food-related.
 *  Returns a reason string when blocked, else null. */
export function tiktokComplianceIssue(gen: TiktokClassification): string | null {
  if (!gen.safe) return "AI flagged this video as not clearly appropriate for a family-friendly halal audience. Review the video before approving.";
  if (!gen.foodRelated) return "AI could not confirm this video is about a food business. Review before approving.";
  return null;
}
