/* Images that should bypass Vercel's image optimizer.

   The LiteAPI / Cupid hotel-photo CDN (static.cupid.travel) serves thousands of
   unique, already-web-sized hotel photos. Running each through next/image makes
   Vercel generate an optimization transformation + cache write per variant,
   which blows the Hobby image quota. Serving those directly (unoptimized) drops
   the bulk of that usage; we keep next/image optimization for our handful of
   curated hero / Unsplash images (low volume, real LCP benefit). */
const UNOPTIMIZED_IMAGE_HOSTS = ["static.cupid.travel"];

export function isUnoptimizedImageSrc(src?: string | null): boolean {
  if (!src) return false;
  return UNOPTIMIZED_IMAGE_HOSTS.some((h) => src.startsWith(`https://${h}/`));
}
