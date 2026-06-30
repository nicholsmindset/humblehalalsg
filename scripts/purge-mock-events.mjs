/* Humble Halal — one-time go-live cleanup: remove the demo/test events that were
   seeded into Supabase `events` before launch (the lib/events-data mock batch +
   ad-hoc "test" events). Real events created by owners carry an organiser
   `business_id`; the mock/test rows do not — so we purge rows with no
   business_id. After this, /events shows the clean empty state until real
   events are published. Re-runnable (no-op once clean).

   Usage:  node scripts/purge-mock-events.mjs        (purge)
           DRY=1 node scripts/purge-mock-events.mjs   (list only)
   Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local. */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ENV = fileURLToPath(new URL("../.env.local", import.meta.url));
const env = {};
if (existsSync(ENV)) for (const l of readFileSync(ENV, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
Object.assign(env, process.env);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: doomed, error: selErr } = await sb.from("events").select("id,title,slug,business_id").is("business_id", null);
if (selErr) { console.error("✗ select failed:", selErr.message); process.exit(1); }
console.log(`→ ${doomed.length} mock/test events (no organiser business_id):`);
for (const e of doomed) console.log(`   - ${e.title} (${e.slug})`);

if (process.env.DRY === "1") { console.log("DRY=1 → nothing deleted."); process.exit(0); }
if (doomed.length === 0) { console.log("✓ already clean."); process.exit(0); }

const { error: delErr } = await sb.from("events").delete().is("business_id", null);
if (delErr) { console.error("✗ delete failed:", delErr.message); process.exit(1); }
const { count } = await sb.from("events").select("*", { count: "exact", head: true });
console.log(`✓ purged ${doomed.length} mock/test events. events table now = ${count}.`);
