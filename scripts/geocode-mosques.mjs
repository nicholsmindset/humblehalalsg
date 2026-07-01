/* Geocode the static mosque list (lib/data.ts) accurately via OSM Nominatim so
   the "nearest mosque" calc is correct (coords were approximate). Writes
   lib/mosque-coords.json { id: {lat,lng} }; lib/data.ts overlays it onto the
   mosque list. Read-only to the DB. Rate-limited (1.1s), cached. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DATA = fileURLToPath(new URL("../lib/data.ts", import.meta.url));
const OUT = fileURLToPath(new URL("../lib/mosque-coords.json", import.meta.url));
const src = readFileSync(DATA, "utf8");

// Extract mosque { id, name } entries from the mosques array.
const entries = [];
const re = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g;
let m;
const mosquesBlock = src.slice(src.indexOf("export const mosques"), src.indexOf("];", src.indexOf("export const mosques")));
while ((m = re.exec(mosquesBlock))) entries.push({ id: m[1], name: m[2] });
console.log(`→ ${entries.length} mosques to geocode`);

const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let hit = 0;
for (const e of entries) {
  if (cache[e.id]) { hit++; continue; }
  const q = `${e.name}, Singapore`;
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=sg&q=${encodeURIComponent(q)}`,
      { headers: { "user-agent": "humblehalal-mosque-geocode/1.0 (admin@humblehalal.com)" } });
    const j = await res.json();
    if (j?.[0]) { cache[e.id] = { lat: +(+j[0].lat).toFixed(5), lng: +(+j[0].lon).toFixed(5) }; hit++; }
    else console.log(`  · no match: ${e.name}`);
  } catch { console.log(`  · error: ${e.name}`); }
  writeFileSync(OUT, JSON.stringify(cache, null, 0));
  await sleep(1100);
}
console.log(`✓ geocoded ${hit}/${entries.length} → ${OUT}`);
