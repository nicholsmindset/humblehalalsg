/* Backfill missing business coordinates via OneMap (Singapore's official
   geocoder — precise address-level results, no token required for search).

   The original seed only geocoded 6-digit POSTAL codes through OSM Nominatim,
   so businesses without a postal got lat/lng = null and silently vanish from
   the /explore and /map pins. This script finds those rows and geocodes them
   from address → postal → name+area (first hit wins).

   Usage:
     node scripts/geocode-listings.mjs           # dry run — report only
     node scripts/geocode-listings.mjs --write   # write lat/lng back to Supabase

   Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local works
   via `node --env-file=.env.local scripts/geocode-listings.mjs`). */
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
  return inSG(lat, lng) ? { lat, lng } : null;
}

const { data: rows, error } = await sb
  .from("businesses")
  .select("id, name, area, address, postal, lat, lng")
  .is("lat", null);
if (error) { console.error("Query failed:", error.message); process.exit(1); }

console.log(`→ ${rows.length} businesses without coordinates${WRITE ? "" : " (dry run — pass --write to persist)"}`);
let ok = 0, miss = 0;
for (const b of rows) {
  // Best → weakest query: full address, postal code, then name + area.
  const queries = [b.address, b.postal, [b.name, b.area, "Singapore"].filter(Boolean).join(" ")].filter(Boolean);
  let hit = null;
  for (const q of queries) {
    try { hit = await onemap(String(q)); } catch { /* try next */ }
    if (hit) break;
    await sleep(250);
  }
  if (!hit) { miss++; console.log(`  · no match: ${b.name} (${b.area || "?"})`); continue; }
  ok++;
  if (WRITE) {
    const { error: upErr } = await sb.from("businesses").update({ lat: hit.lat, lng: hit.lng }).eq("id", b.id);
    if (upErr) console.log(`  · write failed: ${b.name}: ${upErr.message}`);
    else console.log(`  ✓ ${b.name} → ${hit.lat}, ${hit.lng}`);
  } else {
    console.log(`  (dry) ${b.name} → ${hit.lat}, ${hit.lng}`);
  }
  await sleep(300); // be polite to OneMap
}
console.log(`✓ resolved ${ok}/${rows.length} (${miss} unmatched)${WRITE ? " — written" : ""}`);
