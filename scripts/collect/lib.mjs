/* Humble Halal — shared helpers for the business-discovery pipeline
   (collect-candidates → enrich-candidates → build-import-csv).

   Deliberately small and dependency-free (global fetch + @supabase/supabase-js
   only), mirroring scripts/enrich-*.mjs. The Firecrawl regexes/patterns here are
   copied from those scripts on purpose — a future refactor can consolidate them,
   but for now the collect pipeline stays self-contained.

   THE SEAM: both engines (Firecrawl here, browser-harness on your Mac) emit the
   same JSON shapes into data/staging/, so everything downstream is engine-blind.

     Candidate  { name, address?, postal?, area?, category?, source,
                  halalHint?, certNo?, scheme?, expiry? }
     Enriched   Candidate + { website?, phone?, description?, price_level?,
                  photo_url?, attributes?[], verify_note? }
*/
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { dirname } from "node:path";

/* ── env (same precedence as enrich-*.mjs: .env.local < ~/.env < process.env) ── */
function loadEnvFile(p) {
  const out = {};
  if (!existsSync(p)) return out;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
export const env = {
  ...loadEnvFile(fileURLToPath(new URL("../../.env.local", import.meta.url))),
  ...loadEnvFile(`${homedir()}/.env`),
  ...process.env,
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── data/staging paths ── */
export const STAGING = fileURLToPath(new URL("../../data/staging/", import.meta.url));
export const stagingPath = (name) => `${STAGING}${name}`;
export function readJson(path, fallback = null) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback;
}
export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

/* ── slug: MUST stay identical to lib/slug.ts (used for dedup keys only) ── */
export const slugify = (str = "") =>
  str.toLowerCase().normalize("NFKD").replace(/['’]/g, "").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/* ── Firecrawl (HTTP API, no SDK — same as scripts/enrich-*.mjs) ── */
export const FC = env.FIRECRAWL_API_KEY;
export async function firecrawl(path, body) {
  const res = await fetch(`https://api.firecrawl.dev/v1/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${FC}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`firecrawl ${path} ${res.status}`);
  return res.json();
}

/* ── official-site / contact extraction (copied from enrich-contacts.mjs) ── */
// Singapore phone: optional +65, then 8 digits starting 6/8/9. Avoid 6-digit postals.
const SG_PHONE = /(?:\+?65[\s-]?)?\b([689]\d{3})[\s-]?(\d{4})\b/;
export const DENY = /facebook|instagram|tiktok|tripadvisor|foursquare|zomato|burpple|google\.|goo\.gl|maps\.|ladyironchef|sethlui|danielfooddiary|misstamchiak|sgmagazine|eatbook|hungrygowhere|yelp|wikipedia|shopee|lazada|carousell|linkedin|youtube|wa\.me|whatsapp/i;

export function findPhone(text) {
  const m = (text || "").match(SG_PHONE);
  return m ? `+65 ${m[1]} ${m[2]}` : null;
}
// Only trust a result whose DOMAIN matches the business name (avoids picking a
// news/aggregator page as the "website"). Returns the result or null.
export function pickOfficial(results, name) {
  const tokens = (name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3);
  const compact = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const r of results || []) {
    try {
      const h = new URL(r.url).hostname.replace(/^www\./, "");
      if (DENY.test(h)) continue;
      const label = h.split(".")[0];
      if (tokens.some((t) => h.includes(t)) || (label.length > 3 && compact.includes(label))) return r;
    } catch { /* skip */ }
  }
  return null;
}
export const originOf = (r) => { try { return `https://${new URL(r.url).hostname.replace(/^www\./, "")}`; } catch { return null; } };

/** og:image from a Firecrawl search/scrape metadata blob. */
export function ogImage(meta) {
  const og = meta?.ogImage || meta?.["og:image"];
  return og && /^https:\/\/.+\.(jpe?g|png|webp)/i.test(og) ? og : null;
}

/* ── CSV writer (mirrors the shape lib/csv.ts parses) ── */
export function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function toCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => csvCell(row[h])).join(","));
  return lines.join("\n") + "\n";
}

/* ── Supabase (service role) + dedup against live + queued slugs ── */
export async function supabaseAdmin() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}
/** Slugs already live or already in the review queue — same check the admin
 *  CSV import does (app/api/admin/import/route.ts:63-68). Returns a Set. */
export async function takenSlugs(sb, slugs) {
  if (!sb || !slugs.length) return new Set();
  const [{ data: existing }, { data: staged }] = await Promise.all([
    sb.from("businesses").select("slug").in("slug", slugs),
    sb.from("staging_businesses").select("slug").in("slug", slugs).in("review_status", ["new", "reviewing"]),
  ]);
  return new Set([...(existing || []), ...(staged || [])].map((r) => String(r.slug)));
}

/* ── tiny argv parser: --key=value / --key / positional ── */
export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
    else out._.push(a);
  }
  return out;
}
