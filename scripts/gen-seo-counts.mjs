/* Humble Halal — precompute live directory counts for pSEO page gating.
   `lib/seo-pages.ts` must stay synchronous (client components import it), so
   area×category page gating reads a committed JSON snapshot of the LIVE
   directory instead of the mock seed. Run before deploys; commit the JSON.
   Usage:  node scripts/gen-seo-counts.mjs */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ENV = fileURLToPath(new URL("../.env.local", import.meta.url));
const OUT = fileURLToPath(new URL("../lib/seo-counts.json", import.meta.url));

const env = {};
if (existsSync(ENV)) for (const l of readFileSync(ENV, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("✗ Supabase env missing — leaving lib/seo-counts.json untouched"); process.exit(0); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await sb
  .from("businesses")
  .select("area,cat_id")
  .eq("status", "published");
if (error) { console.error("✗", error.message); process.exit(1); }

const byAreaCat = {};
const byCat = {};
for (const b of data) {
  if (!b.cat_id) continue;
  byCat[b.cat_id] = (byCat[b.cat_id] || 0) + 1;
  if (!b.area) continue;
  (byAreaCat[b.area] ||= {})[b.cat_id] = (byAreaCat[b.area][b.cat_id] || 0) + 1;
}

writeFileSync(OUT, JSON.stringify({ byAreaCat, byCat }, null, 2) + "\n");
console.log(`✓ ${data.length} published businesses → ${Object.keys(byAreaCat).length} areas, ${Object.keys(byCat).length} categories → lib/seo-counts.json`);
