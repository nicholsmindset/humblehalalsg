import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray parent lockfile otherwise
  // makes Next infer the wrong root).
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // LiteAPI/Cupid hotel photo CDN. Hotel images are served UNOPTIMIZED
      // (see lib/img.ts) to stay under Vercel's image quota — they bypass the
      // optimizer — but the pattern is kept for safety / any optimized use.
      { protocol: "https", hostname: "static.cupid.travel" },
      // Supabase Storage — re-hosted business photos from the image-enrichment
      // pass (scripts/enrich-images.mjs). Our own project domain.
      { protocol: "https", hostname: "*.supabase.co" },
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
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
