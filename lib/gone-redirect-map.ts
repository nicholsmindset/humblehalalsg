/* Lean redirect lookup for the middleware (proxy.ts). Deliberately does NOT
   import the resolver library or seo-pages (which would bloat the middleware
   bundle) — it only reads the public `redirects` table via a direct anon client
   and caches the whole map in memory for 60s, so a live content request costs an
   in-memory Map.get, and the table is queried at most once per minute per
   instance. Fails open (no redirect) on any error. */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TTL_MS = 60_000;

let cache: { at: number; map: Map<string, string> } | null = null;

async function loadMap(): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  if (!url || !anon) return m;
  try {
    const sb = createClient(url, anon, { auth: { persistSession: false } });
    const { data } = await sb.from("redirects").select("from_path, to_path").limit(5000);
    for (const r of data ?? []) {
      if (r.from_path && r.to_path) m.set(String(r.from_path), String(r.to_path));
    }
  } catch {
    /* fail open — a DB blip must never break page serving */
  }
  return m;
}

/** The 301 target for an exact path, or null. Map is cached in-memory for 60s. */
export async function redirectFor(pathname: string): Promise<string | null> {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    cache = { at: now, map: await loadMap() };
  }
  return cache.map.get(pathname) ?? null;
}
