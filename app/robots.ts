import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

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
  "/travel",                        // travel/hotel vertical is dormant for launch
  "/api/travel",                    // prevent crawling disabled provider routes
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

// Explicit allows that must win over "/*?" — the icon files Next serves with a
// cache-busting ?hash (app/icon.svg, app/apple-icon) would otherwise be blocked
// by the query-string disallow, so Google can't fetch the favicon for Search.
// A longer, more-specific Allow beats "/*?" under Google's longest-match rule.
// (/favicon.ico + the public/ PNGs are already query-less, but listed for clarity.)
const ALLOW = ["/", "/favicon.ico", "/icon.svg", "/apple-icon"];

export default function robots(): MetadataRoute.Robots {
  return {
    // The wildcard rule welcomes search and answer-engine crawlers. Repeating
    // this same rule for every named bot only bloats the generated file.
    rules: { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
