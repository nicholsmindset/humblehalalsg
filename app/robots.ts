import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

const PRIVATE = ["/admin", "/owner", "/dashboard", "/checkout", "/login"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // Explicitly welcome AI/answer-engine crawlers (GEO) to public content.
      { userAgent: "GPTBot", allow: "/", disallow: PRIVATE },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: PRIVATE },
      { userAgent: "ChatGPT-User", allow: "/", disallow: PRIVATE },
      { userAgent: "PerplexityBot", allow: "/", disallow: PRIVATE },
      { userAgent: "Perplexity-User", allow: "/", disallow: PRIVATE },
      { userAgent: "ClaudeBot", allow: "/", disallow: PRIVATE },
      { userAgent: "Claude-Web", allow: "/", disallow: PRIVATE },
      { userAgent: "Google-Extended", allow: "/", disallow: PRIVATE },
      { userAgent: "Applebot-Extended", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
