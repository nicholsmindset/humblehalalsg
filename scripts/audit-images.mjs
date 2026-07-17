/* Humble Halal — full business-listing image audit (READ-ONLY).
 *
 * Classifies every photo on every business, cross-checks the governed `photos`
 * table against the public `businesses.photos` projection, verifies the safety
 * blocklist, probes URL liveness, and inventories hardcoded stock imagery in
 * the repo. Writes a machine-readable work order + a human summary:
 *
 *   reports/image-audit.json   (consumed by scripts/cleanup-images.mjs)
 *   reports/image-audit.md
 *
 * This script NEVER writes to the database — its only outputs are reports/.
 *
 * Usage:  node scripts/audit-images.mjs [--limit=N] [--only=<slug>] [--skip-liveness]
 *         node scripts/audit-images.mjs --sweep-only   (no DB — static repo sweep only)
 * Env:    NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local or ~/.env)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { BANNED_IMAGE_IDS, isBannedImageUrl } from "./banned-images.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const REPORT_DIR = join(ROOT, "reports");

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([a-z-]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const LIMIT = Number(args.limit) || Infinity;
const ONLY = typeof args.only === "string" ? args.only : null;
const SKIP_LIVENESS = !!args["skip-liveness"];

function loadEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = { ...loadEnvFile(join(ROOT, ".env.local")), ...loadEnvFile(`${homedir()}/.env`), ...process.env };
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL, SUPA_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

/* ---- classification ---- */
function classifyUrl(url) {
  if (typeof url !== "string" || !url.trim()) return "invalid";
  if (isBannedImageUrl(url)) return "known-bad";
  let host;
  try { host = new URL(url).host; } catch { return "invalid"; }
  if (!url.startsWith("https://")) return "invalid";
  if (host === "images.unsplash.com") return "unsplash-placeholder";
  if (SUPA_URL && url.startsWith(`${SUPA_URL.replace(/\/$/, "")}/storage/v1/object/public/`)) return "supabase-hosted";
  if (/\.supabase\.co$/.test(host)) return "supabase-hosted"; // other project host (e.g. env drift)
  return "external-hotlink";
}

/* ---- paged fetch (PostgREST caps a single request) ---- */
async function fetchAll(sb, table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
}

/* ---- liveness: HEAD (fall back to 1-byte GET), promise pool ---- */
async function probeUrl(url) {
  const attempt = async (method, headers = {}) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, { method, headers, redirect: "follow", signal: ctrl.signal });
      return res.status;
    } finally { clearTimeout(t); }
  };
  try {
    let status = await attempt("HEAD");
    if (status === 405 || status === 403) status = await attempt("GET", { Range: "bytes=0-0" });
    return { status, ok: status >= 200 && status < 400 };
  } catch (e) {
    return { status: 0, ok: false, error: String(e?.cause?.code || e?.name || e).slice(0, 60) };
  }
}
async function probeAll(urls, concurrency = 8) {
  const out = new Map();
  const queue = [...urls];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const url = queue.shift();
      out.set(url, await probeUrl(url));
      process.stdout.write(`\r  probed ${out.size}/${urls.length} unique URLs   `);
    }
  });
  await Promise.all(workers);
  if (urls.length) console.log("");
  return out;
}

/* ---- blocklist slugs, parsed from the single source of truth ---- */
function blocklistSlugs() {
  try {
    const src = readFileSync(join(ROOT, "lib/listing-safety.ts"), "utf8");
    return [...src.matchAll(/"([a-z0-9-]+)",?\s*\/\//g)].map((m) => m[1]);
  } catch { return []; }
}

/* ---- static repo sweep for hardcoded stock imagery ---- */
const SWEEP_ROOTS = ["app", "components", "lib", "scripts"];
const SWEEP_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css)$/;
const SWEEP_SKIP = new Set(["node_modules", ".next", "reports"]);
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SWEEP_SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (SWEEP_EXT.test(name)) yield p;
  }
}
function staticSweep() {
  const rows = [];
  for (const root of SWEEP_ROOTS) {
    const dir = join(ROOT, root);
    if (!existsSync(dir)) continue;
    for (const file of walk(dir)) {
      const rel = relative(ROOT, file);
      if (rel === "scripts/banned-images.mjs") continue; // the ban list itself
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        // full URLs, "photo-<id>" strings (e.g. unsplashPhoto("photo-…")), and
        // bare IDs passed to IMG()-style helpers (e.g. the PIC map in lib/data.ts)
        for (const m of line.matchAll(/photo-(\d{10,16}-[0-9a-f]{6,16})/g)) {
          rows.push({ file: rel, line: i + 1, photoId: m[1], knownBad: BANNED_IMAGE_IDS.includes(m[1]), verdict: "", recommendation: "keep-editorial" });
        }
        for (const m of line.matchAll(/"(\d{10,16}-[0-9a-f]{6,16})"/g)) {
          rows.push({ file: rel, line: i + 1, photoId: m[1], knownBad: BANNED_IMAGE_IDS.includes(m[1]), verdict: "", recommendation: "keep-editorial" });
        }
      });
    }
  }
  // one row per (file,line,photoId)
  const seen = new Set();
  return rows.filter((r) => { const k = `${r.file}:${r.line}:${r.photoId}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

/* ---- main ---- */
async function main() {
  if (args["sweep-only"]) {
    mkdirSync(REPORT_DIR, { recursive: true });
    const inventory = staticSweep();
    writeFileSync(join(REPORT_DIR, "image-audit-sweep.json"), JSON.stringify({ generatedAt: new Date().toISOString(), staticInventory: inventory }, null, 1));
    console.log(`✓ static sweep only → reports/image-audit-sweep.json (${inventory.length} stock-image references)`);
    const bad = inventory.filter((r) => r.knownBad);
    if (bad.length) { console.error(`✗ ${bad.length} BANNED image references found:`); bad.forEach((r) => console.error(`  ${r.file}:${r.line}`)); process.exit(1); }
    return;
  }
  if (!SUPA_URL || !SUPA_KEY) { console.error("✗ missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  const sb = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });
  mkdirSync(REPORT_DIR, { recursive: true });

  console.log("→ fetching businesses + governed photos …");
  let businesses = await fetchAll(sb, "businesses", "id,slug,name,source,status,cat_id,photos");
  const governed = await fetchAll(sb, "photos", "id,business_id,url,status,role,source,rights_confirmed,alt_text,width,height,sort_order,content_hash");
  console.log(`  ${businesses.length} businesses · ${governed.length} governed photo rows`);

  if (ONLY) businesses = businesses.filter((b) => b.slug === ONLY);
  if (LIMIT !== Infinity) businesses = businesses.slice(0, LIMIT);

  const governedByBiz = new Map();
  for (const g of governed) {
    if (!governedByBiz.has(g.business_id)) governedByBiz.set(g.business_id, []);
    governedByBiz.get(g.business_id).push(g);
  }

  const blocked = new Set(blocklistSlugs());
  const perBusiness = [];
  const classCounts = {};
  const bump = (k) => { classCounts[k] = (classCounts[k] || 0) + 1; };

  for (const b of businesses) {
    const photos = Array.isArray(b.photos) ? b.photos : [];
    const gov = governedByBiz.get(b.id) || [];
    const govByUrl = new Map(gov.map((g) => [g.url, g]));
    const projectionUrls = new Set(photos.map((p) => p?.url).filter(Boolean));

    const entry = {
      id: b.id, slug: b.slug, name: b.name, source: b.source, status: b.status, cat: b.cat_id,
      photoCount: photos.length,
      photos: [],
      flags: [],
    };

    if (!photos.length) { bump("missing"); entry.flags.push("missing"); }

    photos.forEach((p, i) => {
      const cls = classifyUrl(p?.url);
      bump(cls);
      const g = govByUrl.get(p?.url);
      const photoFlags = [];
      if (!g) photoFlags.push("governance-missing");
      else {
        if (g.status !== "approved") photoFlags.push(`governance-status-drift:${g.status}`);
        if (i === 0 && g.role !== "cover") photoFlags.push("role-drift");
        if (g.sort_order !== i) photoFlags.push("sort-drift");
        if (!g.alt_text) photoFlags.push("no-alt-text");
        if (g.width == null || g.height == null) photoFlags.push("no-dimensions");
        else if (g.width < 1200 || g.height < 900) photoFlags.push("low-resolution");
        if (!g.rights_confirmed) photoFlags.push("rights-unconfirmed");
      }
      entry.photos.push({ index: i, url: p?.url ?? null, caption: p?.caption ?? null, class: cls, flags: photoFlags });
    });

    // approved governed rows that never reach the public projection
    for (const g of gov) {
      if (g.status === "approved" && !projectionUrls.has(g.url)) {
        entry.flags.push("orphan-approved");
        break;
      }
    }

    if (blocked.has(b.slug)) {
      entry.flags.push("blocklisted");
      if (photos.length) entry.flags.push("blocklisted-with-photos");
    }
    if (entry.photos.some((p) => p.class === "known-bad")) entry.flags.push("has-known-bad");
    if (entry.photos.some((p) => p.class === "unsplash-placeholder")) entry.flags.push("has-placeholder");
    if (entry.photos.some((p) => p.class === "external-hotlink")) entry.flags.push("has-hotlink");
    if (entry.photos.some((p) => p.class === "invalid")) entry.flags.push("has-invalid");
    if (entry.photos.some((p) => p.flags.length)) entry.flags.push("governance-issues");

    perBusiness.push(entry);
  }

  // ---- liveness (unique URLs only; placeholders repeat across hundreds of rows)
  let liveness = {};
  if (!SKIP_LIVENESS) {
    const unique = [...new Set(perBusiness.flatMap((e) => e.photos.map((p) => p.url)).filter(Boolean))];
    console.log(`→ probing liveness of ${unique.length} unique URLs (concurrency 8) …`);
    const probed = await probeAll(unique);
    liveness = Object.fromEntries(probed);
    for (const e of perBusiness) {
      for (const p of e.photos) {
        const r = p.url ? probed.get(p.url) : null;
        if (r && !r.ok) { p.flags.push("broken"); if (!e.flags.includes("has-broken")) e.flags.push("has-broken"); }
      }
    }
  } else {
    console.log("→ liveness probing skipped (--skip-liveness)");
  }

  // ---- orphan governed rows pointing at businesses that no longer exist
  const bizIds = new Set(businesses.map((b) => b.id));
  const orphanGoverned = ONLY || LIMIT !== Infinity ? [] : governed.filter((g) => !bizIds.has(g.business_id));

  // ---- static repo sweep
  console.log("→ static repo sweep for hardcoded stock imagery …");
  const inventory = staticSweep();

  // ---- summarise
  const flagged = perBusiness.filter((e) => e.flags.some((f) => f !== "missing"));
  const worst = [...perBusiness]
    .map((e) => ({ ...e, score: (e.flags.includes("has-known-bad") ? 100 : 0) + (e.flags.includes("blocklisted-with-photos") ? 80 : 0) + (e.flags.includes("has-broken") ? 40 : 0) + (e.flags.includes("has-placeholder") ? 20 : 0) + (e.flags.includes("has-hotlink") ? 10 : 0) + (e.flags.includes("governance-issues") ? 5 : 0) }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const toEnrich = perBusiness.filter((e) => e.source === "spreadsheet" && (e.flags.includes("has-placeholder") || e.flags.includes("missing"))).length;
  const toStripKnownBad = perBusiness.filter((e) => e.flags.includes("has-known-bad")).length;
  const governanceDrift = perBusiness.filter((e) => e.flags.includes("governance-issues") || e.flags.includes("orphan-approved")).length;

  const report = {
    generatedAt: new Date().toISOString(),
    supabaseHost: new URL(SUPA_URL).host,
    totals: { businesses: perBusiness.length, governedRows: governed.length, classCounts },
    recommendedActions: { stripKnownBad: toStripKnownBad, enrichCandidates: toEnrich, governanceDriftBusinesses: governanceDrift, orphanGovernedRows: orphanGoverned.length },
    blocklist: { slugs: [...blocked], withPhotos: perBusiness.filter((e) => e.flags.includes("blocklisted-with-photos")).map((e) => e.slug) },
    businesses: perBusiness,
    orphanGovernedRows: orphanGoverned,
    liveness,
    staticInventory: inventory,
  };
  writeFileSync(join(REPORT_DIR, "image-audit.json"), JSON.stringify(report, null, 1));

  // ---- markdown summary
  const md = [];
  md.push(`# Business Listing Image Audit`, "", `Generated: ${report.generatedAt} · DB: ${report.supabaseHost}`, "");
  md.push(`## Totals`, "", `| metric | count |`, `| --- | ---: |`, `| businesses audited | ${perBusiness.length} |`, `| governed photo rows | ${governed.length} |`);
  for (const [k, v] of Object.entries(classCounts).sort((a, b) => b[1] - a[1])) md.push(`| photos: ${k} | ${v} |`);
  md.push("", `## Recommended actions`, "",
    `- **Strip known-bad stock photos now:** ${toStripKnownBad} businesses (\`cleanup-images.mjs strip-known-bad\`)`,
    `- **Enrich real photos:** ${toEnrich} spreadsheet businesses on placeholders/empty (\`enrich-images.mjs\`)`,
    `- **Governance drift to sync:** ${governanceDrift} businesses (\`cleanup-images.mjs sync-governance\`)`,
    `- **Orphan governed rows (no business):** ${orphanGoverned.length}`, "");
  if (report.blocklist.withPhotos.length) {
    md.push(`## ⚠ Blocklisted listings still carrying photos`, "", ...report.blocklist.withPhotos.map((s) => `- ${s}`), "");
  }
  md.push(`## Top ${worst.length} worst listings`, "", `| slug | source | flags |`, `| --- | --- | --- |`);
  for (const e of worst) md.push(`| ${e.slug} | ${e.source} | ${e.flags.join(", ")} |`);
  md.push("", `## Hardcoded stock imagery in the repo (manual verdicts)`, "",
    `Stock photography is acceptable on *editorial* surfaces (area heroes, blog, events, travel)`,
    `but never as a specific business's photo. Fill the verdict column during review.`, "",
    `| file | line | photo id | known-bad | recommendation | verdict |`, `| --- | ---: | --- | :---: | --- | --- |`);
  for (const r of inventory) md.push(`| ${r.file} | ${r.line} | ${r.photoId} | ${r.knownBad ? "**YES**" : ""} | ${r.recommendation} | |`);
  md.push("");
  writeFileSync(join(REPORT_DIR, "image-audit.md"), md.join("\n"));

  console.log(`\n✓ audit complete → reports/image-audit.json + reports/image-audit.md`);
  console.log(`  businesses: ${perBusiness.length} · flagged: ${flagged.length}`);
  console.log(`  classes:`, classCounts);
  console.log(`  actions: strip-known-bad ${toStripKnownBad} · enrich ${toEnrich} · governance drift ${governanceDrift}`);
}

main().catch((e) => { console.error("✗ audit-images failed:", e); process.exit(1); });
