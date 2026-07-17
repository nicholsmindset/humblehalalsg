/* Humble Halal — background image enrichment (best-effort, resumable).
   For each seeded business still on a category placeholder image — or with no
   photos at all (placeholders are stripped by scripts/cleanup-images.mjs) —
   search the web (Firecrawl) for the business, pull a real photo (og:image),
   re-host it to Supabase Storage (so it renders through next/image without
   whitelisting random hosts), and update businesses.photos[0]. Also records the
   image in the governed `photos` table (role/alt_text/dims/hash, 0074) with
   rights_confirmed=false so it surfaces in the admin media quality queue for a
   human rights check. Never blocks go-live; safe to stop + resume (progress
   cached). Keeps the current state on any failure.

   Usage:  node scripts/enrich-images.mjs [limit] [--dry]
           --dry: search + report the candidate photo, no upload/update.
   Env:    NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local)
           FIRECRAWL_API_KEY (~/.env)
*/
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { imageSize } from "image-size";

const DRY = process.argv.includes("--dry");
const LIMIT = Number(process.argv.filter((a) => !a.startsWith("--"))[2] || 0) || Infinity;
const BUCKET = "business-photos";
const PROGRESS = fileURLToPath(new URL("./.enrich-progress.json", import.meta.url));

function loadEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = { ...loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url))), ...loadEnvFile(`${homedir()}/.env`), ...process.env };
const FC = env.FIRECRAWL_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const progress = existsSync(PROGRESS) ? JSON.parse(readFileSync(PROGRESS, "utf8")) : {};
const saveProgress = () => writeFileSync(PROGRESS, JSON.stringify(progress));

async function firecrawl(path, body) {
  const res = await fetch(`https://api.firecrawl.dev/v1/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${FC}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`firecrawl ${path} ${res.status}`);
  return res.json();
}

/** Best-effort: find a real photo URL for a business name. */
async function findImage(name) {
  const s = await firecrawl("search", { query: `${name} Singapore halal`, limit: 3, scrapeOptions: { formats: ["markdown"] } });
  for (const r of s?.data || []) {
    const og = r?.metadata?.ogImage || r?.metadata?.["og:image"];
    if (og && /^https:\/\/.+\.(jpe?g|png|webp)/i.test(og)) return og;
  }
  // fallback: scrape the top result explicitly for og:image
  const top = s?.data?.[0]?.url;
  if (top) {
    const sc = await firecrawl("scrape", { url: top, formats: ["markdown"] });
    const og = sc?.data?.metadata?.ogImage || sc?.data?.metadata?.["og:image"];
    if (og && /^https:\/\/.+\.(jpe?g|png|webp)/i.test(og)) return og;
  }
  return null;
}

async function main() {
  if (!FC) { console.error("✗ FIRECRAWL_API_KEY not set (~/.env)"); process.exit(1); }
  const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("✗ missing Supabase env"); process.exit(1); }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // ensure a public bucket
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true });
    if (error && !/exists/i.test(error.message)) { console.error("✗ bucket:", error.message); process.exit(1); }
    console.log(`→ created public bucket '${BUCKET}'`);
  }

  // candidates: spreadsheet rows still on an Unsplash placeholder OR with no
  // photos at all (cleanup-images.mjs strips placeholders to [] — those rows
  // still deserve an enrichment attempt before settling on the fallback card).
  const { data: rows, error } = await sb.from("businesses")
    .select("id,slug,name,photos").eq("source", "spreadsheet").limit(2000);
  if (error) { console.error("✗", error.message); process.exit(1); }
  // exact-host check (not substring — "images.unsplash.com.evil.tld" must not match)
  const isUnsplashUrl = (u) => { try { return new URL(u).hostname === "images.unsplash.com"; } catch { return false; } };
  const todo = (rows || []).filter((r) => {
    if (progress[r.slug]) return false;
    const photos = Array.isArray(r.photos) ? r.photos : [];
    if (!photos.length) return true;
    return isUnsplashUrl(photos[0]?.url);
  }).slice(0, LIMIT === Infinity ? undefined : LIMIT);

  console.log(`→ ${todo.length} businesses to enrich (rate-limited)${DRY ? " [DRY — no writes]" : ""}…`);
  let upgraded = 0, missed = 0;
  for (const r of todo) {
    try {
      const img = await findImage(r.name);
      if (!img) { if (!DRY) { progress[r.slug] = "none"; saveProgress(); } missed++; await sleep(1200); continue; }
      if (DRY) { console.log(`  ? ${r.name} → candidate: ${img}`); upgraded++; await sleep(1200); continue; }
      const buf = Buffer.from(await (await fetch(img)).arrayBuffer());
      if (buf.length < 3000) throw new Error("image too small");
      // dimensions + content hash feed the governed photos record (0074) so the
      // admin quality queue can rank the image without re-downloading it.
      let width = null, height = null;
      try { ({ width, height } = imageSize(buf)); } catch { /* unknown format — keep nulls */ }
      const contentHash = createHash("sha256").update(buf).digest("hex");
      const ext = (img.match(/\.(jpe?g|png|webp)/i) || [".jpg"])[0].replace(".jpeg", ".jpg");
      const path = `${r.slug}${ext}`;
      const up = await sb.storage.from(BUCKET).upload(path, buf, { contentType: `image/${ext.slice(1).replace("jpg", "jpeg")}`, upsert: true });
      if (up.error) throw up.error;
      const pub = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const replaced = (Array.isArray(r.photos) ? r.photos : []).map((p) => p?.url).filter(Boolean);
      const photos = [{ url: pub, caption: r.name }, ...(Array.isArray(r.photos) ? r.photos.slice(1) : [])];
      const upd = await sb.from("businesses").update({ photos }).eq("id", r.id);
      if (upd.error) throw upd.error;
      // governed media record — mirror lib/media-governance.ts semantics:
      // approve the new cover, reject the governed row of the URL it replaced.
      try {
        const { data: gov } = await sb.from("photos").select("id,url,status").eq("business_id", r.id);
        const existing = (gov || []).find((g) => g.url === pub);
        const patch = { caption: r.name, alt_text: r.name, role: "cover", sort_order: 0, status: "approved", rejection_reason: null, width: width ?? null, height: height ?? null, content_hash: contentHash };
        if (existing) await sb.from("photos").update(patch).eq("id", existing.id);
        else await sb.from("photos").insert({ business_id: r.id, url: pub, ...patch, source: "official_website", rights_confirmed: false });
        const old = (gov || []).find((g) => replaced.includes(g.url) && g.url !== pub && g.status !== "rejected");
        if (old) await sb.from("photos").update({ status: "rejected", rejection_reason: "Replaced placeholder", reviewed_at: new Date().toISOString() }).eq("id", old.id);
      } catch { /* governance table may predate 0074 — projection update stands */ }
      progress[r.slug] = "ok"; upgraded++; saveProgress();
      console.log(`  ✓ ${r.name} → ${pub.split("/").pop()} (${width || "?"}×${height || "?"})`);
    } catch (e) {
      progress[r.slug] = `err:${e.message}`; missed++; saveProgress();
      console.log(`  · ${r.name} unchanged (${e.message})`);
    }
    await sleep(1500); // be gentle on Firecrawl + the source sites
  }
  console.log(`✓ done. ${DRY ? "candidates found" : "upgraded"} ${upgraded}, ${DRY ? "no candidate" : "unchanged"} ${missed}. Re-run to continue.`);
}

main().catch((e) => { console.error("✗ enrich-images failed:", e); process.exit(1); });
