/* Humble Halal — generate a cold-outreach CSV of unclaimed directory businesses:
   name, address, postal, area, halal status, claim URL, listing URL. Drop into
   any email/CRM tool to start the claim campaign. Read-only.
   Usage:  node scripts/gen-outreach-csv.mjs [outPath] */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ENV = fileURLToPath(new URL("../.env.local", import.meta.url));
const OUT = process.argv[2] || "/Users/robertnichols/Desktop/AI Projects/humblehalalsg/humblehalalsg/outreach-claim-list.csv";
const SITE = "https://www.humblehalal.com";

const env = {};
if (existsSync(ENV)) for (const l of readFileSync(ENV, "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const halalLabel = (tier, attrs) =>
  tier === "muis" ? "MUIS Certified"
  : (attrs || []).includes("muslim-owned") ? "Muslim-Owned"
  : (attrs || []).includes("muslim-friendly") ? "Muslim-Friendly"
  : "Self-declared";
const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

const { data, error } = await sb
  .from("businesses")
  .select("name,slug,address,postal,area,halal_tier,attributes,owner_id,claimed_by")
  .eq("source", "spreadsheet")
  .order("name");
if (error) { console.error("✗", error.message); process.exit(1); }

const header = ["Name", "Address", "Postal", "Area", "Halal status", "Claimed", "Claim URL", "Listing URL"];
const rows = data.map((b) => [
  b.name,
  b.address || "",
  b.postal || "",
  b.area || "",
  halalLabel(b.halal_tier, b.attributes),
  b.owner_id || b.claimed_by ? "Yes" : "No",
  `${SITE}/claim?id=${b.slug}`,
  `${SITE}/business/${b.slug}`,
]);
const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n") + "\n";
writeFileSync(OUT, csv);
const unclaimed = rows.filter((r) => r[5] === "No").length;
console.log(`✓ wrote ${rows.length} businesses (${unclaimed} unclaimed) → ${OUT}`);
