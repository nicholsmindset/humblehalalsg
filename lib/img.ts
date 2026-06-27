/* Images that should bypass Vercel's image optimizer.

   The LiteAPI / Cupid hotel-photo CDN (static.cupid.travel) serves thousands of
   unique, already-web-sized hotel photos. Running each through next/image makes
   Vercel generate an optimization transformation + cache write per variant,
   which blows the Hobby image quota. Serving those directly (unoptimized) drops
   the bulk of that usage. NOTE: the Hobby image-optimization quota is currently
   exhausted, so /_next/image returns HTTP 402 for EVERY request — including our
   Unsplash decorative/hero images, which then fail to render entirely. Until the
   project moves to Vercel Pro (quota restored), Unsplash is also served
   unoptimized so those images show; remove it from this list to re-enable
   optimization once the quota is back. */
const UNOPTIMIZED_IMAGE_HOSTS = ["static.cupid.travel", "images.unsplash.com"];

export function isUnoptimizedImageSrc(src?: string | null): boolean {
  if (!src) return false;
  return UNOPTIMIZED_IMAGE_HOSTS.some((h) => src.startsWith(`https://${h}/`));
}
