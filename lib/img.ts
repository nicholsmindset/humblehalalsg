/* Images that should bypass Vercel's image optimizer.

   The LiteAPI / Cupid hotel-photo CDN (static.cupid.travel) serves thousands of
   unique, already-web-sized hotel photos. Running each through next/image makes
   Vercel generate an optimization transformation + cache write per variant,
   which blows the Hobby image quota. Serving those directly (unoptimized) drops
   the bulk of that usage. NOTE: the Hobby image-optimization quota is currently
   exhausted, so /_next/image returns HTTP 402 for EVERY request — including our
   Unsplash decorative/hero images AND the re-hosted business photos in Supabase
   Storage, which then fail to render entirely (broken listing-card images). Until
   the project moves to Vercel Pro (quota restored), these are served unoptimized
   so the images show; remove a host below to re-enable optimization once the
   quota is back. */
const UNOPTIMIZED_IMAGE_HOSTS = ["static.cupid.travel", "images.unsplash.com"];

// Suffix match for hosts whose subdomain is dynamic. Our Supabase project domain
// is `<ref>.supabase.co` — business photos live in its Storage bucket and must
// also bypass the (exhausted) optimizer, or /_next/image returns HTTP 402.
const UNOPTIMIZED_IMAGE_HOST_SUFFIXES = [".supabase.co"];

export function isUnoptimizedImageSrc(src?: string | null): boolean {
  if (!src) return false;
  // Site-relative, pre-optimized static assets (already WebP + sized at build,
  // e.g. blog feature images in /public/blog). These would otherwise route
  // through /_next/image, which returns HTTP 402 while the Hobby optimizer
  // quota is exhausted — so a relative src is NOT "nothing to bill against";
  // it breaks like every other optimized image. Serve them directly.
  if (src.startsWith("/blog/") || src.startsWith("/mosques/")) return true;
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
