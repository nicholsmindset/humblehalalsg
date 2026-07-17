/* Humble Halal — seed the REAL directory from sg_halal_mixed_300.xlsx (298 SG
   halal / Muslim-owned / Muslim-friendly businesses). Upserts into Supabase
   `businesses` on `slug` (re-runnable). Each business gets a confirmed-loading
   category image now; scripts/enrich-images.mjs upgrades to real photos later.
   Geocodes by postal via OSM Nominatim (cached) so pins show on /map.

   Usage:  node scripts/seed-spreadsheet.mjs            (geocode + upsert)
           GEOCODE=0 node scripts/seed-spreadsheet.mjs  (skip geocoding)
           DRY=1 node scripts/seed-spreadsheet.mjs      (parse+map, no DB write)
   Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local. */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const XLSX = fileURLToPath(new URL("../sg_halal_mixed_300.xlsx", import.meta.url));
const ENV = fileURLToPath(new URL("../.env.local", import.meta.url));
const GEOCACHE = fileURLToPath(new URL("./.geocode-cache.json", import.meta.url));
const DRY = process.env.DRY === "1";
const DO_GEO = process.env.GEOCODE !== "0";

/* ---- env ---- */
function loadEnv() {
  const out = {};
  if (!existsSync(ENV)) return out;
  for (const line of readFileSync(ENV, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = { ...loadEnv(), ...process.env };

/* ---- xlsx (inline strings) via `unzip -p` — no deps ---- */
const decode = (s) =>
  (s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .trim();
const colIdx = (ref) => {
  let s = 0;
  for (const ch of ref.match(/^[A-Z]+/)[0]) s = s * 26 + (ch.charCodeAt(0) - 64);
  return s - 1;
};
function readRows() {
  const xml = execSync(`unzip -p "${XLSX}" xl/worksheets/sheet1.xml`, { maxBuffer: 64 * 1024 * 1024 }).toString("utf8");
  const rows = [];
  for (const rowm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    const cre = /<c r="([A-Z]+)\d+"[^>]*?(?:t="([^"]*)")?>(?:<is><t[^>]*>([\s\S]*?)<\/t><\/is>|<v>([\s\S]*?)<\/v>)?<\/c>/g;
    let c;
    while ((c = cre.exec(rowm[1]))) cells[colIdx(c[1])] = decode(c[3] != null ? c[3] : c[4] != null ? c[4] : "");
    const max = Object.keys(cells).length ? Math.max(...Object.keys(cells).map(Number)) + 1 : 0;
    rows.push(Array.from({ length: max }, (_, i) => cells[i] || ""));
  }
  return rows;
}

/* ---- mappers ---- */
const slugify = (s = "") =>
  s.toLowerCase().normalize("NFKD").replace(/['’]/g, "").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function mapCat(c) {
  const s = (c || "").toLowerCase();
  if (s.includes("beauty")) return "beauty";
  if (/modest|hijab|prayerwear|apparel|sportswear/.test(s)) return "fashion";
  if (/grocer|butcher|supermarket|marketplace|frozen|wholesaler|deli/.test(s)) return "groceries";
  if (s.includes("home services")) return "services";
  if (/health|medical|scalp|skincare|haircare/.test(s)) return "health";
  if (/^(café|cafe|dessert|bakery|specialty|themed|rooftop)/.test(s)) return "cafes";
  if (/restaurant|buffet|food hall|food court/.test(s)) return "restaurants";
  if (s.includes("café") || s.includes("cafe")) return "cafes";
  return "restaurants";
}
function mapHalal(d) {
  const s = (d || "").toLowerCase();
  if (s.includes("muis")) return { tier: "muis", attr: null };
  if (s.includes("owned")) return { tier: "declared", attr: "muslim-owned" };
  if (s.includes("friendly")) return { tier: "declared", attr: "muslim-friendly" };
  return { tier: "declared", attr: null };
}
function mapArea(i) {
  const s = (i || "").trim();
  if (!s || /^(multiple|online|tbd)$/i.test(s)) return null;
  return s;
}
const postalFrom = (addr = "", g = "") =>
  (String(g).match(/\b(\d{6})\b/) || String(addr).match(/\b(\d{6})\b/) || [])[1] || null;

/* ---- images: seeded rows carry NO stock photos. An empty photos array renders
   the branded BusinessMediaFallback; the only path to a cover photo is a real one
   via scripts/enrich-images.mjs or an owner/admin upload ("never a misleading
   stock photo" — see components/screens/admin-businesses.tsx). ---- */

/* ---- geocode (OSM Nominatim, cached, 1.1s/req) ---- */
const cache = existsSync(GEOCACHE) ? JSON.parse(readFileSync(GEOCACHE, "utf8")) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function geocode(postal, address) {
  const key = postal || address;
  if (!key) return null;
  if (cache[key] !== undefined) return cache[key];
  const q = postal ? `${postal} Singapore` : `${address}, Singapore`;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=sg&q=${encodeURIComponent(q)}`,
      { headers: { "user-agent": "humblehalal-seed/1.0 (admin@humblehalal.com)" } });
    const j = await res.json();
    cache[key] = j?.[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
  } catch {
    cache[key] = null;
  }
  writeFileSync(GEOCACHE, JSON.stringify(cache));
  await sleep(1100);
  return cache[key];
}

/* ---- main ---- */
async function main() {
  const rows = readRows().slice(2); // drop title + subtitle rows
  const data = rows.filter((r) => (r[1] || "").trim()); // must have a name (col B)
  console.log(`→ parsed ${data.length} businesses from spreadsheet`);

  const slugs = new Set();
  const unmappedCat = new Set();
  const out = [];
  let geoHit = 0;

  for (const r of data) {
    const name = r[1].trim();
    const rawCat = (r[2] || "").trim();
    const cat = mapCat(rawCat);
    if (cat === "restaurants" && rawCat && !/restaurant|buffet|food|café|cafe/i.test(rawCat)) unmappedCat.add(rawCat);
    const { tier, attr } = mapHalal(r[3]);
    const address = (r[5] || "").trim();
    const postal = postalFrom(address, r[6]);
    const desc = [r[4], r[11]].map((x) => (x || "").trim()).filter(Boolean).join(" · ") || null;

    let slug = slugify(name) || `business-${out.length + 1}`;
    if (slugs.has(slug)) { let n = 2; while (slugs.has(`${slug}-${n}`)) n++; slug = `${slug}-${n}`; }
    slugs.add(slug);

    const attrs = [];
    if (attr) attrs.push(attr);

    let coords = null;
    if (DO_GEO && postal) { coords = await geocode(postal, address); if (coords) geoHit++; }

    out.push({
      slug, name,
      area: mapArea(r[8]),
      cat_id: cat,
      subcategory_id: rawCat || null,
      description: desc,
      address: address || null,
      postal: postal || null,
      halal_tier: tier,
      attributes: attrs,
      status: "published",
      source: "spreadsheet",
      featured: false,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      // no `photos` key: inserts get the column default '[]' (branded fallback);
      // upserts leave any enriched/uploaded photos on existing rows untouched.
    });
  }

  console.log(`→ mapped: ${out.length} rows | geocoded ${geoHit}/${out.length} | unmapped categories: ${unmappedCat.size ? [...unmappedCat].join(", ") : "none"}`);
  const byCat = {};
  for (const o of out) byCat[o.cat_id] = (byCat[o.cat_id] || 0) + 1;
  console.log("→ by category:", byCat);
  console.log("→ sample:", JSON.stringify(out[0], null, 0).slice(0, 300));

  if (DRY) { console.log("DRY=1 → not writing to DB."); return; }

  const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("✗ missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  console.log(`→ upserting to ${url.replace(/^https:\/\//, "").slice(0, 24)}… (service role)`);
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // `address` column may not exist yet (added by a later migration) — probe + strip if absent.
  const probe = await sb.from("businesses").select("address").limit(1);
  const hasAddress = !probe.error;
  if (!hasAddress) { for (const r of out) { delete r.address; delete r.postal; } console.log("→ note: no `address`/`postal` column yet (apply migration 0035) — seeding without them; re-run after to fill."); }

  // Purge the old MOCK directory (source='seed' = the lib/data.ts listings). Keep owner/community rows.
  if (process.env.PURGE_MOCK !== "0") {
    const { count: mockCount } = await sb.from("businesses").select("*", { count: "exact", head: true }).eq("source", "seed");
    const { error: delErr } = await sb.from("businesses").delete().eq("source", "seed");
    if (delErr) { console.error("✗ purge mock failed:", delErr.message); process.exit(1); }
    console.log(`→ purged ${mockCount ?? "?"} mock 'seed' rows`);
  }

  // ADDR_ONLY=1 → backfill ONLY address/postal via UPDATE (preserves photos the
  // enrichment pass upgraded; partial upsert can't be used — it'd fail name NOT NULL).
  if (process.env.ADDR_ONLY === "1") {
    console.log("→ ADDR_ONLY: UPDATE address/postal by slug (photos untouched).");
    let done = 0, miss = 0;
    for (let i = 0; i < out.length; i += 25) {
      const batch = out.slice(i, i + 25);
      const res = await Promise.all(batch.map((r) =>
        sb.from("businesses").update({ address: r.address ?? null, postal: r.postal ?? null }).eq("slug", r.slug)));
      for (const x of res) { if (x.error) miss++; else done++; }
      console.log(`  updated ${Math.min(i + 25, out.length)}/${out.length}`);
    }
    console.log(`✓ address/postal backfilled: ${done} ok, ${miss} errored.`);
    return;
  }

  let upserted = 0;
  for (let i = 0; i < out.length; i += 100) {
    const batch = out.slice(i, i + 100);
    const { error, count } = await sb.from("businesses").upsert(batch, { onConflict: "slug", count: "exact" });
    if (error) { console.error(`✗ batch ${i}-${i + batch.length} failed:`, error.message); process.exit(1); }
    upserted += count ?? batch.length;
    console.log(`  upserted ${Math.min(i + 100, out.length)}/${out.length}`);
  }

  const { count: total } = await sb.from("businesses").select("*", { count: "exact", head: true }).eq("source", "spreadsheet");
  console.log(`✓ done. ${upserted} upserted. businesses(source=spreadsheet) now = ${total}.`);
}

main().catch((e) => { console.error("✗ seed-spreadsheet failed:", e); process.exit(1); });
