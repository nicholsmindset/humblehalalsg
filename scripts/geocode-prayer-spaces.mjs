#!/usr/bin/env node
/* Regenerate the COORDS block in lib/prayer-spaces.ts by geocoding each musollah
   building via Singapore's OneMap search API (free, no key; building-level).
   Prints a TS COORDS map to stdout — review + paste into lib/prayer-spaces.ts.

   Usage: node scripts/geocode-prayer-spaces.mjs
   Note: OneMap rate-limits rapid calls, so this spaces requests ~650ms + retries. */

// id → best OneMap search term (curated where the raw name is ambiguous).
const QUERY = {
  "asia-square-tower-1": "Asia Square Tower 1", "centennial-tower": "Centennial Tower",
  "suntec-city-mall": "Suntec City Mall", "marina-square": "Marina Square", "city-square-mall": "City Square Mall",
  "deen-dunya-haji-lane": "Haji Lane", "duo-galleria": "DUO Galleria", "scape": "SCAPE",
  "fave-on-orchard": "Concorde Hotel Singapore", "united-square": "United Square", "lucky-plaza": "Lucky Plaza",
  "raffles-city": "Raffles City Shopping Centre", "bedok-mall": "Bedok Mall", "century-square": "Century Square",
  "causeway-point": "Causeway Point", "sembawang-shopping-centre": "Sembawang Shopping Centre",
  "jurong-point": "Jurong Point", "imm-building": "IMM Building", "westgate": "Westgate",
  "the-grandstand": "The Grandstand", "german-centre": "German Centre Singapore", "compass-one": "Compass One",
  "hougang-mall": "Hougang Mall", "nex-serangoon": "NEX", "northshore-plaza": "Northshore Plaza",
  "waterway-point": "Waterway Point", "vivocity": "VivoCity", "jewel-changi": "Jewel Changi Airport",
  "changi-t1": "Changi Airport Terminal 1", "changi-t2": "Changi Airport Terminal 2", "bishan-stadium": "Bishan Stadium",
  "mandai-wildlife-west": "Bird Paradise", "singapore-flyer": "Singapore Flyer", "ghim-moh-void-deck": "Block 2 Ghim Moh Road",
  "jamiyah-islamic-centre": "Jamiyah Singapore", "toa-payoh-safra": "SAFRA Toa Payoh", "mandai-zoo": "Singapore Zoo",
  "harbourfront-centre": "HarbourFront Centre", "mount-elizabeth-novena": "Mount Elizabeth Novena Hospital",
  "nuh": "National University Hospital", "haw-par-technocentre": "Haw Par Technocentre", "cintech-science-park": "Cintech Science Park",
  "jtc-summit": "JTC Summit", "bukit-batok-driving-centre": "Bukit Batok Driving Centre",
  "suss": "Singapore University of Social Sciences", "ite-college-west": "ITE College West",
  "temasek-poly": "Temasek Polytechnic", "ngee-ann-poly": "Ngee Ann Polytechnic",
  "sutd": "Singapore University of Technology and Design",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function geo(q, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=N&pageNum=1`);
      const txt = await res.text();
      if (txt.trim().startsWith("<")) { await sleep(1200); continue; } // rate-limited HTML
      const r = (JSON.parse(txt).results || [])[0];
      if (r?.LATITUDE) return { lat: +(+r.LATITUDE).toFixed(5), lng: +(+r.LONGITUDE).toFixed(5) };
      return null;
    } catch { await sleep(1000); }
  }
  return null;
}

const misses = [];
console.log("const COORDS: Record<string, LatLng> = {");
for (const [id, q] of Object.entries(QUERY)) {
  const c = await geo(q);
  if (c) console.log(`  "${id}": { lat: ${c.lat}, lng: ${c.lng} },`);
  else misses.push(id);
  await sleep(650);
}
console.log("};");
if (misses.length) console.error("MISSED (fix query):", misses.join(", "));
