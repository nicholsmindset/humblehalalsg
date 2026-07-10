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
  // ---- Build Wave 3 Batch 1 (high-traffic centres from the Ahrefs CSV;
  //      halal-filtered — every stall below is web-verified Muslim-owned/halal). ----
  {
    id: "golden-mile-food-centre", name: "Golden Mile Food Centre", address: "505 Beach Rd, Singapore 199583",
    region: "Central", lat: 1.30256, lng: 103.86353, nearestMrt: "Nicoll Highway / Lavender MRT", hours: "7am–10pm",
    blurb: "A Beach Road institution known for Thai food — and a strong cluster of halal stalls, from chicken rice to charcoal burgers.",
    stalls: [
      { name: "Adimann", stall_no: "#B1-12", cuisine: "Halal Chicken Rice / Seafood", tier: "community" },
      { name: "Ashes Burnnit", stall_no: "#B1-24", cuisine: "Charcoal Burgers / Roti John", tier: "community" },
      { name: "Deen Tiga Rasa", stall_no: "#B1-56", cuisine: "Indian-Muslim", tier: "community" },
    ],
  },
  {
    id: "bedok-corner-food-centre", name: "Bedok Corner Food Centre", address: "1 Bedok Rd, Singapore 469572",
    region: "East", lat: 1.32320, lng: 103.95300, nearestMrt: "Bedok MRT (bus)", hours: "7am–11pm",
    blurb: "One of the east's most halal-friendly hawker centres, with a musollah and a deep bench of Muslim-owned Malay stalls.",
    stalls: [
      { name: "Malek Satay", stall_no: "#01-19", cuisine: "Satay / Malay", tier: "community" },
      { name: "Ayam Goreng Berempah", stall_no: "#01-24", cuisine: "Malay / Fried Chicken", tier: "community" },
      { name: "Sinaran Cahaya", stall_no: "#01-17", cuisine: "Malay / Nasi Campur", tier: "community" },
    ],
  },
  {
    id: "berseh-food-centre", name: "Berseh Food Centre", address: "166 Jln Besar, Singapore 208877",
    region: "Central", lat: 1.30862, lng: 103.85740, nearestMrt: "Jalan Besar / Farrer Park MRT", hours: "7am–10pm",
    blurb: "A Jalan Besar favourite with several Muslim-owned stalls, including one of Singapore's first halal-certified mookata.",
    stalls: [
      { name: "Tree Coconut Nasi Lemak", stall_no: "#02-30", cuisine: "Nasi Lemak", tier: "community" },
      { name: "Salai M'an", stall_no: "#02-04", cuisine: "Smoked Meats / Burgers", tier: "community" },
      { name: "Sedap Thai", stall_no: "#02-27", cuisine: "Halal Mookata / Thai", tier: "community" },
    ],
  },
  {
    id: "east-coast-lagoon-food-village", name: "East Coast Lagoon Food Village", address: "1220 East Coast Parkway, Singapore 468960",
    region: "East", lat: 1.30720, lng: 103.92450, nearestMrt: "Marine Parade area (bus)", hours: "10am–11pm",
    blurb: "The seaside hawker village on East Coast Park — home to Haron Satay, one of Singapore's most-loved halal satay institutions.",
    stalls: [
      { name: "Haron Satay", stall_no: "#01-55", cuisine: "Satay / Malay", tier: "community" },
    ],
  },
  {
    id: "amoy-street-food-centre", name: "Amoy Street Food Centre", address: "7 Maxwell Rd, Singapore 069111",
    region: "Central", lat: 1.27930, lng: 103.84640, nearestMrt: "Telok Ayer / Tanjong Pagar MRT", hours: "7am–3pm",
    blurb: "A CBD lunch institution with a section of Muslim-owned and halal stalls on the first floor, from poke bowls to Indian-Muslim classics.",
    stalls: [
      { name: "Big Bowls Project", stall_no: "#01-01", cuisine: "Halal Poke Bowls", tier: "community" },
      { name: "Bismillah Muslim Food", stall_no: "#01-27", cuisine: "Indian-Muslim / Mee Goreng", tier: "community" },
    ],
  },
  {
    id: "dunman-food-centre", name: "Dunman Food Centre", address: "271 Onan Rd, Singapore 424768",
    region: "East", lat: 1.30860, lng: 103.90100, nearestMrt: "Dakota / Paya Lebar MRT", hours: "7am–9pm",
    blurb: "A small, well-loved Joo Chiat hawker centre — home to the Muslim-owned Satay Solo, serving Solo-style Indonesian satay for generations.",
    stalls: [
      { name: "Satay Solo", stall_no: "#01-01", cuisine: "Indonesian Satay", tier: "community" },
    ],
  },

  // ---- Build Wave 3 Batch 2 (highest-traffic centres from the Ahrefs CSV —
  //      halal-filtered ONLY; every stall below is web-verified Muslim-owned/
  //      halal. Tanglin Halt SKIPPED (closed/redeveloped, stalls moved to
  //      Margaret Drive) and People's Park *Complex* SKIPPED (no halal stalls). ----
  {
    id: "newton-food-centre", name: "Newton Food Centre", address: "500 Clemenceau Ave North, Singapore 229495",
    region: "Central", lat: 1.31283, lng: 103.83919, nearestMrt: "Newton MRT", hours: "12pm–2am",
    blurb: "Singapore's most famous supper hawker centre (of Crazy Rich Asians fame) — best known for BBQ seafood and satay, with a solid row of Muslim-owned halal stalls.",
    stalls: [
      { name: "22 Best Satay", stall_no: "#01-22", cuisine: "Satay / Malay", tier: "community" },
      { name: "Al-Amin Indian Muslim Food", stall_no: "#01-26", cuisine: "Indian-Muslim", tier: "community" },
      { name: "Pirate's Seafood", stall_no: "#01-56", cuisine: "Halal BBQ Seafood", tier: "community" },
      { name: "Hajah Monah", stall_no: "#01-83", cuisine: "Malay / Nasi Padang", tier: "community" },
    ],
  },
  {
    id: "tiong-bahru-market", name: "Tiong Bahru Market & Food Centre", address: "30 Seng Poh Rd, Singapore 168898",
    region: "Central", lat: 1.28509, lng: 103.83200, nearestMrt: "Tiong Bahru MRT", hours: "7am–8pm",
    blurb: "A heritage Tiong Bahru favourite famous for its Chinese hawker fare — with a handful of Muslim-owned and halal stalls tucked among them.",
    stalls: [
      { name: "Ali Corner", stall_no: "#02-17", cuisine: "Indonesian / Malay", tier: "community" },
      { name: "The Coco Rice", stall_no: "#02-58", cuisine: "Halal Nasi Lemak", tier: "community" },
      { name: "Super Shiok Nasi Lemak", stall_no: "#02-38", cuisine: "Nasi Lemak", tier: "community" },
    ],
  },
  {
    id: "alexandra-village-food-centre", name: "Alexandra Village Food Centre", address: "120 Bukit Merah Lane 1, Singapore 150120",
    region: "Central", lat: 1.28730, lng: 103.80480, nearestMrt: "Redhill / Queenstown MRT (bus)", hours: "7am–10pm",
    blurb: "A Bukit Merah institution loved for its variety — with a genuine cluster of halal and Muslim-owned stalls, from Indian-Muslim classics to a halal bakery.",
    stalls: [
      { name: "AJ Delights", stall_no: "#01-82", cuisine: "Halal Bakes / Muffins", tier: "community" },
      { name: "Ashes Burnnit", stall_no: "#01-61", cuisine: "Charcoal Burgers / Roti John", tier: "community" },
      { name: "Sarapan Pagi", stall_no: "#01-66", cuisine: "Malay / Breakfast", tier: "community" },
      { name: "Haji K. Abdul Rehunan Muslim Food", stall_no: "#01-09", cuisine: "Indian-Muslim", tier: "community" },
    ],
  },
  {
    id: "peoples-park-food-centre", name: "People's Park Food Centre", address: "32 New Market Rd, Singapore 050032",
    region: "Central", lat: 1.28490, lng: 103.84370, nearestMrt: "Chinatown MRT", hours: "7am–9pm",
    blurb: "A bustling Chinatown food centre that's mostly Chinese — but home to a Muslim-owned Indonesian-Malay stall and a halal Penang laksa for the community.",
    stalls: [
      { name: "Muslim Food @ People's Park", stall_no: "#01-1002A", cuisine: "Indonesian-Muslim / Malay", tier: "community" },
      { name: "Superstar Original Famous Penang Laksa", stall_no: "#01-1002B", cuisine: "Halal Penang Laksa", tier: "community" },
    ],
  },
  {
    id: "maxwell-food-centre", name: "Maxwell Food Centre", address: "1 Kadayanallur St, Singapore 069118",
    region: "Central", lat: 1.28030, lng: 103.84470, nearestMrt: "Maxwell / Chinatown MRT", hours: "8am–10pm",
    blurb: "The famous Chinatown hawker centre (of Tian Tian chicken rice fame) is mostly non-halal — but there is genuinely halal food here, led by the well-loved Pakistani Dum Briyani.",
    stalls: [
      { name: "Pakistani Dum Briyani SG", stall_no: "#01-69", cuisine: "Pakistani Biryani / Halal", tier: "community" },
      { name: "Traditional Family Cuisine", stall_no: "", cuisine: "Indian-Muslim / Halal", tier: "community" },
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
      // Unit number is nice-to-have, not required — some genuinely-halal stalls
      // are confirmed by a halal directory without a documented #01-XX. Omit the
      // parenthetical rather than print an empty "()".
      const unit = s.stall_no ? ` (${s.stall_no})` : "";
      const { error: sErr } = await sb.from("businesses").upsert({
        id: randomUUID(),
        slug,
        name: s.name,
        cat_id: "hawker",
        area: c.region,
        hawker_centre_id: c.id,
        stall_no: s.stall_no || null,
        lat: c.lat, lng: c.lng,
        halal_tier: s.tier,          // 'community' — honest, never 'muis'
        status: "published",
        source: "community",
        description: `${s.cuisine} stall at ${c.name}${unit}. Community-known halal — confirm on site.`,
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
