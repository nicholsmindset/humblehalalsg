/* Humble Halal — ENRICH + VERIFY stage of the business-collection pipeline.
   For each candidate in data/staging/candidates.json, search the web (Firecrawl)
   for the business's OWN site / Instagram and fill website, phone, description,
   a photo URL (og:image), and a verify_note. Writes data/staging/enriched.json.
   Best-effort, rate-limited, and resumable (progress cached).

   HALAL STAYS A HINT. This never grants a verified tier — the note/cert number
   is recorded for the admin, but MUIS/Admin verification stays single-sourced in
   app/api/admin/verify (the repo golden rule: AI drafts + flags, humans approve).

   IMAGES: photo_url is left as the discovered external URL. After a listing is
   approved, the existing scripts/enrich-images.mjs re-hosts photos[0] into the
   Supabase 'business-photos' bucket (optimizer-friendly). No re-hosting here.

   Usage:  node scripts/enrich-candidates.mjs [--limit=25] [--reset]
   Env:    FIRECRAWL_API_KEY (~/.env or .env.local) */
import {
  args, firecrawl, FC, pickOfficial, originOf, findPhone, ogImage,
  slugify, stagingPath, readJson, writeJson, sleep,
} from "./collect/lib.mjs";
import { existsSync, rmSync } from "node:fs";

const CANDIDATES = stagingPath("candidates.json");
const ENRICHED = stagingPath("enriched.json");
const PROGRESS = stagingPath(".collect-progress.json");

const A = args();
const LIMIT = Number(A.limit) || Infinity;
if (A.reset && existsSync(PROGRESS)) rmSync(PROGRESS);

async function enrichOne(c) {
  const query = `${c.name} ${c.area || "Singapore"} halal`;
  const s = await firecrawl("search", { query, limit: 5, scrapeOptions: { formats: ["markdown"] } });
  const results = s?.data || [];
  const official = pickOfficial(results, c.name);
  const blob = official ? `${official.title || ""} ${official.description || ""} ${official.markdown || ""}`.slice(0, 20000) : "";

  const website = official ? originOf(official) : undefined;
  const phone = blob ? findPhone(blob) : undefined;
  const description = official?.description ? String(official.description).slice(0, 300) : undefined;

  // photo: og:image from any result, else scrape the official page for one.
  let photo_url = null;
  for (const r of results) { photo_url = ogImage(r?.metadata); if (photo_url) break; }
  if (!photo_url && official?.url) {
    try {
      const sc = await firecrawl("scrape", { url: official.url, formats: ["markdown"] });
      photo_url = ogImage(sc?.data?.metadata);
    } catch { /* keep null */ }
  }

  // halal is a HINT only. Prefer whatever discovery already recorded (HalalSG),
  // otherwise note if the official page mentions halal/MUIS.
  const mentionsMuis = /\bmuis\b|halalsg|halal[-\s]?certif/i.test(blob);
  const verify_note = c.certNo
    ? `MUIS cert ${c.certNo}${c.scheme ? ` (${c.scheme})` : ""}${c.expiry ? `, expires ${c.expiry}` : ""} — verify on HalalSG`
    : mentionsMuis
      ? "site mentions MUIS/halal certification — verify on HalalSG"
      : undefined;

  return {
    ...c,
    website: c.website || website || undefined,
    phone: c.phone || phone || undefined,
    description: c.description || description || undefined,
    photo_url: photo_url || undefined,
    halalHint: c.halalHint || (verify_note ? "muis-certified (verify on HalalSG)" : undefined),
    verify_note,
  };
}

async function main() {
  if (!FC) { console.error("✗ FIRECRAWL_API_KEY not set (~/.env or .env.local)"); process.exit(1); }
  const candidates = readJson(CANDIDATES)?.records || [];
  if (!candidates.length) { console.error(`✗ no candidates — run collect-candidates.mjs first (${CANDIDATES})`); process.exit(1); }

  const progress = readJson(PROGRESS, {}) || {};
  const out = readJson(ENRICHED)?.records || [];
  const done = new Set(out.map((r) => slugify(r.name)));

  const todo = candidates.filter((c) => !progress[slugify(c.name)]).slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`→ enriching ${todo.length} candidates (rate-limited)…`);

  let ok = 0, miss = 0;
  for (const c of todo) {
    const slug = slugify(c.name);
    try {
      const enriched = await enrichOne(c);
      const hit = enriched.website || enriched.phone || enriched.photo_url;
      if (done.has(slug)) out[out.findIndex((r) => slugify(r.name) === slug)] = enriched;
      else { out.push(enriched); done.add(slug); }
      progress[slug] = hit ? "ok" : "thin";
      if (hit) ok++; else miss++;
      console.log(`  ${hit ? "✓" : "·"} ${c.name}${enriched.website ? " 🌐" : ""}${enriched.phone ? " ☎" : ""}${enriched.photo_url ? " 🖼" : ""}${enriched.verify_note ? " ✔hint" : ""}`);
    } catch (e) {
      progress[slug] = `err:${e.message}`; miss++;
      console.log(`  · ${c.name} (${e.message})`);
    }
    writeJson(PROGRESS, progress);
    writeJson(ENRICHED, { generated_at: new Date().toISOString(), count: out.length, records: out });
    await sleep(1500); // be gentle on Firecrawl + source sites
  }
  console.log(`✓ done. enriched ${ok}, thin/none ${miss}. Re-run to continue (or --reset to redo).`);
  console.log(`  next: node scripts/build-import-csv.mjs`);
}

main().catch((e) => { console.error("✗ enrich-candidates failed:", e.message); process.exit(1); });
