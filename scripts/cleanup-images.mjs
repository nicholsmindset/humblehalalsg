/* Humble Halal — business-listing image mass cleanup.
 *
 * Companion to scripts/audit-images.mjs (run that first). All modes are
 * DRY-RUN BY DEFAULT — nothing is written without --apply. Every mode is
 * idempotent: the worklist is re-derived from live DB state on each run, so
 * stopping and re-running is always safe.
 *
 * Modes:
 *   strip-known-bad     Remove the banned stock photos (glamour model /
 *                       raw-meat joint) from businesses.photos everywhere and
 *                       reject their governed rows. Run this FIRST.
 *   strip-placeholders  Remove ALL remaining Unsplash placeholders from
 *                       source='spreadsheet' rows (empty photos → the branded
 *                       fallback card). Run AFTER enrichment has been attempted;
 *                       refuses without --force while .enrich-progress.json
 *                       shows unattempted candidates.
 *   sync-governance     Reconcile the governed `photos` table with the public
 *                       businesses.photos projection (roles, sort order, alt
 *                       text, rejects orphans) and backfill width/height/
 *                       content_hash for supabase-hosted images.
 *   revalidate          Purge ISR caches for every listing touched by earlier
 *                       --apply runs (reads reports/.cleanup-touched.json).
 *                       Needs SITE_URL + CRON_SECRET.
 *
 * Usage:  node scripts/cleanup-images.mjs <mode> [--apply] [--force] [--limit=N] [--only=<slug>]
 * Env:    NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local or ~/.env)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { imageSize } from "image-size";
import { isBannedImageUrl } from "./banned-images.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const REPORT_DIR = join(ROOT, "reports");
const TOUCHED = join(REPORT_DIR, ".cleanup-touched.json");
const LOG = join(REPORT_DIR, "cleanup-log.json");
const ENRICH_PROGRESS = fileURLToPath(new URL("./.enrich-progress.json", import.meta.url));

const MODES = ["strip-known-bad", "strip-placeholders", "sync-governance", "revalidate"];
const mode = process.argv[2];
const args = Object.fromEntries(process.argv.slice(3).map((a) => {
  const m = a.match(/^--([a-z-]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));
const APPLY = !!args.apply;
const FORCE = !!args.force;
const LIMIT = Number(args.limit) || Infinity;
const ONLY = typeof args.only === "string" ? args.only : null;

if (!MODES.includes(mode)) {
  console.error(`Usage: node scripts/cleanup-images.mjs <${MODES.join("|")}> [--apply] [--force] [--limit=N] [--only=<slug>]`);
  process.exit(1);
}

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

const readJson = (p, fallback) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return fallback; } };
const touched = new Set(readJson(TOUCHED, []));
const saveTouched = () => { mkdirSync(REPORT_DIR, { recursive: true }); writeFileSync(TOUCHED, JSON.stringify([...touched], null, 1)); };
function logAction(action) {
  mkdirSync(REPORT_DIR, { recursive: true });
  const log = readJson(LOG, []);
  log.push({ at: new Date().toISOString(), mode, ...action });
  writeFileSync(LOG, JSON.stringify(log, null, 1));
}

function getClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("✗ missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchAll(sb, table, columns, filter) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(columns).range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
}

// exact-host check (not substring — "images.unsplash.com.evil.tld" must not match)
const isUnsplash = (u) => { try { return new URL(u).hostname === "images.unsplash.com"; } catch { return false; } };

/** Reject the governed rows for URLs removed from a business's projection. */
async function rejectGoverned(sb, businessId, urls, reason) {
  if (!urls.length) return 0;
  const { data } = await sb.from("photos").select("id,url,status").eq("business_id", businessId);
  let n = 0;
  for (const g of data || []) {
    if (urls.includes(g.url) && g.status !== "rejected") {
      const { error } = await sb.from("photos").update({ status: "rejected", rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq("id", g.id);
      if (!error) n++;
    }
  }
  return n;
}

/* ---- strip modes (shared engine) ---- */
async function stripPhotos({ predicate, reason, spreadsheetOnly }) {
  const sb = getClient();
  let rows = await fetchAll(sb, "businesses", "id,slug,name,source,photos",
    spreadsheetOnly ? (q) => q.eq("source", "spreadsheet") : null);
  if (ONLY) rows = rows.filter((r) => r.slug === ONLY);

  const work = rows
    .map((r) => {
      const photos = Array.isArray(r.photos) ? r.photos : [];
      const removed = photos.filter((p) => predicate(p?.url));
      return removed.length ? { ...r, photos, kept: photos.filter((p) => !predicate(p?.url)), removed } : null;
    })
    .filter(Boolean)
    .slice(0, LIMIT === Infinity ? undefined : LIMIT);

  console.log(`→ ${mode}: ${work.length} businesses affected${APPLY ? "" : " [DRY RUN — pass --apply to write]"}`);
  let okCount = 0, failCount = 0;
  for (const w of work) {
    const removedUrls = w.removed.map((p) => p.url);
    if (!APPLY) {
      console.log(`  WOULD  ${w.slug} — remove ${w.removed.length}/${w.photos.length} photo(s), keep ${w.kept.length}`);
      removedUrls.forEach((u) => console.log(`         - ${u}`));
      continue;
    }
    const { error } = await sb.from("businesses").update({ photos: w.kept }).eq("id", w.id);
    if (error) { console.log(`  FAIL   ${w.slug} — ${error.message}`); failCount++; continue; }
    const rejected = await rejectGoverned(sb, w.id, removedUrls, reason);
    touched.add(w.slug); okCount++;
    console.log(`  PASS   ${w.slug} — removed ${w.removed.length}, governed rejected ${rejected}, remaining ${w.kept.length}`);
  }
  if (APPLY) {
    saveTouched();
    logAction({ affected: okCount, failed: failCount, reason });
    console.log(`✓ ${mode}: ${okCount} updated, ${failCount} failed. Touched slugs → reports/.cleanup-touched.json`);
  } else {
    console.log(`✓ dry run complete — ${work.length} businesses would change.`);
  }
}

/* ---- sync-governance ---- */
async function syncGovernance() {
  const sb = getClient();
  let rows = await fetchAll(sb, "businesses", "id,slug,name,source,photos");
  if (ONLY) rows = rows.filter((r) => r.slug === ONLY);
  const governed = await fetchAll(sb, "photos", "id,business_id,url,status,role,source,rights_confirmed,alt_text,width,height,sort_order,content_hash");
  const byBiz = new Map();
  for (const g of governed) {
    if (!byBiz.has(g.business_id)) byBiz.set(g.business_id, []);
    byBiz.get(g.business_id).push(g);
  }

  const supaHost = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const isOwnStorage = (u) => typeof u === "string" && supaHost && u.startsWith(`${supaHost}/storage/v1/object/public/`);

  let planned = 0, applied = 0, failed = 0;
  rows = rows.slice(0, LIMIT === Infinity ? undefined : LIMIT);
  console.log(`→ sync-governance over ${rows.length} businesses${APPLY ? "" : " [DRY RUN — pass --apply to write]"}`);

  for (const r of rows) {
    const photos = (Array.isArray(r.photos) ? r.photos : []).filter((p) => p?.url);
    const gov = byBiz.get(r.id) || [];
    const govByUrl = new Map(gov.map((g) => [g.url, g]));
    const activeUrls = new Set(photos.map((p) => p.url));
    const ops = [];

    photos.forEach((p, i) => {
      const want = { role: i === 0 ? "cover" : "gallery", sort_order: i, alt_text: p.caption || r.name, status: "approved" };
      const g = govByUrl.get(p.url);
      if (!g) {
        // rights_confirmed stays false: this backfill can't prove provenance, so
        // the image surfaces in the admin quality queue for a human rights check.
        ops.push({ op: "insert", url: p.url, patch: { business_id: r.id, url: p.url, caption: p.caption || r.name, ...want, rejection_reason: null, source: "legacy", rights_confirmed: false } });
      } else if (g.status !== "approved" || g.role !== want.role || g.sort_order !== want.sort_order || !g.alt_text) {
        ops.push({ op: "update", id: g.id, url: p.url, patch: { ...want, alt_text: g.alt_text || want.alt_text, rejection_reason: null } });
      }
      if (g && isOwnStorage(p.url) && (g.width == null || g.height == null || !g.content_hash)) {
        ops.push({ op: "backfill-dims", id: g.id, url: p.url });
      }
    });
    for (const g of gov) {
      if (!activeUrls.has(g.url) && g.status !== "rejected") {
        ops.push({ op: "reject-orphan", id: g.id, url: g.url });
      }
    }
    if (!ops.length) continue;
    planned += ops.length;

    if (!APPLY) {
      console.log(`  WOULD  ${r.slug} — ${ops.map((o) => o.op).join(", ")}`);
      continue;
    }
    for (const op of ops) {
      try {
        if (op.op === "insert") {
          const { error } = await sb.from("photos").insert(op.patch);
          if (error && !/duplicate|unique/i.test(error.message)) throw error;
        } else if (op.op === "update") {
          const { error } = await sb.from("photos").update(op.patch).eq("id", op.id);
          if (error) throw error;
        } else if (op.op === "reject-orphan") {
          const { error } = await sb.from("photos").update({ status: "rejected", rejection_reason: "Not in public projection", reviewed_at: new Date().toISOString() }).eq("id", op.id);
          if (error) throw error;
        } else if (op.op === "backfill-dims") {
          const res = await fetch(op.url);
          if (!res.ok) throw new Error(`fetch ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          let width = null, height = null;
          try { ({ width, height } = imageSize(buf)); } catch { /* unknown format */ }
          const contentHash = createHash("sha256").update(buf).digest("hex");
          const { error } = await sb.from("photos").update({ width, height, content_hash: contentHash }).eq("id", op.id);
          // unique (business_id, content_hash) index: a conflict means this image
          // duplicates another governed row — keep dims, drop the hash claim.
          if (error && /duplicate|unique/i.test(error.message)) {
            await sb.from("photos").update({ width, height }).eq("id", op.id);
          } else if (error) throw error;
        }
        applied++;
      } catch (e) {
        failed++;
        console.log(`  FAIL   ${r.slug} ${op.op} — ${String(e.message || e).slice(0, 120)}`);
      }
    }
    touched.add(r.slug);
    console.log(`  PASS   ${r.slug} — ${ops.length} op(s)`);
  }

  if (APPLY) {
    saveTouched();
    logAction({ ops: applied, failed });
    console.log(`✓ sync-governance: ${applied} ops applied, ${failed} failed.`);
  } else {
    console.log(`✓ dry run complete — ${planned} op(s) across the fleet would run.`);
  }
}

/* ---- revalidate ---- */
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/; // matches slugify() output; rejects anything URL-shaped

async function revalidate() {
  const SECRET = env.CRON_SECRET;
  // The touched file is local state, but validate anyway: only well-formed
  // slugs may reach a request URL (defense against a hand-edited file).
  const slugs = [...touched].filter((s) => SLUG_RE.test(String(s)));
  const dropped = touched.size - slugs.length;
  if (dropped) console.log(`  · ignored ${dropped} malformed entr${dropped === 1 ? "y" : "ies"} in reports/.cleanup-touched.json`);
  if (!slugs.length) { console.log("nothing to revalidate — reports/.cleanup-touched.json is empty."); return; }
  const paths = [...slugs.map((s) => `/business/${s}`), "/", "/halal", "/explore"];
  const chunks = [];
  for (let i = 0; i < paths.length; i += 100) chunks.push(paths.slice(i, i + 100)); // route caps at 100/call

  if (!APPLY) {
    // env values are deliberately NOT echoed — placeholders only.
    console.log(`→ revalidate [DRY RUN] — ${paths.length} paths in ${chunks.length} call(s):`);
    for (const c of chunks) {
      console.log(`  curl -H "Authorization: Bearer $CRON_SECRET" "$SITE_URL/api/admin/revalidate?${c.map((p) => `path=${encodeURIComponent(p)}`).join("&")}"`);
    }
    return;
  }
  let site;
  try { site = new URL(env.SITE_URL); } catch { site = null; }
  if (!site || site.protocol !== "https:" || !SECRET) {
    console.error("✗ revalidate --apply needs CRON_SECRET and an https:// SITE_URL");
    process.exit(1);
  }
  let ok = 0, fail = 0;
  for (const c of chunks) {
    const url = new URL("/api/admin/revalidate", site.origin);
    for (const p of c) url.searchParams.append("path", p);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${SECRET}` } });
    if (res.ok) ok += c.length; else { fail += c.length; console.log(`  FAIL   batch of ${c.length} — HTTP ${res.status}`); }
  }
  logAction({ revalidated: ok, failed: fail });
  if (!fail) { touched.clear(); saveTouched(); }
  console.log(`✓ revalidate: ${ok} paths ok, ${fail} failed.${fail ? " Touched list kept for retry." : " Touched list cleared."}`);
}

/* ---- dispatch ---- */
async function main() {
  if (mode === "strip-known-bad") {
    await stripPhotos({ predicate: isBannedImageUrl, reason: "Known-bad stock placeholder", spreadsheetOnly: false });
  } else if (mode === "strip-placeholders") {
    // Guard: don't blank listings enrichment hasn't even attempted yet.
    const progress = readJson(ENRICH_PROGRESS, {});
    const sb = getClient();
    const rows = await fetchAll(sb, "businesses", "slug,source,photos", (q) => q.eq("source", "spreadsheet"));
    const unattempted = rows.filter((r) => {
      const photos = Array.isArray(r.photos) ? r.photos : [];
      return photos.some((p) => isUnsplash(p?.url)) && !progress[r.slug];
    });
    if (unattempted.length && !FORCE) {
      console.error(`✗ ${unattempted.length} placeholder listings have not been attempted by enrich-images.mjs yet.`);
      console.error(`  Run enrichment first (node scripts/enrich-images.mjs), or pass --force to strip anyway.`);
      process.exit(1);
    }
    await stripPhotos({ predicate: isUnsplash, reason: "Stock placeholder removed (branded fallback)", spreadsheetOnly: true });
  } else if (mode === "sync-governance") {
    await syncGovernance();
  } else if (mode === "revalidate") {
    await revalidate();
  }
}

main().catch((e) => { console.error(`✗ cleanup-images ${mode} failed:`, e); process.exit(1); });
