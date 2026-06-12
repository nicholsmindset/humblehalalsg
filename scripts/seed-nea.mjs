/* Humble Halal — seed candidate businesses from the OPEN data.gov.sg
   "NEA Licensed Eating Establishments" dataset (Singapore Open Data Licence v1.0,
   commercial use OK, attribution required). Writes to a STAGING file only —
   never to the live directory. Admin reviews + MUIS-verifies before publishing.

   Usage:  node scripts/seed-nea.mjs [limit]
   No API key required. Node 18+ (global fetch).

   NOTE (no Google Maps): this is the legally-clean seed base. Halal status is
   NOT in this data — it's added later by admin MUIS verification + community UGC.
*/
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RESOURCE_ID = "d_227473e811b09731e64725f140b77697"; // NEA Licensed Eating Establishments
const API = "https://data.gov.sg/api/action/datastore_search";
const ATTRIBUTION =
  "Contains information from NEA Licensed Eating Establishments accessed via data.gov.sg, licensed under the Singapore Open Data Licence v1.0.";
const OUT = fileURLToPath(new URL("../data/staging/nea.json", import.meta.url));

const limit = Math.min(Number(process.argv[2] || 50), 1000);

const pick = (rec, keys) => {
  for (const k of Object.keys(rec)) {
    const lk = k.toLowerCase();
    if (keys.some((want) => lk.includes(want))) return rec[k];
  }
  return undefined;
};
const postalFrom = (addr = "") => (String(addr).match(/\b(\d{6})\b/) || [])[1] || null;
const slugify = (str = "") =>
  str.toLowerCase().normalize("NFKD").replace(/['’]/g, "").replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  const url = `${API}?resource_id=${RESOURCE_ID}&limit=${limit}`;
  console.log(`→ Fetching ${limit} NEA records from data.gov.sg …`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ data.gov.sg responded ${res.status}. The resource id may have changed —`);
    console.error(`  browse https://data.gov.sg and update RESOURCE_ID in this script.`);
    process.exit(1);
  }
  const json = await res.json();
  const records = json?.result?.records ?? [];
  if (!records.length) {
    console.error("✗ No records returned. Inspect the API response shape.");
    process.exit(1);
  }

  console.log(`✓ ${records.length} raw records. Detected fields: ${Object.keys(records[0]).join(", ")}`);

  const staged = records.map((rec, i) => {
    const name = pick(rec, ["business_name", "premises_name", "licensee_name", "licensee", "name"]) || `Establishment ${i + 1}`;
    const address = pick(rec, ["premises_address", "address", "location"]) || "";
    const licence = pick(rec, ["licence_number", "licence_num", "license_number"]) || null;
    return {
      staging_id: `nea-${licence || i}`,
      name: String(name).trim(),
      slug: slugify(String(name)),
      address: String(address).trim(),
      postal: postalFrom(address),
      nea_licence_no: licence,
      source: "nea",
      status: "staging", // never auto-published
      category_suggested: "food-drink", // refined by enrich-categories + admin
      coords: null, // filled by geocode-onemap
      halal: null, // unknown — set on admin MUIS verification
      provenance: { dataset: "NEA Licensed Eating Establishments", resource_id: RESOURCE_ID, via: "data.gov.sg" },
      raw: rec,
    };
  });

  // de-dup by postal+name within this batch
  const seen = new Set();
  const deduped = staged.filter((r) => {
    const key = `${r.postal || ""}|${r.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const payload = {
    generated_at: new Date().toISOString(),
    source: "data.gov.sg / NEA Licensed Eating Establishments",
    attribution: ATTRIBUTION,
    total_available: json?.result?.total ?? null,
    count: deduped.length,
    records: deduped,
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2));
  console.log(`✓ Wrote ${deduped.length} staged candidates → ${OUT}`);
  console.log(`  (${json?.result?.total ?? "?"} total available in the dataset)`);
  console.log(`  Next: geocode-onemap → dedupe → admin review + MUIS verify → publish.`);
  console.log(`  Attribution: ${ATTRIBUTION}`);
}

main().catch((e) => {
  console.error("✗ seed-nea failed:", e.message);
  process.exit(1);
});
