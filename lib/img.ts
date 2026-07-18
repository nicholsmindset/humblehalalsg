/* Images that should bypass Vercel's image optimizer.

   The LiteAPI / Cupid hotel-photo CDN (static.cupid.travel) serves thousands of
   unique, already-web-sized hotel photos. Running each through next/image makes
   Vercel generate an optimization transformation + cache write per variant,
   which would consume a large amount of image-optimization quota for little
   benefit (they're already web-sized) — so we keep these unoptimized regardless
   of plan (deliberate cost management, not a quota-exhaustion workaround).

   The project is on Vercel Pro (optimizer quota restored), so our own finite,
   size-varied imagery — Unsplash hero/decorative images and Supabase-hosted
   business/listing photos — is now OPTIMIZED again (responsive WebP → smaller
   LCP transfers). It was previously force-bypassed only because the Hobby quota
   was exhausted and /_next/image returned HTTP 402. */
const UNOPTIMIZED_IMAGE_HOSTS = ["static.cupid.travel"];

// Suffix match for hosts whose subdomain is dynamic. Empty now that Supabase
// photos are optimized again on Pro (add a suffix here to bypass a host).
const UNOPTIMIZED_IMAGE_HOST_SUFFIXES: string[] = [];

export function isUnoptimizedImageSrc(src?: string | null): boolean {
  if (!src) return false;
  // Site-relative, pre-optimized static assets (already WebP + sized at build,
  // e.g. blog feature images in /public/blog). These would otherwise route
  // through /_next/image, which returns HTTP 402 while the Hobby optimizer
  // quota is exhausted — so a relative src is NOT "nothing to bill against";
  // it breaks like every other optimized image. Serve them directly.
  if (
    src.startsWith("/blog/") ||
    src.startsWith("/mosques/") ||
    src.startsWith("/authors/") ||
    src.startsWith("/brands/")
  ) return true;
  let host: string;
  try {
    host = new URL(src).hostname;
  } catch {
    // Other relative/malformed src — no host for the optimizer to resolve.
    return false;
  }
  return (
    UNOPTIMIZED_IMAGE_HOSTS.includes(host) ||
    UNOPTIMIZED_IMAGE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
  );
}
