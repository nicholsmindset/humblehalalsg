/* Humble Halal — DISCOVERY stage of the business-collection pipeline.
   Builds a de-duplicated candidate list into data/staging/candidates.json.
   Nothing here touches the live directory — candidates flow later through the
   existing admin CSV import → staging_businesses → review queue → approve.

   Usage:
     node scripts/collect-candidates.mjs --source=nea [--limit=50] [--dry]
     node scripts/collect-candidates.mjs --source=web --query="halal cafe Tampines singapore"
     node scripts/collect-candidates.mjs --source=halalsg   # merges browser-harness output
     node scripts/collect-candidates.mjs --source=nea,web --limit=30

   Sources
     nea      data.gov.sg NEA Licensed Eating Establishments (open data, no key)
     web      Firecrawl web search for candidate names (ToS-safe: names/addresses
              only; facts are verified from the business's OWN site downstream —
              we never scrape/mirror Google Maps result pages)
     halalsg  NOT scraped here — MUIS HalalSG blocks it. This source is produced
              by browser-harness on your Mac (a real, human-like browser) which
              writes data/staging/candidates-halalsg.json in the shared schema;
              we just merge + dedupe it. See docs/engineering/business-collector-harness.md

   Candidate shape: { name, address?, postal?, area?, category?, source,
                      halalHint?, certNo?, scheme?, expiry? }

   Env: FIRECRAWL_API_KEY (web only), NEXT_PUBLIC_SUPABASE_URL +
        SUPABASE_SERVICE_ROLE_KEY (dedup against live + queued listings). */
import {
  args, slugify, firecrawl, FC, pickOfficial,
  stagingPath, readJson, writeJson, supabaseAdmin, takenSlugs,
} from "./collect/lib.mjs";

const NEA_RESOURCE = "d_227473e811b09731e64725f140b77697";
const NEA_API = "https://data.gov.sg/api/action/datastore_search";
const CANDIDATES = stagingPath("candidates.json");
const HALALSG_IN = stagingPath("candidates-halalsg.json");

const A = args();
const LIMIT = Number(A.limit) || 50;
const DRY = !!A.dry;
const SOURCES = String(A.source || "nea").split(",").map((s) => s.trim()).filter(Boolean);

const postalFrom = (addr = "") => (String(addr).match(/\b(\d{6})\b/) || [])[1] || null;
const pick = (rec, keys) => {
  for (const k of Object.keys(rec)) {
    const lk = k.toLowerCase();
    if (keys.some((w) => lk.includes(w))) return rec[k];
  }
  return undefined;
};

/* ── NEA open data → candidates ── */
async function fromNea() {
  const url = `${NEA_API}?resource_id=${NEA_RESOURCE}&limit=${LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`data.gov.sg ${res.status} — resource id may have changed`);
  const json = await res.json();
  const records = json?.result?.records ?? [];
  return records.map((rec) => {
    const name = String(pick(rec, ["business_name", "premises_name", "licensee_name", "licensee", "name"]) || "").trim();
    const address = String(pick(rec, ["premises_address", "address", "location"]) || "").trim();
    return {
      name,
      address: address || undefined,
      postal: postalFrom(address) || undefined,
      category: "restaurants", // NEA = licensed eating establishments
      source: "nea",
    };
  }).filter((c) => c.name);
}

/* ── Firecrawl web search → candidate names (light, ToS-safe) ── */
async function fromWeb() {
  if (!FC) throw new Error("FIRECRAWL_API_KEY not set (needed for --source=web)");
  const query = String(A.query || "").trim();
  if (!query) throw new Error('--source=web needs --query="…"');
  const s = await firecrawl("search", { query, limit: Math.min(LIMIT, 20) });
  const out = [];
  for (const r of s?.data || []) {
    const official = pickOfficial([r], query); // skip aggregators/socials/maps
    if (!official) continue;
    // Use the page title (trimmed of common suffixes) as the candidate name.
    const name = String(r.title || "").split(/[|\-–—]/)[0].replace(/\b(singapore|halal|official|home)\b/gi, "").trim();
    if (name.length < 3) continue;
    out.push({ name, source: "web" });
  }
  return out;
}

/* ── browser-harness HalalSG output → candidates (merge only) ── */
function fromHalalsg() {
  const data = readJson(HALALSG_IN);
  if (!data) {
    console.warn(`· no ${HALALSG_IN} yet — run the browser-harness HalalSG task on your Mac first`);
    return [];
  }
  const records = Array.isArray(data) ? data : data.records || [];
  return records.map((r) => ({
    name: String(r.name || "").trim(),
    address: r.address || undefined,
    postal: r.postal || postalFrom(r.address) || undefined,
    area: r.area || undefined,
    category: r.category || undefined,
    source: "halalsg",
    halalHint: r.halalHint || "muis-certified (verify on HalalSG)",
    certNo: r.certNo || undefined,
    scheme: r.scheme || undefined,
    expiry: r.expiry || undefined,
  })).filter((c) => c.name);
}

async function main() {
  const collected = [];
  for (const src of SOURCES) {
    console.log(`→ discovering from '${src}'…`);
    if (src === "nea") collected.push(...await fromNea());
    else if (src === "web") collected.push(...await fromWeb());
    else if (src === "halalsg") collected.push(...fromHalalsg());
    else console.warn(`· unknown source '${src}' (use nea|web|halalsg)`);
  }

  // Merge with anything already collected, then dedupe by slug.
  const prev = readJson(CANDIDATES)?.records || [];
  const bySlug = new Map();
  for (const c of [...prev, ...collected]) {
    const slug = slugify(c.name);
    if (!slug) continue;
    // Prefer the richer / higher-trust record on collision (halalsg > others).
    const existing = bySlug.get(slug);
    if (!existing || (c.source === "halalsg" && existing.source !== "halalsg")) {
      bySlug.set(slug, { ...c, slug });
    }
  }

  // Drop anything already published or already in the review queue.
  const sb = await supabaseAdmin();
  if (!sb) console.warn("· Supabase env missing — skipping live/queue dedup (import will still catch dups)");
  const taken = await takenSlugs(sb, [...bySlug.keys()]);
  const kept = [...bySlug.values()].filter((c) => !taken.has(c.slug));
  const dropped = bySlug.size - kept.length;

  console.log(`✓ ${kept.length} candidates (${collected.length} newly discovered, ${dropped} already in directory/queue)`);
  const bySource = kept.reduce((m, c) => ((m[c.source] = (m[c.source] || 0) + 1), m), {});
  console.log(`  by source: ${JSON.stringify(bySource)}`);

  if (DRY) {
    console.log("  (--dry: not writing) sample:");
    console.log(JSON.stringify(kept.slice(0, 5), null, 2));
    return;
  }
  writeJson(CANDIDATES, {
    generated_at: new Date().toISOString(),
    count: kept.length,
    records: kept.map((c) => { const o = { ...c }; delete o.slug; return o; }), // slug is derived downstream; keep the file clean
  });
  console.log(`  wrote ${CANDIDATES}`);
  console.log(`  next: node scripts/enrich-candidates.mjs`);
}

main().catch((e) => { console.error("✗ collect-candidates failed:", e.message); process.exit(1); });
