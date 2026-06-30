/* Humble Halal — background contact enrichment (best-effort, resumable).
   For each directory business missing a phone/website, search the web
   (Firecrawl) and fill in a Singapore phone number + official website. Completes
   the "P" of NAP for local SEO. Never blocks; safe to stop + resume.

   Usage:  node scripts/enrich-contacts.mjs [limit]
   Env:    NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local),
           FIRECRAWL_API_KEY (~/.env) */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createClient } from "@supabase/supabase-js";

const LIMIT = Number(process.argv[2] || 0) || Infinity;
const PROGRESS = fileURLToPath(new URL("./.enrich-contacts.json", import.meta.url));

function loadEnvFile(p) {
  const out = {};
  if (!existsSync(p)) return out;
  for (const l of readFileSync(p, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
  return out;
}
const env = { ...loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url))), ...loadEnvFile(`${homedir()}/.env`), ...process.env };
const FC = env.FIRECRAWL_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const progress = existsSync(PROGRESS) ? JSON.parse(readFileSync(PROGRESS, "utf8")) : {};
const save = () => writeFileSync(PROGRESS, JSON.stringify(progress));

// Singapore phone: optional +65, then 8 digits starting 6/8/9. Avoid 6-digit postals.
const SG_PHONE = /(?:\+?65[\s-]?)?\b([689]\d{3})[\s-]?(\d{4})\b/;
const DENY = /facebook|instagram|tiktok|tripadvisor|foursquare|zomato|burpple|google\.|goo\.gl|maps\.|ladyironchef|sethlui|danielfooddiary|misstamchiak|sgmagazine|eatbook|hungrygowhere|yelp|wikipedia|shopee|lazada|carousell|linkedin|youtube|wa\.me|whatsapp/i;

function findPhone(text) {
  const m = (text || "").match(SG_PHONE);
  return m ? `+65 ${m[1]} ${m[2]}` : null;
}
function pickWebsite(results) {
  for (const r of results || []) {
    try { const h = new URL(r.url).hostname; if (!DENY.test(h)) return `https://${h}`; } catch { /* skip */ }
  }
  return null;
}

async function firecrawl(path, body) {
  const res = await fetch(`https://api.firecrawl.dev/v1/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${FC}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`firecrawl ${path} ${res.status}`);
  return res.json();
}

async function main() {
  if (!FC) { console.error("✗ FIRECRAWL_API_KEY not set (~/.env)"); process.exit(1); }
  const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("✗ missing Supabase env"); process.exit(1); }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await sb.from("businesses")
    .select("id,slug,name,area,phone,website").eq("source", "spreadsheet").limit(2000);
  if (error) { console.error("✗", error.message); process.exit(1); }
  const todo = (rows || [])
    .filter((r) => !progress[r.slug] && (!r.phone || !r.website))
    .slice(0, LIMIT === Infinity ? undefined : LIMIT);

  console.log(`→ ${todo.length} businesses to enrich (phone/website, rate-limited)…`);
  let gotPhone = 0, gotWeb = 0, miss = 0;
  for (const r of todo) {
    try {
      const s = await firecrawl("search", { query: `${r.name} ${r.area || "Singapore"} contact phone`, limit: 4, scrapeOptions: { formats: ["markdown"] } });
      const results = s?.data || [];
      const blob = results.map((x) => `${x.title || ""} ${x.description || ""} ${x.markdown || ""}`).join("\n").slice(0, 20000);
      const phone = r.phone || findPhone(blob);
      const website = r.website || pickWebsite(results);
      const patch = {};
      if (phone && !r.phone) { patch.phone = phone; gotPhone++; }
      if (website && !r.website) { patch.website = website; gotWeb++; }
      if (Object.keys(patch).length) await sb.from("businesses").update(patch).eq("id", r.id);
      progress[r.slug] = patch.phone || patch.website ? "ok" : "none";
      if (!patch.phone && !patch.website) miss++;
      save();
      console.log(`  ${patch.phone || patch.website ? "✓" : "·"} ${r.name}${patch.phone ? " ☎ " + patch.phone : ""}${patch.website ? " 🌐 " + patch.website : ""}`);
    } catch (e) {
      progress[r.slug] = `err:${e.message}`; miss++; save();
      console.log(`  · ${r.name} (${e.message})`);
    }
    await sleep(1500);
  }
  console.log(`✓ done. phone +${gotPhone}, website +${gotWeb}, no-find ${miss}. Re-run to continue.`);
}

main().catch((e) => { console.error("✗ enrich-contacts failed:", e); process.exit(1); });
