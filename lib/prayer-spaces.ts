/* Curated directory of NON-mosque prayer spaces (musollahs / suraus) across
   Singapore — malls, transport hubs, attractions, offices, hospitals and
   campuses. Excludes all mosques/masjids (those live in `mosques` in lib/data.ts).

   Static by design: ~55 read-only, rarely-changing, SEO-critical records ship
   with the code (no DB, no edge functions, no coordinates). All access goes
   through getPrayerSpaces() so a future Supabase swap is a one-function change.

   Manually transcribed from a curated research doc compiled from the public
   MusollahSG and SolatGoWhere directories (+ public reporting). Attributed on
   the page; these spaces open/close/move, so the page tells users to verify. */

export type PrayerSpaceCategory = "malls" | "transport" | "attractions" | "campuses";

export interface PrayerSpace {
  id: string;
  /** Building / place name. */
  name: string;
  /** Region or locale label — shown as a chip. Optional for non-mall entries. */
  area?: string;
  category: PrayerSpaceCategory;
  /** Venue type, e.g. "Mall", "Airport terminal", "University campus". */
  type: string;
  /** Where inside the building — level, wing, landmark. */
  location: string;
  /** Facilities + caveats: wudhu, telekung, separate rooms, official/unofficial. */
  notes: string;
  /** Source directory / reference. */
  source?: string;
}

const PRAYER_SPACES: PrayerSpace[] = [
  // ── Malls & retail ───────────────────────────────────────────────────────
  {
    id: "asia-square-tower-1", name: "Asia Square Tower 1", area: "Town / CBD", category: "malls",
    type: "Office / retail podium", location: "Level 5 carpark musollah.",
    notes: "Mats provided; dedicated prayer area for workers and visitors.", source: "SolatGoWhere, MusollahSG",
  },
  {
    id: "centennial-tower", name: "Centennial Tower", area: "Town / CBD", category: "malls",
    type: "Office tower (next to Suntec)", location: "Basement 1 musollah.",
    notes: "Separated sections for men and women; mats available.", source: "SolatGoWhere",
  },
  {
    id: "suntec-city-mall", name: "Suntec City Mall", area: "Town / CBD", category: "malls",
    type: "Mall", location: "Level 3, Tower 3, near Teo Heng KTV / Burger King.",
    notes: "Musollah with mats; ablution in nearby toilets; well used by shoppers.", source: "Suntec, MusollahSG",
  },
  {
    id: "marina-square", name: "Marina Square", area: "Town / CBD", category: "malls",
    type: "Mall", location: "Basement 1, corner near the carpark corridor.",
    notes: "Musollah with toilet nearby; open 24 hours according to listing.", source: "MusollahSG",
  },
  {
    id: "city-square-mall", name: "City Square Mall", area: "Town / CBD", category: "malls",
    type: "Mall", location: "Level 4 musollah.",
    notes: "Mats provided; convenient for shoppers near Farrer Park.", source: "SolatGoWhere",
  },
  {
    id: "deen-dunya-haji-lane", name: "Deen Dunya @ Haji Lane", area: "Town / CBD", category: "malls",
    type: "Shophouse retail", location: "Level 2 musollah.",
    notes: "Small prayer space with mats; popular with visitors to Kampong Glam.", source: "SolatGoWhere",
  },
  {
    id: "duo-galleria", name: "Duo Galleria", area: "Town / CBD", category: "malls",
    type: "Mixed-use retail podium", location: "Level 1 musollah.",
    notes: "Wudhu area and separated spaces indicated in directory.", source: "SolatGoWhere",
  },
  {
    id: "scape", name: "*SCAPE", area: "Orchard", category: "malls",
    type: "Youth mall", location: "Level 3 musollah.",
    notes: "Wudhu, mats and qibla markings; separated areas listed.", source: "SolatGoWhere",
  },
  {
    id: "fave-on-orchard", name: "Fave on Orchard @ Concorde Hotel", area: "Orchard", category: "malls",
    type: "Retail podium", location: "Dedicated musollah area inside the complex.",
    notes: "Prayer mats and telekung provided; wudhu facilities inside.", source: "MusollahSG blog",
  },
  {
    id: "united-square", name: "United Square", area: "Central", category: "malls",
    type: "Mall", location: "Level 5A carpark, near lots 77/78.",
    notes: "Musollah with mats, telekung, Qur'an and attar; ablution at mall toilets.", source: "Musollah.com",
  },
  {
    id: "lucky-plaza", name: "Lucky Plaza", area: "Orchard", category: "malls",
    type: "Mall", location: "Prayer rooms noted in Muslim-friendly mall roundups (exact level varies by guide).",
    notes: "Listed as a mall with halal food and prayer facilities; confirm level via local directories.", source: "HalalTrip, news",
  },
  {
    id: "raffles-city", name: "Raffles City Shopping Centre", area: "Central", category: "malls",
    type: "Mall", location: "Prayer rooms referenced alongside other town malls.",
    notes: "Included in lists of CBD/Town musollahs; specific level via local guides.", source: "TheSmartLocal, news",
  },
  {
    id: "bedok-mall", name: "Bedok Mall", area: "East", category: "malls",
    type: "Mall", location: "Basement 1 musollah.",
    notes: "Mats provided; inside the integrated transport hub.", source: "SolatGoWhere",
  },
  {
    id: "century-square", name: "Century Square", area: "East (Tampines)", category: "malls",
    type: "Mall", location: "Male prayer room at Basement 1; female at Level 2.",
    notes: "Separate rooms and ablution areas for men and women; opened 2023. In the Muslim-friendly Tampines Hub cluster with halal food nearby.", source: "MusollahSG, news reports",
  },
  {
    id: "causeway-point", name: "Causeway Point", area: "North (Woodlands)", category: "malls",
    type: "Mall", location: "Level 5 surau / prayer rooms near the service lifts.",
    notes: "Separate rooms; mats provided; users advised to take ablution elsewhere.", source: "SolatGoWhere, MustShareNews",
  },
  {
    id: "sembawang-shopping-centre", name: "Sembawang Shopping Centre", area: "North", category: "malls",
    type: "Mall", location: "Level 1 corridor beside Master Prata (#01-24/25).",
    notes: "Shared musollah with mats; ablution at the nearest toilet.", source: "MusollahSG",
  },
  {
    id: "jurong-point", name: "Jurong Point", area: "West", category: "malls",
    type: "Mall", location: "Basement 2 musollah.",
    notes: "Wudhu and separated sections; well used by shoppers.", source: "SolatGoWhere",
  },
  {
    id: "imm-building", name: "IMM Building", area: "West", category: "malls",
    type: "Mall", location: "Level 4, Lift Lobby A, carpark area.",
    notes: "Wudhu available; separated areas for male and female worshippers.", source: "SolatGoWhere",
  },
  {
    id: "westgate", name: "Westgate", area: "West", category: "malls",
    type: "Mall", location: "Level 4 musollah.",
    notes: "Prayer space listed; details via directory.", source: "SolatGoWhere",
  },
  {
    id: "the-grandstand", name: "The Grandstand (Turf City)", area: "West", category: "malls",
    type: "Lifestyle mall", location: "Musollah within the complex, near the carpark.",
    notes: "Wudhu, mats and separated areas according to directory.", source: "SolatGoWhere",
  },
  {
    id: "german-centre", name: "German Centre", area: "West", category: "malls",
    type: "Mixed-use", location: "Level 2 musollah, East Wing.",
    notes: "Wudhu, mats and separated areas; used by tenants and visitors.", source: "SolatGoWhere",
  },
  {
    id: "compass-one", name: "Compass One", area: "North-East (Sengkang)", category: "malls",
    type: "Mall", location: "Level 4 unofficial prayer area at staircase ST09; plus a restaurant musollah for patrons.",
    notes: "Mats and telekung previously provided; users now advised to bring their own items.", source: "MusollahSG, SolatGoWhere",
  },
  {
    id: "hougang-mall", name: "Hougang Mall", area: "North-East", category: "malls",
    type: "Mall", location: "Staircase 3, Level 3 unofficial musollah near the toilets / Popular.",
    notes: "Prayer mat available; muslimah should bring telekung; ablution at nearby toilets.", source: "MusollahSG",
  },
  {
    id: "nex-serangoon", name: "NEX (Serangoon)", area: "North-East", category: "malls",
    type: "Mall", location: "Carpark staircase, Level 3 prayer area with a qibla sign.",
    notes: "Mats and telekung were provided; worshippers now bring their own items.", source: "MusollahSG",
  },
  {
    id: "northshore-plaza", name: "Northshore Plaza I & II", area: "North-East (Punggol)", category: "malls",
    type: "Waterfront malls", location: "Staircase 1 (Plaza I, Level 2→3) and an outdoor staircase at Plaza II Level 3.",
    notes: "Shared unofficial musollahs; mats and telekung at Plaza I; bring your own items at Plaza II.", source: "MusollahSG",
  },
  {
    id: "waterway-point", name: "Waterway Point", area: "North-East (Punggol)", category: "malls",
    type: "Mall", location: "Basement 2, opposite FairPrice Finest (#B2-32).",
    notes: "Musollah with mats and telekung; wudhu in the adjacent toilets.", source: "MusollahSG",
  },
  {
    id: "vivocity", name: "VivoCity", area: "South (HarbourFront)", category: "malls",
    type: "Mall", location: "Level 2, Lobby Q, corridor near the Everbest store, behind the toilets.",
    notes: "Separate men's and women's prayer rooms with dedicated wudhu areas.", source: "MustShareNews",
  },

  // ── Transport hubs & airports ────────────────────────────────────────────
  {
    id: "jewel-changi", name: "Jewel Changi Airport", area: "Changi", category: "transport",
    type: "Airport mall", location: "Level 4 and Basement 5 musollahs.",
    notes: "Mats provided; integrated into Jewel's public areas for travellers and shoppers.", source: "SolatGoWhere",
  },
  {
    id: "changi-t1", name: "Changi Airport Terminal 1", area: "Changi", category: "transport",
    type: "Airport terminal", location: "Level 3 (transit area).",
    notes: "Prayer room within the transit zone; for departing/arriving passengers.", source: "SolatGoWhere",
  },
  {
    id: "changi-t2", name: "Changi Airport Terminal 2", area: "Changi", category: "transport",
    type: "Airport terminal", location: "Level 2 (transit area).",
    notes: "Dedicated prayer space for passengers; listed in musollah directories.", source: "SolatGoWhere",
  },
  {
    id: "bishan-stadium", name: "Bishan MRT / Bishan Stadium", area: "Bishan", category: "transport",
    type: "Stadium / transport", location: "Ground-level musollah inside the Bishan Stadium complex.",
    notes: "Mats provided; convenient for runners and visitors near Bishan interchange.", source: "SolatGoWhere",
  },
  {
    id: "mandai-wildlife-west", name: "Mandai Wildlife West (Bird Paradise access)", area: "Mandai", category: "transport",
    type: "Bus / taxi hub at attraction", location: "Two musollahs: near the main entrance and in the basement public area by the taxi stand.",
    notes: "Separate rooms for men and women; wudhu inside; fits about 5 worshippers at a time.", source: "MusollahSG, SolatGoWhere",
  },

  // ── Attractions & community venues ───────────────────────────────────────
  {
    id: "singapore-flyer", name: "Singapore Flyer", area: "Marina Bay", category: "attractions",
    type: "Tourist attraction", location: "Musollah area within the complex (small nook).",
    notes: "Prayer mats and telekung available; basic space without air-con.", source: "MusollahSG blog",
  },
  {
    id: "ghim-moh-void-deck", name: "Ghim Moh Road void-deck musollah", area: "Ghim Moh", category: "attractions",
    type: "HDB / community", location: "Block 2 Ghim Moh Road, void deck.",
    notes: "Wudhu hose provided; mats and telekung; segregated area noted.", source: "MusollahSG blog",
  },
  {
    id: "jamiyah-islamic-centre", name: "Jamiyah Islamic Centre", category: "attractions",
    type: "Community centre", location: "Dedicated musollah inside the centre.",
    notes: "Air-conditioned, segregated, wudhu amenities, slippers, mats and telekung provided.", source: "MusollahSG blog",
  },
  {
    id: "toa-payoh-safra", name: "Toa Payoh SAFRA", area: "Toa Payoh", category: "attractions",
    type: "Club / community hub", location: "Musollah currently at Level 1 (previously Level 4).",
    notes: "Shared room for men and women; mats and slippers; users bring telekung.", source: "MusollahSG",
  },
  {
    id: "mandai-zoo", name: "Mandai Zoo (Singapore Zoo)", area: "Mandai", category: "attractions",
    type: "Tourist attraction", location: "Prayer room available for patrons; request access at the rental counter.",
    notes: "Users bring their own mats / telekung; wudhu at nearby toilets.", source: "MusollahSG",
  },
  {
    id: "harbourfront-centre", name: "HarbourFront Centre", area: "HarbourFront", category: "attractions",
    type: "Mall at the gateway to Sentosa", location: "Level 2 musollah.",
    notes: "Qibla marked; separated areas; wudhu nearby.", source: "SolatGoWhere",
  },

  // ── Offices, hospitals & campuses ────────────────────────────────────────
  {
    id: "mount-elizabeth-novena", name: "Mount Elizabeth Hospital Novena", area: "Novena", category: "campuses",
    type: "Private hospital", location: "Level 1 musollah in the hospital building.",
    notes: "Wudhu space inside; mats provided; shared room with qibla direction.", source: "MusollahSG, SolatGoWhere",
  },
  {
    id: "nuh", name: "National University Hospital (NUH)", area: "Kent Ridge", category: "campuses",
    type: "Public hospital", location: "Unofficial prayer nook at Level 5, near the Ward 56 lift lobby.",
    notes: "Simple space with a mat; no wudhu or slippers; users use nearby toilets.", source: "MusollahSG blog",
  },
  {
    id: "haw-par-technocentre", name: "Haw Par Technocentre", category: "campuses",
    type: "Office complex", location: "Level 2, Staircase 4 musollah.",
    notes: "Wudhu and mats available; commonly used by staff.", source: "SolatGoWhere",
  },
  {
    id: "cintech-science-park", name: "Cintech I @ Science Park 1", area: "Science Park", category: "campuses",
    type: "Office / R&D building", location: "Level 2 musollah.",
    notes: "Wudhu and mats; convenient for workers in Science Park.", source: "SolatGoWhere",
  },
  {
    id: "jtc-summit", name: "JTC Summit (Jurong Town Hall)", area: "Jurong", category: "campuses",
    type: "Office tower", location: "Level 4 musollah.",
    notes: "Wudhu and mats; separated areas listed.", source: "SolatGoWhere",
  },
  {
    id: "bukit-batok-driving-centre", name: "Bukit Batok Driving Centre", area: "Bukit Batok", category: "campuses",
    type: "Training centre", location: "Level 3 musollah.",
    notes: "Wudhu and mats; used by learner drivers and staff.", source: "SolatGoWhere",
  },
  {
    id: "suss", name: "SUSS (SIM campus)", area: "Clementi", category: "campuses",
    type: "University campus", location: "Blk A Level 1, Staircase 24, plus other rooms.",
    notes: "Slippers, telekung, kain and mats; separated by partition; ablution at a nearby toilet.", source: "MusollahSG",
  },
  {
    id: "ite-college-west", name: "ITE College West", area: "Choa Chu Kang", category: "campuses",
    type: "ITE campus", location: "Multiple musollahs at Blk 1 & Blk 2, Level 1.",
    notes: "Separate muslimin / muslimah spaces; wudhu via hose (men) or toilets (women); bring your own mats.", source: "MusollahSG",
  },
  {
    id: "temasek-poly", name: "Temasek Polytechnic", area: "Tampines", category: "campuses",
    type: "Polytechnic campus", location: "Musollahs in Health Science (L5), IT (Blk 1 L6), Business (L2), Sports & Arts Centre, and Design (Blk 28A L8).",
    notes: "Shared rooms; users bring their own prayer mats / telekung; ablution at toilets.", source: "MusollahSG",
  },
  {
    id: "ngee-ann-poly", name: "Ngee Ann Polytechnic", area: "Clementi", category: "campuses",
    type: "Polytechnic campus", location: "Convention Centre B1, Blk 58 L4, and Blk 51 L6 musollahs.",
    notes: "Telekung and mats provided; shared musollahs; wudhu at nearby toilets.", source: "MusollahSG",
  },
  {
    id: "sutd", name: "SUTD", area: "Upper Changi", category: "campuses",
    type: "University campus", location: "Block 2, Basement 1 prayer room.",
    notes: "Shared room divided by a curtain; female section on the right; wudhu nearby.", source: "MusollahSG",
  },
];

/** Single data-access point. Returns the static list today; swap the body for a
 *  Supabase query later (non-dev editing / user submissions) without touching
 *  the page or the records. */
export function getPrayerSpaces(): PrayerSpace[] {
  return PRAYER_SPACES;
}

/** All spaces in a category, in source order. */
export function byCategory(cat: PrayerSpaceCategory): PrayerSpace[] {
  return PRAYER_SPACES.filter((p) => p.category === cat);
}

export const PRAYER_CATEGORIES: { id: PrayerSpaceCategory; label: string; blurb: string }[] = [
  { id: "malls", label: "Malls & retail", blurb: "Prayer rooms inside shopping malls and retail complexes." },
  { id: "transport", label: "Transport hubs & airports", blurb: "Prayer facilities for when you're in transit." },
  { id: "attractions", label: "Attractions & community", blurb: "Prayer spaces in tourist attractions and community hubs." },
  { id: "campuses", label: "Offices, hospitals & campuses", blurb: "For visiting offices, hospitals, or studying on campus." },
];
