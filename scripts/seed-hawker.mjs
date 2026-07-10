/* Humble Halal — seed hawker centres + a starter set of halal stalls.
   Centres are factual public data (name/address/coords). Stalls are well-known,
   genuinely Muslim-owned / halal institutions, seeded honestly as halal_tier
   'community' (community-known) — NEVER 'muis' (certification is verified only via
   the MUIS workflow, never asserted by a seed). Idempotent (upsert). Safe to
   re-run. Reuse geocode-listings.mjs for any missing coords.

   Usage:  node scripts/seed-hawker.mjs
   Env:    NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local)
*/
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = { ...loadEnv(fileURLToPath(new URL("../.env.local", import.meta.url))), ...process.env };
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Centre: { id, name, address, region, lat, lng, nearestMrt, hours, stalls: [{name, stall_no, cuisine, tier}] }
const CENTRES = [
  {
    id: "geylang-serai-market", name: "Geylang Serai Market", address: "1 Geylang Serai, Singapore 402001",
    region: "East", lat: 1.31756, lng: 103.89757, nearestMrt: "Paya Lebar MRT", hours: "8am–10pm",
    blurb: "Singapore's largest Malay/Muslim wet market and food centre — a nasi padang institution.",
    stalls: [
      { name: "Sabar Menanti", stall_no: "#02-137", cuisine: "Nasi Padang", tier: "community" },
      { name: "Rumah Makan Minang", stall_no: "#02-140", cuisine: "Nasi Padang", tier: "community" },
      { name: "Hjh Maimunah Geylang Serai", stall_no: "#02-141", cuisine: "Malay / Nasi Padang", tier: "community" },
    ],
  },
  {
    id: "adam-road-food-centre", name: "Adam Road Food Centre", address: "2 Adam Rd, Singapore 289876",
    region: "Central", lat: 1.32360, lng: 103.81402, nearestMrt: "Botanic Gardens MRT", hours: "6am–11pm",
    blurb: "Famed halal food centre — nasi lemak, mee rebus and prata.",
    stalls: [
      { name: "Selera Rasa Nasi Lemak", stall_no: "#01-02", cuisine: "Nasi Lemak", tier: "community" },
      { name: "Adam Road Nasi Lemak", stall_no: "#01-25", cuisine: "Nasi Lemak", tier: "community" },
      { name: "The Roti Prata House (Adam Road)", stall_no: "#01-05", cuisine: "Prata / Indian-Muslim", tier: "community" },
    ],
  },
  {
    id: "tekka-centre", name: "Tekka Centre", address: "665 Buffalo Rd, Singapore 210665",
    region: "Central", lat: 1.30610, lng: 103.84964, nearestMrt: "Little India MRT", hours: "7am–9pm",
    blurb: "Little India's food centre — biryani and Indian-Muslim classics.",
    stalls: [
      { name: "Allauddin's Briyani", stall_no: "#01-232", cuisine: "Biryani / Indian-Muslim", tier: "community" },
      { name: "Yakader", stall_no: "#01-254", cuisine: "Indian-Muslim", tier: "community" },
    ],
  },
  {
    id: "old-airport-road-food-centre", name: "Old Airport Road Food Centre", address: "51 Old Airport Rd, Singapore 390051",
    region: "Central", lat: 1.30820, lng: 103.88530, nearestMrt: "Dakota MRT", hours: "7am–10pm",
    blurb: "One of Singapore's most-loved hawker centres — several halal stalls among the classics.",
    stalls: [
      { name: "Nasi Lemak Kukus Tradisional", stall_no: "#01-96", cuisine: "Nasi Lemak", tier: "community" },
    ],
  },
  {
    id: "haig-road-market-food-centre", name: "Haig Road Market & Food Centre", address: "14 Haig Rd, Singapore 430014",
    region: "East", lat: 1.31437, lng: 103.89729, nearestMrt: "Dakota MRT", hours: "7am–10pm",
    blurb: "One side is a row of beloved Malay/Muslim halal stalls — putu piring, mee rebus and satay institutions.",
    stalls: [
      { name: "Haig Road Putu Piring", stall_no: "#01-06", cuisine: "Putu Piring / Kueh", tier: "community" },
      { name: "Afandi Hawa & Family", stall_no: "#01-21", cuisine: "Mee Rebus / Malay", tier: "community" },
      { name: "Warong Sudi Mampir", stall_no: "#01-13", cuisine: "Satay / Malay", tier: "community" },
    ],
  },
  {
    id: "tampines-round-market", name: "Tampines Round Market & Food Centre", address: "Blk 137 Tampines St 11, Singapore 521137",
    region: "East", lat: 1.35296, lng: 103.94012, nearestMrt: "Tampines MRT", hours: "6am–10pm",
    blurb: "The Tampines heartland's round market — a strong cluster of Muslim-owned nasi lemak and nasi padang stalls.",
    stalls: [
      { name: "Nasi Lemak Specialist", stall_no: "#01-14", cuisine: "Nasi Lemak", tier: "community" },
      { name: "Kayat Nasi Padang", stall_no: "#01-37", cuisine: "Nasi Padang", tier: "community" },
      { name: "Tok Ayah Nasi Padang", stall_no: "#01-36", cuisine: "Nasi Padang", tier: "community" },
    ],
  },
];

async function main() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("✗ missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"); process.exit(1); }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  let centreN = 0, stallN = 0;
  for (const c of CENTRES) {
    const { error: cErr } = await sb.from("hawker_centres").upsert({
      id: c.id, name: c.name, address: c.address, region: c.region,
      lat: c.lat, lng: c.lng, nearest_mrt: c.nearestMrt, hours: c.hours, blurb: c.blurb,
      source: "community", updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (cErr) { console.error(`✗ centre ${c.name}:`, cErr.message); continue; }
    centreN++;
    for (const s of c.stalls) {
      const slug = `${slugify(s.name)}-${c.id}`.slice(0, 80);
      const { error: sErr } = await sb.from("businesses").upsert({
        id: randomUUID(),
        slug,
        name: s.name,
        cat_id: "hawker",
        area: c.region,
        hawker_centre_id: c.id,
        stall_no: s.stall_no,
        lat: c.lat, lng: c.lng,
        halal_tier: s.tier,          // 'community' — honest, never 'muis'
        status: "published",
        source: "community",
        description: `${s.cuisine} stall at ${c.name} (${s.stall_no}). Community-known halal — confirm on site.`,
        price_level: "$",
        attributes: ["halal-food-onsite"],
      }, { onConflict: "slug", ignoreDuplicates: false });
      if (sErr) { console.error(`  ✗ stall ${s.name}:`, sErr.message); continue; }
      stallN++;
      console.log(`  ✓ ${c.name} → ${s.name} (${s.stall_no})`);
    }
  }
  console.log(`✓ seeded ${centreN} centres, ${stallN} halal stalls.`);
}

main().catch((e) => { console.error("✗ seed-hawker failed:", e); process.exit(1); });
