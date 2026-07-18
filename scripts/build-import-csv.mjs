/* Humble Halal — OUTPUT stage of the business-collection pipeline.
   Turns data/staging/enriched.json into a clean CSV that is BOTH your spreadsheet
   AND exactly what the admin "Import CSV" panel ingests
   (app/api/admin/import → staging_businesses → review queue → approve).

   The 14 headers and the validation rules below mirror
   public/templates/business-import-template.csv and app/api/admin/import/route.ts,
   so every row this emits either imports cleanly or is dropped here with a reason.

   Also writes a companion <name>-verify.csv listing the MUIS cert numbers the
   browser-harness HalalSG collector found — the admin uses that for the SEPARATE,
   human-gated verification step (app/api/admin/verify). Cert numbers deliberately
   do NOT ride the import CSV; the pipeline never auto-grants a verified tier.

   Usage:  node scripts/build-import-csv.mjs [--out=path.csv] */
import { args, slugify, stagingPath, readJson, toCsv } from "./collect/lib.mjs";
import { writeFileSync } from "node:fs";

const ENRICHED = stagingPath("enriched.json");
const HEADERS = [
  "name", "category", "area", "address", "postal", "phone", "website",
  "description", "price_level", "halal", "attributes", "photo_url", "lat", "lng",
];
const httpOk = (v) => /^https?:\/\//i.test(String(v || ""));

/** Map an enriched candidate's halal hint → the CSV vocab mapHalalHint understands
 *  (lib/import-mapping.ts keys on "muis"/"owned"/"friendly"). Hint only. */
function halalWord(c) {
  const hint = `${c.halalHint || ""} ${(c.attributes || []).join(" ")}`.toLowerCase();
  if (hint.includes("muis")) return "muis-certified";
  if (hint.includes("owned")) return "muslim-owned";
  if (hint.includes("friendly")) return "muslim-friendly";
  return "";
}

function main() {
  const A = args();
  const date = new Date().toISOString().slice(0, 10);
  const OUT = A.out || stagingPath(`import-${date}.csv`);
  const VERIFY_OUT = OUT.replace(/\.csv$/i, "-verify.csv");

  const records = readJson(ENRICHED)?.records || [];
  if (!records.length) { console.error(`✗ no enriched records — run enrich-candidates.mjs first (${ENRICHED})`); process.exit(1); }

  const rows = [];
  const verifyRows = [];
  const seen = new Set();
  const report = { ok: 0, duplicate: 0, dropped: 0, cleaned: 0 };
  const drops = [];

  for (const c of records) {
    const name = String(c.name || "").trim().slice(0, 120);
    if (!name) { report.dropped++; drops.push("(blank) — name required"); continue; }
    const slug = slugify(name);
    if (seen.has(slug)) { report.duplicate++; continue; }
    seen.add(slug);

    // Sanitize to the import route's rules: name is the only hard requirement, so
    // an invalid OPTIONAL field is blanked (not a whole-row drop) so the business
    // still imports. Each blanked field is counted so nothing is lost silently.
    let cleaned = false;
    const postal = /^\d{6}$/.test(String(c.postal || "")) ? String(c.postal) : (c.postal ? (cleaned = true, "") : "");
    const website = c.website && !httpOk(c.website) ? (cleaned = true, "") : (c.website || "");
    const photo_url = c.photo_url && !httpOk(c.photo_url) ? (cleaned = true, "") : (c.photo_url || "");
    const price = /^\${1,4}$/.test(String(c.price_level || "")) ? c.price_level : "";
    if (cleaned) { report.cleaned++; drops.push(`${name} — kept, blanked invalid field(s)`); }

    rows.push({
      name,
      category: c.category || "",
      area: c.area || "",
      address: c.address || "",
      postal,
      phone: c.phone || "",
      website,
      description: c.description || "",
      price_level: price,
      halal: halalWord(c),
      attributes: Array.isArray(c.attributes) ? c.attributes.join(",") : (c.attributes || ""),
      photo_url,
      lat: "", // geocoded later by scripts/geocode-listings.mjs
      lng: "",
    });
    report.ok++;

    if (c.certNo) verifyRows.push({ name, certNo: c.certNo, scheme: c.scheme || "", expiry: c.expiry || "", source: c.source || "" });
  }

  writeFileSync(OUT, toCsv(HEADERS, rows));
  console.log(`✓ wrote ${rows.length} rows → ${OUT}`);
  console.log(`  ok ${report.ok}, duplicate ${report.duplicate}, dropped ${report.dropped}, cleaned ${report.cleaned}`);
  if (drops.length) console.log("  notes:\n    " + drops.slice(0, 20).join("\n    ") + (drops.length > 20 ? `\n    …+${drops.length - 20} more` : ""));

  if (verifyRows.length) {
    const vHeaders = ["name", "certNo", "scheme", "expiry", "source"];
    writeFileSync(VERIFY_OUT, toCsv(vHeaders, verifyRows));
    console.log(`✓ ${verifyRows.length} MUIS cert hints → ${VERIFY_OUT} (for the admin Verify step, NOT the import)`);
  }

  console.log("\nNext:");
  console.log(`  1. Admin dashboard → Businesses → Import CSV → upload ${OUT.split("/").pop()}`);
  console.log("  2. Preview → Commit → rows land in the review queue → approve.");
  console.log("  3. For cert'd rows, grant MUIS via the admin Verify action (separate, human-gated).");
}

main();
