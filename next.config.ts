import type { NextConfig } from "next";
import { seoRedirects, seoRewrites } from "./lib/redirects";

// Security headers applied to every route (security audit H5). The CSP is kept
// deliberately conservative — it sets ONLY the directives that have no fallback
// collateral, so it cannot break Next.js inline scripts/styles, Leaflet tiles,
// Unsplash images, Stripe.js or Supabase/LiteAPI calls. (No `default-src` on
// purpose — that would block all those cross-origin resources.) It still gives
// clickjacking defence, base-tag-injection defence, plugin lockout and HTTPS
// upgrade. geolocation stays enabled (maps / qibla / "near me").
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
];

const supabaseImageHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname;
  } catch {
    return "";
  }
})();

// Staged CSP hardening (the enforced CSP above has no script-src). We ship a FULL
// allowlist in Report-Only FIRST to collect real-traffic violations (AdSense/GTM/
// Analytics/Clerk/Supabase/maps/Turnstile) before enforcing it (see the security
// plan). Report-Only cannot break anything — the browser only posts reports to
// /api/csp-report. Hosts derived where possible; 'unsafe-inline' script-src is
// required by Next's inline RSC payload on static/ISR pages + the GTM bootstrap.
const SUPABASE_HOST = supabaseImageHost || "vzlcplizpkmvjspmqwns.supabase.co";
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://googleads.g.doubleclick.net https://adservice.google.com https://*.adtrafficquality.google https://clerk.humblehalal.com https://challenges.cloudflare.com https://va.vercel-scripts.com",
  `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://clerk.humblehalal.com https://clerk-telemetry.com https://www.googletagmanager.com https://www.google-analytics.com https://*.analytics.google.com https://*.google-analytics.com https://stats.g.doubleclick.net https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://vitals.vercel-insights.com https://va.vercel-scripts.com https://challenges.cloudflare.com`,
  `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://images.unsplash.com https://static.cupid.travel https://${SUPABASE_HOST} https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.googleusercontent.com https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com https://*.adtrafficquality.google https://td.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com https://clerk.humblehalal.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob: https:",
  "manifest-src 'self'",
  "report-uri /api/csp-report",
  "report-to csp",
].join("; ");

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray parent lockfile otherwise
  // makes Next infer the wrong root).
  turbopack: {
    root: __dirname,
  },
  // CI (.github/workflows/ci.yml) already runs `npm run typecheck` as a real
  // merge gate on every push/PR. Re-running the ~90s type check inside every
  // Vercel build is pure duplicate CPU — skip it here, not in CI.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Flat-URL migration (301s) + the cuisine/category rewrite — see lib/redirects.ts.
  async redirects() {
    return seoRedirects();
  },
  async rewrites() {
    return seoRewrites();
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // LiteAPI/Cupid hotel photo CDN. Hotel images are served UNOPTIMIZED
      // (see lib/img.ts) to stay under Vercel's image quota — they bypass the
      // optimizer — but the pattern is kept for safety / any optimized use.
      { protocol: "https", hostname: "static.cupid.travel" },
      // Supabase Storage — re-hosted business photos from the image-enrichment
      // pass (scripts/enrich-images.mjs). Scoped to OUR project host when the
      // env var is present at build time (a `*.supabase.co` wildcard would let
      // any Supabase project on the internet burn our image-optimizer quota);
      // wildcard only as a fallback for env-less local/CI builds.
      { protocol: "https", hostname: supabaseImageHost || "*.supabase.co" },
    ],
    // Cost controls for Vercel Image Optimization (Hobby quota). A long cache TTL
    // avoids re-optimizing the same image (fewer cache writes); trimmed size lists
    // cut the width variants generated per optimized image; webp-only avoids
    // avif's heavier transforms. Bulk hotel images skip all this (unoptimized).
    minimumCacheTTL: 2678400, // 31 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [96, 200, 400],
    formats: ["image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // Report-Only staging of the full allowlist (see SUPABASE_HOST block).
          { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
          { key: "Reporting-Endpoints", value: 'csp="/api/csp-report"' },
        ],
      },
    ];
  },
};

export default nextConfig;
