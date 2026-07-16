import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase production credentials");

const sb = createClient(url, key, { auth: { persistSession: false } });
const day = (open: string, close: string) => ({ open, close });
const all = (open: string, close: string) => Array.from({ length: 7 }, () => day(open, close));
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
// OneMap results captured during the 2026-07-16 editorial verification. Keeping
// them here makes reruns deterministic and avoids unnecessary geocoder traffic.
const knownCoordinates: Record<string, { lat: number; lng: number }> = {
  "199329": { lat: 1.30428473904067, lng: 103.85964169367 },
  "259604": { lat: 1.3207548533119, lng: 103.817903722133 },
  "198904": { lat: 1.30162302492667, lng: 103.860055669391 },
  "579783": { lat: 1.35528263459438, lng: 103.850922068559 },
  "079027": { lat: 1.27468281482263, lng: 103.843488359469 },
  "199726": { lat: 1.30040853138496, lng: 103.8596746564 },
  "199484": { lat: 1.30085525980136, lng: 103.859928617159 },
};

const records = [
  {
    slug: "all-things-delicious", name: "All Things Delicious", area: "Kampong Gelam", cat_id: "cafes",
    subcategory_id: "brunch-western", address: "34 Arab Street, #01-01", postal: "199733", phone: "+65 6291 4252",
    website: "https://restaurant.allthingsdelicious.sg/", price_level: "$$", halal_tier: "muis",
    attributes: ["breakfast", "brunch", "muis-certified", "bakery", "family-friendly", "delivery"],
    socials: { instagram: "allthingsdelicioussg", tiktok: "allthingsdelicioussg" }, opening_hours: all("08:00", "22:00"),
    description: "MUIS halal-certified bakery-café serving all-day brunch, shakshouka, brioche French toast and handmade pastries in a Kampong Gelam shophouse.",
    contact_email: null,
    provenance: { website: "https://allthingsdelicious.sg/pages/faq-all-about-us", checked_at: "2026-07-16", note: "Business states all facilities and products are MUIS halal-certified." },
  },
  {
    slug: "penny-university-jalan-klapa", name: "Penny University (Jalan Klapa)", area: "Kampong Gelam", cat_id: "cafes",
    subcategory_id: "brunch-western", address: "17 Jalan Klapa", postal: "199329", phone: null,
    website: "https://www.pennyuniversitysg.com/", price_level: "$$", halal_tier: "declared",
    attributes: ["breakfast", "brunch", "specialty-coffee", "delivery"],
    socials: { tiktok: "pennyuniversitysg" }, opening_hours: all("08:00", "22:00"),
    description: "Halal specialty coffeehouse and roastery serving brunch from 8am to 4pm, including eggs Benedict, Turkish eggs, French toast and a Builder’s Breakfast.",
    contact_email: null,
    provenance: { website: "https://www.pennyuniversitysg.com/", checked_at: "2026-07-16", note: "Current flagship address replaces the former East Coast location." },
  },
  {
    slug: "small-batch-botanic-gardens", name: "Small Batch (Botanic Gardens)", area: "Bukit Timah", cat_id: "cafes",
    subcategory_id: "brunch-western", address: "1H Cluny Road, #01-K1, Jacob Ballas Children's Garden", postal: "259604", phone: null,
    website: "https://www.batch.sg/", price_level: "$$", halal_tier: "declared",
    attributes: ["breakfast", "brunch", "halal-friendly", "family-friendly", "wheelchair-accessible"],
    socials: {}, opening_hours: [null, day("08:00", "17:00"), day("08:00", "17:00"), day("08:00", "17:00"), day("08:00", "17:00"), day("08:00", "18:00"), day("08:00", "18:00")],
    description: "Halal-friendly garden café beside Jacob Ballas Children’s Garden, known for build-your-own brunch boards, fresh bakes and family-friendly mornings.",
    contact_email: "ask@batch.sg",
    provenance: { website: "https://www.batch.sg/", checked_at: "2026-07-16", note: "Business describes all Black Hole Group concepts, including Small Batch, as halal-friendly." },
  },
  {
    slug: "the-secret-garden-by-zeekri", name: "The Secret Garden by Zeekri", area: "Kampong Gelam", cat_id: "restaurants",
    subcategory_id: "brunch-western", address: "19 Baghdad Street, #01-19", postal: "199658", phone: "+65 6980 3330",
    website: "https://www.tsgbyzeekri.com/", price_level: "$$$", halal_tier: "declared",
    attributes: ["breakfast", "weekend-brunch", "muslim-owned", "french-inspired", "high-tea"],
    socials: { whatsapp: "+6591895663", instagram: "tsgbyzeekri", tiktok: "tsgbyzeekri" }, opening_hours: all("09:00", "22:30"),
    description: "Muslim-owned French-inspired brasserie with a dedicated weekend brunch menu, pastries, French omelettes, eggs Benedict and an intimate floral setting.",
    contact_email: "info@tsgbyzeekri.com",
    provenance: { website: "https://www.tsgbyzeekri.com/", checked_at: "2026-07-16", note: "Business states SMCCI Muslim-Owned Establishment certification; not labelled MUIS-certified." },
  },
  {
    slug: "pancake-and-waffle-place", name: "Pancake & Waffle Place", area: "Kampong Gelam", cat_id: "cafes",
    subcategory_id: "brunch-western", address: "56 Kandahar Street", postal: "198904", phone: "+65 6518 9368",
    website: "https://www.pancakeandwaffleplace.com.sg/", price_level: "$$", halal_tier: "declared",
    attributes: ["breakfast", "weekend-brunch", "muslim-owned", "pancakes", "waffles"],
    socials: { whatsapp: "+6584530523" }, opening_hours: [day("12:00", "22:00"), day("12:00", "22:00"), day("12:00", "22:00"), day("12:00", "22:00"), day("12:00", "22:00"), day("09:00", "22:00"), day("09:00", "22:00")],
    description: "100% Muslim-owned café with a dedicated weekend breakfast menu pairing pancakes or waffles with savoury and sweet toppings.",
    contact_email: null,
    provenance: { website: "https://www.pancakeandwaffleplace.com.sg/", checked_at: "2026-07-16", note: "Business states it is 100% Muslim-owned and serves halal food." },
  },
  {
    slug: "good-bites-bishan", name: "Good Bites (Bishan)", area: "Bishan", cat_id: "cafes",
    subcategory_id: "brunch-western", address: "5 Bishan Street 14, #03-01, Bishan Sports Hall", postal: "579783", phone: "+65 6970 0233",
    website: "https://www.goodbites.com.sg/", price_level: "$$", halal_tier: "declared",
    attributes: ["breakfast", "weekend-brunch", "late-night", "family-friendly", "wheelchair-accessible"],
    socials: { instagram: "goodbitessg" }, opening_hours: [day("11:00", "05:00"), day("11:00", "05:00"), day("11:00", "05:00"), day("11:00", "05:00"), day("11:00", "05:00"), day("09:00", "05:00"), day("09:00", "05:00")],
    description: "Western-fusion café at Bishan Sports Hall serving weekend brunch, chicken and waffles, pasta and burgers, with late-night opening hours.",
    contact_email: "hello@goodbites.com.sg",
    provenance: { website: "https://www.goodbites.com.sg/", checked_at: "2026-07-16", note: "Venue is widely presented as halal-certified; current outlet certificate should be checked on HalalSG." },
  },
  {
    slug: "the-tree-cafe-100am", name: "The Tree Café (100AM)", area: "Tanjong Pagar", cat_id: "cafes",
    subcategory_id: "brunch-western", address: "100 Tras Street, #01-01, 100AM Mall", postal: "079027", phone: "+65 8027 1776",
    website: "https://www.thetreecafesg.com/", price_level: "$", halal_tier: "pending",
    attributes: ["breakfast", "local-breakfast", "pending-certification", "family-friendly"],
    socials: { instagram: "thetreecafesg", tiktok: "thetreecafesg", whatsapp: "+6580271776" }, opening_hours: all("08:00", "21:30"),
    description: "Affordable café at 100AM with a dedicated 8am–10am local breakfast menu. The brand states this outlet’s halal certification is pending.",
    contact_email: "thetreecafesg@gmail.com",
    provenance: { website: "https://www.thetreecafesg.com/", checked_at: "2026-07-16", note: "Brand says all outlets are halal-certified except 100AM, which is pending certification." },
  },
  {
    slug: "woolys-bagels-arab-street", name: "Wooly’s Bagels (Arab Street)", area: "Kampong Gelam", cat_id: "cafes",
    subcategory_id: "brunch-western", address: "27 Arab Street", postal: "199726", phone: null,
    website: "https://www.instagram.com/woolysbagels/", price_level: "$$", halal_tier: "declared",
    attributes: ["brunch", "muslim-owned", "bagels", "takeaway"],
    socials: { instagram: "woolysbagels" }, opening_hours: all("10:30", "20:30"),
    description: "Muslim-owned bagel shop known for hearty breakfast-style fillings including scrambled eggs, chicken ham, hash browns and otah.",
    contact_email: null,
    provenance: { website: "https://www.instagram.com/woolysbagels/", checked_at: "2026-07-16", note: "Current Arab Street outlet and hours cross-checked against a March 2026 local guide." },
  },
  {
    slug: "fika-swedish-cafe-beach-road", name: "Fika Swedish Café & Bistro", area: "Kampong Gelam", cat_id: "cafes",
    subcategory_id: "brunch-western", address: "257 Beach Road", postal: "199539", phone: "+65 6396 9096",
    website: "https://www.fikacafe.com/", price_level: "$$", halal_tier: "declared",
    attributes: ["brunch", "muslim-owned", "swedish", "family-friendly"],
    socials: { instagram: "fikacafesg" }, opening_hours: [day("11:00", "21:00"), day("11:00", "21:00"), day("11:00", "21:00"), day("11:00", "21:00"), day("11:00", "22:00"), day("11:00", "22:00"), day("11:00", "21:00")],
    description: "Muslim-owned Swedish café serving pancakes, waffles, pastries, coffee, meatballs and Scandinavian comfort food near Arab Street.",
    contact_email: "info@fikacafe.com",
    provenance: { website: "https://www.fikacafe.com/", checked_at: "2026-07-16", note: "Official site states the café is owned and operated by Muslims." },
  },
  {
    slug: "the-malayan-council-bussorah", name: "The Malayan Council (Bussorah)", area: "Kampong Gelam", cat_id: "restaurants",
    subcategory_id: "malay-western", address: "71 Bussorah Street", postal: "199484", phone: null,
    website: "https://themalayancouncil.sg/", price_level: "$$$", halal_tier: "declared",
    attributes: ["late-brunch", "halal-dining", "group-dining", "cakes"],
    socials: { instagram: "themalayancouncil.sg" }, opening_hours: all("11:00", "23:00"),
    description: "Halal Malay-Western fusion restaurant for substantial late brunches, sharing plates and signature cakes on Bussorah Street.",
    contact_email: null,
    provenance: { website: "https://themalayancouncil.sg/", checked_at: "2026-07-16", note: "Business describes the concept as halal dining." },
  },
].map((record) => ({ ...record, status: "published", source: "editorial", featured: false, plan: "free", last_verified_at: new Date().toISOString() }));

async function geocode(address: string, postal: string) {
  for (const searchVal of [`${address}, Singapore ${postal}`, postal, address]) {
    try {
      const response = await fetch(`https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(searchVal)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`);
      if (!response.ok) continue;
      const json = await response.json() as { results?: { LATITUDE?: string; LONGITUDE?: string }[] };
      const hit = json.results?.[0];
      const lat = Number(hit?.LATITUDE);
      const lng = Number(hit?.LONGITUDE);
      if (lat > 1.15 && lat < 1.48 && lng > 103.6 && lng < 104.1) return { lat, lng };
    } catch {
      // Try the next, less specific query.
    }
  }
  return {};
}

async function main() {
  const { data: existing, error: readError } = await sb.from("businesses").select("id,slug,name");
  if (readError) throw readError;

  let inserted = 0;
  let updated = 0;
  for (const record of records) {
    const match = existing?.find((item) => item.slug === record.slug || normalize(item.name) === normalize(record.name));
    const coords = knownCoordinates[record.postal] || await geocode(record.address, record.postal);
    const payload: Record<string, unknown> = { ...record, ...coords };
    const query = match
      ? sb.from("businesses").update(payload).eq("id", match.id)
      : sb.from("businesses").insert(payload);
    const { error } = await query;
    if (error) throw new Error(`${record.name}: ${error.message}`);
    if (match) updated += 1;
    else inserted += 1;
    console.log(`${match ? "updated" : "inserted"}: ${record.name}`);
  }

  console.log(`complete: ${inserted} inserted, ${updated} updated`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
