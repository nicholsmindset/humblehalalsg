import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { SITEMAP_SEGMENTS } from "@/lib/sitemaps";

/* Keep crawlers off app plumbing, private consoles, transactional flows and
   short-link redirects so crawl budget is spent on indexable content. Trailing
   "/" targets a subtree (e.g. "/tickets/") while leaving any marketing landing
   at the bare path (e.g. "/passport") crawlable. "/*?" drops faceted/tracking
   query-string URLs — all canonical content lives on clean paths. */
const DISALLOW = [
  "/api/",                          // 132 API endpoints
  "/admin",                         // admin console
  "/keystatic",                     // Keystatic CMS console
  "/owner",                         // business-owner console
  "/dashboard",                     // user dashboard
  "/login",                         // auth
  "/sign-in",                       // auth
  "/checkout",                      // payment
  "/success",                       // post-checkout
  "/travel/booking",                // hotel booking flow (+ /confirmation)
  "/travel/flights/booking",        // flight booking flow
  "/travel/flights/confirmation",   // flight confirmation
  "/travel/trips",                  // personal trips
  "/tickets/",                      // personal event tickets
  "/scorecard/",                    // tokenised scorecards
  "/passport/",                     // tokenised loyalty passes (landing /passport stays crawlable)
  "/saved",                         // personal saved list
  "/c/",                            // short-link redirect
  "/e/",                            // short-link redirect
  "/i/",                            // invite/short-link redirect
  "/r/",                            // short-link redirect
  "/tools/quran/search",            // search endpoint
  "/*?",                            // faceted / tracking query strings
];

// Answer-engine / AI crawlers we explicitly welcome to public content (GEO) —
// being cited by AI search drives qualified referral traffic for a directory.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-Web",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  const sitemaps = [
    `${SITE.url}/sitemap.xml`,
    ...SITEMAP_SEGMENTS.map((s) => `${SITE.url}/sitemap/${s}.xml`),
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_BOTS.map((ua) => ({ userAgent: ua, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: sitemaps,
    host: SITE.url,
  };
}
