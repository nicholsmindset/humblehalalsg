import "server-only";

import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";

/* Mosque page overrides editable in Keystatic (content/mosques/*.json).
   An entry whose slug matches a mosque page slug (e.g. "masjid-sultan") overlays
   its photo + optional copy on top of the hardcoded profile in
   lib/mosque-content.ts — so the owner can add a mosque photo (and richer copy)
   without a code change. Reads happen at build/ISR time on the server only;
   content/mosques may not exist yet, so the reader fails soft to no overlays. */

const reader = createReader(process.cwd(), keystaticConfig);

export interface MosqueOverlay {
  image?: string;
  imageAlt?: string;
  imageCredit?: string;
  intro?: string;
}

const clean = (s?: string | null): string | undefined => {
  const t = (s ?? "").trim();
  return t.length ? t : undefined;
};

// fields.image stores a path under publicPath ("/mosques/"); normalise defensively
// in case a bare filename is ever returned.
const normImage = (v?: string | null): string | undefined => {
  const s = clean(v);
  if (!s) return undefined;
  if (s.startsWith("/") || s.startsWith("http")) return s;
  return `/mosques/${s}`;
};

async function loadOverlays(): Promise<Map<string, MosqueOverlay>> {
  const map = new Map<string, MosqueOverlay>();
  try {
    const entries = await reader.collections.mosques.all();
    for (const { slug, entry } of entries) {
      map.set(slug, {
        image: normImage(entry.image),
        imageAlt: clean(entry.imageAlt),
        imageCredit: clean(entry.imageCredit),
        intro: clean(entry.intro),
      });
    }
  } catch {
    // content/mosques absent or reader unavailable → no overlays.
  }
  return map;
}

/** All mosque overlays by slug (one reader pass — use in the sitemap loop). */
export async function getMosqueOverlays(): Promise<Map<string, MosqueOverlay>> {
  return loadOverlays();
}

/** Overlay for a single mosque slug (empty object when none). */
export async function getMosqueOverlay(slug: string): Promise<MosqueOverlay> {
  return (await loadOverlays()).get(slug) ?? {};
}
