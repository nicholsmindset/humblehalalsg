/* Backfill missing hawker-centre coordinates/addresses via OneMap (Singapore's
   official geocoder — precise address-level results, no token required for
   search). Mirrors scripts/geocode-listings.mjs but targets `hawker_centres`.

   The v3 seed carries hand-filled data for well-known centres; anything still
   missing lat/lng (or an address) — e.g. very new centres or NEA-synced rows —
   gets resolved here from address → centre name (first hit wins). Fills only
   the MISSING fields; never overwrites existing values.

   Usage:
     node scripts/geocode-hawker.mjs           # dry run — report only
     node scripts/geocode-hawker.mjs --write   # write back to Supabase

   Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local works
   via `node --env-file=.env.local scripts/geocode-hawker.mjs`). */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (try node --env-file=.env.local …)");
  process.exit(1);
}
const WRITE = process.argv.includes("--write");
const sb = createClient(url, key);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// SG bounding box sanity check so a bad geocode can't fling a pin to Johor.
const inSG = (lat, lng) => lat > 1.15 && lat < 1.48 && lng > 103.6 && lng < 104.1;

// "1 GEYLANG SERAI" → "1 Geylang Serai" (keep block numbers as-is).
const titleCase = (s) =>
  String(s).toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).trim();

async function onemap(q) {
  const res = await fetch(
    `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
    { headers: process.env.ONEMAP_TOKEN ? { Authorization: process.env.ONEMAP_TOKEN } : {}, signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const r = Array.isArray(data?.results) ? data.results[0] : null;
  if (!r?.LATITUDE || !r?.LONGITUDE) return null;
  const lat = +(+r.LATITUDE).toFixed(6);
  const lng = +(+r.LONGITUDE).toFixed(6);
  if (!inSG(lat, lng)) return null;
  // Compose a display address from OneMap's parts when available.
  const road = r.ROAD_NAME && r.ROAD_NAME !== "NIL" ? titleCase(r.ROAD_NAME) : "";
  const blk = r.BLK_NO && r.BLK_NO !== "NIL" ? r.BLK_NO : "";
  const postal = r.POSTAL && /^\d{6}$/.test(r.POSTAL) ? r.POSTAL : "";
  const address = road ? `${[blk, road].filter(Boolean).join(" ")}${postal ? `, Singapore ${postal}` : ""}` : "";
  return { lat, lng, address };
}

const { data: rows, error } = await sb
  .from("hawker_centres")
  .select("id, name, address, lat, lng")
  .or("lat.is.null,lng.is.null,address.is.null");
if (error) { console.error("Query failed:", error.message); process.exit(1); }

console.log(`→ ${rows.length} hawker centres missing coords/address${WRITE ? "" : " (dry run — pass --write to persist)"}`);
let ok = 0, miss = 0;
for (const c of rows) {
  // Best → weakest query: stored address, then the centre's name (OneMap knows
  // hawker centres as buildings, so a bare name search usually resolves).
  const queries = [c.address, c.name].filter(Boolean);
  let hit = null;
  for (const q of queries) {
    try { hit = await onemap(String(q)); } catch { /* try next */ }
    if (hit) break;
    await sleep(250);
  }
  if (!hit) { miss++; console.log(`  · no match: ${c.name}`); continue; }
  ok++;
  // Fill only what's missing — never overwrite curated values.
  const patch = {};
  if (c.lat == null || c.lng == null) { patch.lat = hit.lat; patch.lng = hit.lng; }
  if (!c.address && hit.address) patch.address = hit.address;
  if (!Object.keys(patch).length) { console.log(`  · nothing to fill: ${c.name}`); continue; }
  if (WRITE) {
    const { error: upErr } = await sb.from("hawker_centres").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", c.id);
    if (upErr) console.log(`  · write failed: ${c.name}: ${upErr.message}`);
    else console.log(`  ✓ ${c.name} → ${JSON.stringify(patch)}`);
  } else {
    console.log(`  (dry) ${c.name} → ${JSON.stringify(patch)}`);
  }
  await sleep(300); // be polite to OneMap
}
console.log(`✓ resolved ${ok}/${rows.length} (${miss} unmatched)${WRITE ? " — written" : ""}`);
