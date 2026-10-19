import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extForType, sniffAllowed } from "@/lib/file-sniff";

/* Listing image enrichment (Phase 2 upscale + Phase 3 real-photo acquisition).
   Phase 3: find a real photo for a business via Firecrawl (its own site first,
   then a web search), re-host it to Supabase Storage so it renders through
   next/image. Phase 2: optionally upscale/clean via fal before re-hosting.

   Everything is graceful — no FIRECRAWL_API_KEY → no candidate; no FAL_KEY →
   skip upscale and keep the original. Never throws into a route. Mirrors the
   offline scripts/enrich-images.mjs, ported server-side + reviewable. */

const BUCKET = "business-photos";
const IMG_RE = /^https:\/\/.+\.(jpe?g|png|webp)/i;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const firecrawlConfigured = !!process.env.FIRECRAWL_API_KEY;
export const falConfigured = !!process.env.FAL_KEY;

async function firecrawl(path: string, body: unknown): Promise<Record<string, unknown> | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.firecrawl.dev/v1/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch { return null; }
}

const ogFrom = (meta: unknown): string | null => {
  const m = (meta || {}) as Record<string, unknown>;
  const og = (m.ogImage || m["og:image"]) as string | undefined;
  return og && IMG_RE.test(og) ? og : null;
};

/** Best-effort real photo URL for a business. Prefers its own website's og:image,
 *  then a halal-scoped web search. Null when unconfigured or nothing suitable. */
export async function findRealPhoto(name: string, website?: string | null): Promise<string | null> {
  if (!firecrawlConfigured) return null;
  // 1) The business's own site — most trustworthy, on-brand photo.
  if (website && /^https?:\/\//i.test(website)) {
    const sc = await firecrawl("scrape", { url: website, formats: ["markdown"] });
    const og = ogFrom((sc?.data as Record<string, unknown> | undefined)?.metadata);
    if (og) return og;
  }
  // 2) Web search fallback.
  const s = await firecrawl("search", { query: `${name} Singapore halal`, limit: 3, scrapeOptions: { formats: ["markdown"] } });
  const data = (s?.data as { metadata?: unknown; url?: string }[]) || [];
  for (const r of data) { const og = ogFrom(r.metadata); if (og) return og; }
  const top = data[0]?.url;
  if (top) {
    const sc = await firecrawl("scrape", { url: top, formats: ["markdown"] });
    const og = ogFrom((sc?.data as Record<string, unknown> | undefined)?.metadata);
    if (og) return og;
  }
  return null;
}

/** Phase 2 — optional upscale/clean via fal. Returns a new image URL, or the
 *  original when fal isn't configured or the call fails. Model is env-overridable. */
export async function upscaleImage(imageUrl: string): Promise<string> {
  const key = process.env.FAL_KEY;
  if (!key) return imageUrl;
  const model = process.env.FAL_UPSCALE_MODEL || "fal-ai/clarity-upscaler";
  try {
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Key ${key}` },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!res.ok) return imageUrl;
    const d = (await res.json()) as { image?: { url?: string }; images?: { url?: string }[] };
    return d.image?.url || d.images?.[0]?.url || imageUrl;
  } catch { return imageUrl; }
}

/** Download an image URL and re-host it to the public business-photos bucket.
 *  Returns the public URL, or null on failure. */
export async function rehostImage(sb: SupabaseClient, slug: string, imageUrl: string, suffix = "-cand"): Promise<string | null> {
  try {
    const buckets = await sb.storage.listBuckets();
    if (!buckets.data?.some((b) => b.name === BUCKET)) {
      await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});
    }
    const resp = await fetch(imageUrl);
    if (!resp.ok) return null;
    const declaredLength = Number(resp.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) return null;
    if (!resp.body) return null;

    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = resp.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks, total);
    if (buf.length < 3000) return null; // too small to be a real photo
    const sniffed = sniffAllowed(buf, ALLOWED_IMAGE_TYPES);
    if (!sniffed) return null;
    const ext = `.${extForType(sniffed)}`;
    const path = `${slug}${suffix}${ext}`;
    const up = await sb.storage.from(BUCKET).upload(path, buf, { contentType: sniffed, upsert: true });
    if (up.error) return null;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } catch { return null; }
}
