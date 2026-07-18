/* Humble Halal — hand-authored area profiles for the programmatic SEO pages.
   Each profile powers the area-page template v2 (SeoScreen): a unique local
   intro (≥30–40% of visible copy unique per page — the pSEO quality bar),
   real MRT stations, landmarks with links into existing venue pages, and
   area-specific FAQs appended to the global halal FAQs.

   Content rules:
   - Only name places that verifiably exist (malls, hawker centres, mosques,
     MRT stations). NEVER name specific restaurants or assert a venue is
     halal-certified — certification claims stay with the MUIS register
     (see lib/muis posture) and per-listing badges.
   - ids match the `halal-food-in-{id}` slug ids in lib/seo-pages.ts
     (curated areas + EXTRA_AREAS).
   - Intros are 120–180 words, written per area, not templated. */

import { towns } from "./sg-locations";
import { haversineKm } from "./geo";

export type AreaLandmark = {
  name: string;
  type: "mall" | "hawker" | "park" | "attraction" | "heritage" | "mosque";
  /** links to /halal/halal-food-at-{venueId} when that venue page exists */
  venueId?: string;
};

export type AreaProfile = {
  /** matches the `halal-food-in-{id}` slug id */
  id: string;
  name: string;
  coords: { lat: number; lng: number };
  intro: string;
  /** station names without the "MRT" suffix */
  mrts: string[];
  landmarks: AreaLandmark[];
  faqs: { q: string; a: string }[];
};

export const AREA_PROFILES: Record<string, AreaProfile> = {
  yishun: {
    id: "yishun",
    name: "Yishun",
    coords: { lat: 1.4304, lng: 103.8354 },
    intro:
      "Yishun quietly holds its own as one of the North's best halal food neighbourhoods. The action centres on Northpoint City — Singapore's largest northern mall, directly above Yishun MRT — where halal-certified fast food, bakeries and family restaurants sit alongside a big basement food scene. Step out to the heartland and it gets better: Chong Pang City is a late-night supper institution for Malay food, while Yishun Park Hawker Centre brings newer hawker concepts under one roof. Muslim-owned cafés and food stalls dot the HDB blocks between Khatib and Canberra, and Masjid Darul Makmur anchors the community off Yishun Avenue. Whether you're after post-work dinner near the MRT, a weekend family meal, or 1am supper at Chong Pang, this guide tracks the verified halal and Muslim-owned options — each with its halal-confidence score, so you know what's MUIS-certified and what's self-declared.",
    mrts: ["Yishun", "Khatib", "Canberra"],
    landmarks: [
      { name: "Northpoint City", type: "mall", venueId: "northpoint-city" },
      { name: "Chong Pang City", type: "hawker" },
      { name: "Yishun Park Hawker Centre", type: "hawker" },
      { name: "Lower Seletar Reservoir Park", type: "park" },
      { name: "Masjid Darul Makmur", type: "mosque" },
    ],
    faqs: [
      { q: "Is there halal food at Northpoint City?", a: "Yes — Northpoint City has multiple halal-certified outlets across its food court, fast-food chains and restaurants. Check each outlet's certificate on the MUIS HalalSG register, or look for the badge on its Humble Halal listing." },
      { q: "Where can I get late-night halal supper in Yishun?", a: "Chong Pang City (near Blk 105 Yishun Ring Road) is the classic northern supper spot, with Malay and Muslim-owned stalls that run late. Yishun Park Hawker Centre is a newer alternative with earlier hours." },
      { q: "Is there a mosque in Yishun?", a: "Yes — Masjid Darul Makmur serves the Yishun area. Many nearby eateries are used to the Friday-prayer lunch crowd, so expect queues after Jumu'ah." },
    ],
  },

  orchard: {
    id: "orchard",
    name: "Orchard",
    coords: { lat: 1.3048, lng: 103.8318 },
    intro:
      "Halal food on Orchard Road is easier to find than most visitors expect — you just need to know which buildings to enter. Lucky Plaza is the historic anchor: its upper floors and basement hide long-running halal eateries loved by the Malay and Filipino communities alike. ION Orchard, Ngee Ann City and 313@Somerset all carry halal-certified outlets in their food halls, and Plaza Singapura at the Dhoby Ghaut end adds another cluster. For prayer, Masjid Al-Falah sits just off Orchard at Cairnhill — a rare convenience on a shopping strip this dense. The stretch is served by three MRT stations (Orchard, Somerset and Orchard Boulevard), so everything here is a short, air-conditioned walk away. This guide keeps score of the verified halal and Muslim-owned options along the belt, from quick food-court meals between shops to proper sit-down dinners before the evening crowd hits.",
    mrts: ["Orchard", "Somerset", "Orchard Boulevard", "Dhoby Ghaut"],
    landmarks: [
      { name: "Lucky Plaza", type: "mall" },
      { name: "ION Orchard", type: "mall" },
      { name: "Ngee Ann City", type: "mall" },
      { name: "313@Somerset", type: "mall" },
      { name: "Plaza Singapura", type: "mall", venueId: "plaza-singapura" },
      { name: "Masjid Al-Falah", type: "mosque" },
    ],
    faqs: [
      { q: "Is there a mosque near Orchard Road?", a: "Yes — Masjid Al-Falah on Bideford Road (off Cairnhill) is a few minutes' walk from Somerset MRT, making Orchard one of the easiest shopping districts to combine with prayers." },
      { q: "Which Orchard mall is best for halal food?", a: "Lucky Plaza has the deepest halal heritage on the strip, while ION Orchard, 313@Somerset and Plaza Singapura carry halal-certified outlets in their food halls. Verify individual outlets on the MUIS register." },
      { q: "Is halal food on Orchard Road expensive?", a: "It ranges widely — food-court and Lucky Plaza meals stay hawker-priced, while hotel and restaurant dining runs higher. Listings here show price bands so you can filter." },
    ],
  },

  tampines: {
    id: "tampines",
    name: "Tampines",
    coords: { lat: 1.3536, lng: 103.9452 },
    intro:
      "Tampines is the East's halal heavyweight. Three malls ring the MRT interchange — Tampines Mall, Century Square and Tampines 1 — each stacked with halal-certified chains, bakeries and dessert spots, while Our Tampines Hub adds a hawker centre and community dining under one roof. The Tampines Round Market & Food Centre keeps the traditional end alive with Malay breakfast stalls that sell out by mid-morning. Presiding over it all is Masjid Darul Ghufran on Tampines Avenue 5, one of Singapore's largest mosques, which makes the area a natural weekend anchor for Muslim families across the East. With the East-West and Downtown lines both stopping here, Tampines works as a halal dining base whether you live eastside or are just passing through to Changi. This guide tracks the certified and Muslim-owned spots across the malls, the hawker centres and the quieter neighbourhood blocks.",
    mrts: ["Tampines", "Tampines East", "Tampines West"],
    landmarks: [
      { name: "Tampines Mall", type: "mall", venueId: "tampines-mall" },
      { name: "Century Square", type: "mall" },
      { name: "Tampines 1", type: "mall" },
      { name: "Our Tampines Hub", type: "mall", venueId: "tampines-hub" },
      { name: "Tampines Round Market & Food Centre", type: "hawker" },
      { name: "Masjid Darul Ghufran", type: "mosque" },
    ],
    faqs: [
      { q: "Which Tampines mall has the most halal options?", a: "All three interchange malls carry halal-certified outlets; Tampines Mall and Tampines 1 have the largest spread, and Our Tampines Hub adds a hawker centre. Check individual certificates on the MUIS register." },
      { q: "Where is Masjid Darul Ghufran?", a: "On Tampines Avenue 5, a short walk from the interchange — it's one of the largest mosques in Singapore. Expect nearby eateries to be busy after Friday prayers." },
      { q: "Is there halal breakfast in Tampines?", a: "The Tampines Round Market & Food Centre has Malay breakfast stalls from early morning — go before 10am for the best pick, as favourites sell out." },
    ],
  },

  hougang: {
    id: "hougang",
    name: "Hougang",
    coords: { lat: 1.3612, lng: 103.8863 },
    intro:
      "Hougang's halal scene is heartland Singapore at its most honest — less glossy than the malls of Tampines or Jurong, more about neighbourhood coffeeshops, Muslim-owned stalls and family-run eateries spread along Hougang Avenue and the Kovan fringe. Hougang Mall above the bus interchange and Hougang 1 near the CTE carry the certified chains, while Kovan's market and food centre a stop away adds hawker depth. The area is served by Hougang MRT on the North East Line, with Masjid En-Naeem on Tampines Road holding down the community's spiritual centre. What Hougang rewards is exploration: some of the North-East's best Malay food hides in unassuming coffeeshop corners here. This guide surfaces the verified halal and Muslim-owned options — each with a halal-confidence score — so you can tell the MUIS-certified spots from the self-declared ones before you make the trip.",
    mrts: ["Hougang", "Kovan", "Buangkok"],
    landmarks: [
      { name: "Hougang Mall", type: "mall" },
      { name: "Hougang 1", type: "mall" },
      { name: "Kovan Market & Food Centre", type: "hawker" },
      { name: "Masjid En-Naeem", type: "mosque" },
    ],
    faqs: [
      { q: "Where do locals eat halal in Hougang?", a: "Beyond Hougang Mall's certified chains, much of the area's best Malay and Muslim-owned food is in neighbourhood coffeeshops along Hougang Avenue 8 and the Kovan stretch — our listings flag which are certified versus self-declared." },
      { q: "Is there a mosque in Hougang?", a: "Masjid En-Naeem on Tampines Road serves the Hougang area, with Masjid Haji Yusoff near the Serangoon boundary as an alternative." },
    ],
  },

  serangoon: {
    id: "serangoon",
    name: "Serangoon",
    coords: { lat: 1.3554, lng: 103.8679 },
    intro:
      "Serangoon splits its halal life between two worlds. At the MRT interchange, NEX — the North-East's biggest mall — packs halal-certified restaurants, food-court stalls and dessert chains across six floors, making it the reliable default for families. A bus ride away, Serangoon Gardens moves at an older pace: myVillage mall, landed-estate cafés and the famous Chomp Chomp Food Centre (where halal options are thinner — check badges before queueing). In between, Muslim-owned bakeries and nasi padang counters serve the HDB corridors toward Kovan and Hougang. With both the North East and Circle lines meeting at Serangoon, this is one of the easiest halal dining bases in the North-East to reach from anywhere on the island. This guide keeps the verified list — certified, Muslim-owned and halal-friendly — so you know exactly what you're getting at each stop.",
    mrts: ["Serangoon", "Lorong Chuan", "Kovan"],
    landmarks: [
      { name: "NEX", type: "mall", venueId: "nex" },
      { name: "myVillage at Serangoon Garden", type: "mall" },
      { name: "Chomp Chomp Food Centre", type: "hawker" },
    ],
    faqs: [
      { q: "Does NEX have halal food?", a: "Yes — NEX carries halal-certified restaurants and food-court stalls across several floors. Verify specific outlets on the MUIS HalalSG register or via the badges on our listings." },
      { q: "Is Chomp Chomp halal?", a: "Chomp Chomp Food Centre is not a halal hawker centre — only a minority of stalls are Muslim-owned or halal-suitable. Check individual stall status before eating; our Serangoon listings flag the verified options nearby." },
    ],
  },

  sembawang: {
    id: "sembawang",
    name: "Sembawang",
    coords: { lat: 1.4491, lng: 103.8185 },
    intro:
      "Sembawang pairs seaside calm with one of the North's most striking mosques. Sun Plaza above the MRT covers the certified basics — halal food court stalls, bakeries and quick family meals — while Canberra Plaza one stop south serves the newer estates. The real landmark is Masjid Assyafaah on Admiralty Lane: its modern, minaret-free architecture has made it one of Singapore's most photographed mosques, and the eateries around it lean naturally halal. Down at Sembawang Park, the old shipyard coastline turns into weekend picnic ground — pack from the Muslim-owned stalls near the MRT before heading down. The area rewards unhurried eating: kampong-era history, beach breezes and a compact spread of verified halal spots. This guide tracks them all with halal-confidence scores, from Sun Plaza's food court to the neighbourhood corners of Canberra and Admiralty.",
    mrts: ["Sembawang", "Canberra", "Admiralty"],
    landmarks: [
      { name: "Sun Plaza", type: "mall" },
      { name: "Canberra Plaza", type: "mall" },
      { name: "Sembawang Park", type: "park" },
      { name: "Masjid Assyafaah", type: "mosque" },
    ],
    faqs: [
      { q: "What is special about Masjid Assyafaah?", a: "Masjid Assyafaah on Admiralty Lane is known for its striking modern architecture — no traditional dome or minaret — and serves the Sembawang community. It's a short ride from Sembawang MRT." },
      { q: "Where can I eat halal near Sembawang Park?", a: "Stock up at the halal and Muslim-owned options around Sun Plaza and Sembawang MRT before heading to the park — the beachfront itself has limited food options." },
    ],
  },

  clementi: {
    id: "clementi",
    name: "Clementi",
    coords: { lat: 1.3151, lng: 103.7652 },
    intro:
      "Clementi feeds a lot of people on a budget — students from NUS and the polytechnics, west-side families, and anyone passing through its heaving bus interchange. That shapes a halal scene built on value: the 448 Market & Food Centre and neighbouring coffeeshops serve Malay breakfast and nasi padang at student prices, while Clementi Mall above the MRT and 321 Clementi across the road carry the certified chains and bubble-tea-adjacent dessert stops. Masjid Darussalam on Clementi Road anchors Friday prayers for the area, with the post-Jumu'ah lunch rush spilling into nearby stalls. West Coast Park is ten minutes away when you want to take it outdoors. This guide maps the verified halal and Muslim-owned spots across Clementi's markets, malls and corridors — with halal-confidence scores so the certified and the self-declared are never confused.",
    mrts: ["Clementi", "Dover"],
    landmarks: [
      { name: "The Clementi Mall", type: "mall" },
      { name: "321 Clementi", type: "mall" },
      { name: "Clementi 448 Market & Food Centre", type: "hawker" },
      { name: "West Coast Park", type: "park" },
      { name: "Masjid Darussalam", type: "mosque" },
    ],
    faqs: [
      { q: "Where is the cheapest halal food in Clementi?", a: "The 448 Market & Food Centre and the coffeeshops along Clementi Avenue 3 offer the best value — Malay stalls with hawker pricing. Our listings flag which are Muslim-owned versus certified." },
      { q: "Is there a mosque in Clementi?", a: "Masjid Darussalam on Clementi Road serves the area and is walkable from Clementi MRT. Expect nearby eateries to be at their busiest after Friday prayers." },
    ],
  },

  "jurong-east": {
    id: "jurong-east",
    name: "Jurong East",
    coords: { lat: 1.3329, lng: 103.7436 },
    intro:
      "Jurong East is the West's dining capital, and its halal spread matches the scale. Three malls surround the MRT interchange: Jem and Westgate stack halal-certified restaurants and food halls across multiple floors, while IMM — Singapore's biggest outlet mall — adds another cluster beside the bargain racks. It's the kind of place you can bring a mixed group and everyone finds something. Beyond the malls, Jurong Lake Gardens and the Science Centre make it a full family day out, with Masjid Al-Mukminin on Jurong East Street 21 covering prayers. The North-South and East-West lines cross here, so the whole island funnels through — which is exactly why the halal options keep multiplying. This guide keeps track of them, from certified chains in Jem's basement to the Muslim-owned independents in the surrounding blocks, each labelled with its halal-confidence score.",
    mrts: ["Jurong East", "Chinese Garden"],
    landmarks: [
      { name: "Jem", type: "mall", venueId: "jem" },
      { name: "Westgate", type: "mall", venueId: "westgate" },
      { name: "IMM", type: "mall", venueId: "imm" },
      { name: "Jurong Lake Gardens", type: "park" },
      { name: "Science Centre Singapore", type: "attraction" },
      { name: "Masjid Al-Mukminin", type: "mosque" },
    ],
    faqs: [
      { q: "Which Jurong East mall has the most halal food?", a: "Jem and Westgate both carry deep halal-certified line-ups across their food halls and restaurant floors, with IMM adding more beside the outlet stores. Verify individual outlets on the MUIS register." },
      { q: "Is there halal food near Jurong Lake Gardens?", a: "The mall cluster at Jurong East MRT — ten minutes' walk from the Gardens — is your best bet; pack a picnic from the certified outlets there." },
    ],
  },

  novena: {
    id: "novena",
    name: "Novena",
    coords: { lat: 1.3204, lng: 103.8438 },
    intro:
      "Novena is Singapore's quiet halal power cluster. Royal Square at Novena was planned around halal dining — a rare thing here — with certified restaurants filling its retail floors beneath one of the island's few halal-certified hotels, making it a magnet for Muslim travellers and wedding parties. Across the road, Velocity@Novena Square and United Square carry the mainstream certified chains, feeding the medical-hub crowd from the surrounding hospitals. The result is a compact stretch where you can do business lunch, family dinner and dessert without leaving a two-hundred-metre radius of Novena MRT. It's also a natural stop for visitors staying central without Orchard prices. This guide covers the certified, Muslim-owned and halal-friendly spots around the square — each with a halal-confidence score — plus what's within one stop on the North-South line in either direction.",
    mrts: ["Novena", "Toa Payoh"],
    landmarks: [
      { name: "Royal Square at Novena", type: "mall" },
      { name: "Velocity@Novena Square", type: "mall" },
      { name: "United Square", type: "mall" },
    ],
    faqs: [
      { q: "Why is Royal Square at Novena known for halal food?", a: "Royal Square was developed with a halal-dining focus — multiple certified restaurants share the building with a halal-certified hotel, so the cluster is unusually dense. Individual certificates are still worth confirming on the MUIS register." },
      { q: "Is Novena good for halal business lunches?", a: "Yes — the mix of certified restaurants at Royal Square and the malls above Novena MRT makes it one of the easiest central districts for a halal working lunch." },
    ],
  },

  "marine-parade": {
    id: "marine-parade",
    name: "Marine Parade",
    coords: { lat: 1.3028, lng: 103.9074 },
    intro:
      "Marine Parade finally has its own MRT station — the Thomson-East Coast Line put this classic seaside estate one ride from town, and its halal food deserves the visit. Parkway Parade remains the anchor mall, its food court and restaurant floors carrying the certified staples, while the Marine Parade Central Market & Food Centre next door keeps old-school Malay breakfast and nasi padang traditions alive. Walk ten minutes and you're at East Coast Park, Singapore's favourite picnic coastline — assemble your spread from the certified bakeries and Muslim-owned stalls first. The Katong-Joo Chiat heritage belt borders the estate to the north, adding Peranakan-era shophouse cafés (check badges — not all are halal). This guide sorts the verified options across the estate: MUIS-certified, Muslim-owned and halal-friendly, each scored so you can judge at a glance before you commit to the queue.",
    mrts: ["Marine Parade", "Marine Terrace"],
    landmarks: [
      { name: "Parkway Parade", type: "mall" },
      { name: "Marine Parade Central Market & Food Centre", type: "hawker" },
      { name: "East Coast Park", type: "park" },
      { name: "i12 Katong", type: "mall" },
    ],
    faqs: [
      { q: "Is there halal food at Parkway Parade?", a: "Yes — Parkway Parade's food court and restaurant floors include halal-certified outlets. Check each outlet's certificate on the MUIS register or the badge on its listing here." },
      { q: "Where can I get halal food for an East Coast Park picnic?", a: "Stock up around Marine Parade Central — the market's Malay stalls and the certified bakeries at Parkway Parade — before walking down to the park." },
      { q: "Are Katong laksa places halal?", a: "Most famous Katong laksa stalls are not halal-certified. Some halal versions exist nearby — check the badge on each listing rather than assuming." },
    ],
  },

  "kampong-glam": {
    id: "kampong-glam",
    name: "Kampong Glam",
    coords: { lat: 1.3025, lng: 103.8591 },
    intro:
      "Kampong Glam is the spiritual home of halal dining in Singapore. The golden dome of Sultan Mosque rises over Bussorah Street's restored shophouses, and the streets radiating from it — Arab Street, Haji Lane, Baghdad Street — hold the island's densest concentration of halal restaurants, from generations-old nasi padang institutions to third-wave Muslim-owned cafés and Middle Eastern grills. This was the seat of the Malay sultanate and the historic gathering point for pilgrims bound for Mecca; the Malay Heritage Centre on the mosque's doorstep tells that story. Today the district runs from breakfast teh tarik to well-past-midnight supper, with Bugis Junction and Bugis+ adding mall-certified options two minutes away. It is, simply, where you bring anyone who doubts halal food can headline a food district. This guide scores every verified spot — certified, Muslim-owned, halal-friendly — across the quarter.",
    mrts: ["Bugis", "Nicoll Highway", "Lavender"],
    landmarks: [
      { name: "Sultan Mosque (Masjid Sultan)", type: "mosque" },
      { name: "Haji Lane", type: "heritage" },
      { name: "Bussorah Street", type: "heritage" },
      { name: "Malay Heritage Centre", type: "heritage" },
      { name: "Bugis Junction", type: "mall", venueId: "bugis-junction" },
    ],
    faqs: [
      { q: "Is all food in Kampong Glam halal?", a: "Most eateries in the historic quarter are halal or Muslim-owned, but not all — a few bars and cafés on Haji Lane are exceptions. Check the badge on each listing; certified outlets link to their MUIS record." },
      { q: "What time does Kampong Glam get busy?", a: "Lunch and dinner peaks are intense on weekends, and Ramadan evenings are the busiest of the year. Weekday mid-afternoons are the calmest window for the famous spots." },
      { q: "Can visitors enter Sultan Mosque?", a: "Yes — Sultan Mosque welcomes respectful visitors outside prayer times, with robes provided at the entrance. Friday midday is reserved for congregational prayers." },
    ],
  },

  bedok: {
    id: "bedok",
    name: "Bedok",
    coords: { lat: 1.324, lng: 103.9302 },
    intro:
      "Bedok is East-side halal eating without the tourist markup. The interchange cluster does the heavy lifting: Bedok Mall carries the certified chains, while the Bedok Interchange Hawker Centre next door is one of the East's most dependable spots for Malay hawker classics — expect queues at the famous stalls by noon. A short ride away, Bedok Corner Food Centre has been a supper institution for decades, its Malay and Indian-Muslim stalls running late into the night. Masjid Al-Ansar on Bedok North Avenue, rebuilt and expanded, anchors one of Singapore's largest Muslim communities, which is exactly why the area's halal depth runs so deep — this is food cooked for the neighbourhood, not for visitors. This guide maps the verified spread, from mall food courts to midnight mee goreng, each listing scored so certified and self-declared are never confused.",
    mrts: ["Bedok", "Bedok North", "Bedok Reservoir"],
    landmarks: [
      { name: "Bedok Mall", type: "mall", venueId: "bedok-mall" },
      { name: "Bedok Interchange Hawker Centre", type: "hawker" },
      { name: "Bedok Corner Food Centre", type: "hawker" },
      { name: "Masjid Al-Ansar", type: "mosque" },
    ],
    faqs: [
      { q: "Where is the best halal hawker food in Bedok?", a: "The Bedok Interchange Hawker Centre has the biggest concentration of Malay stalls, while Bedok Corner Food Centre is the late-night classic. Individual stalls vary — our listings flag Muslim-owned versus certified." },
      { q: "Is there a mosque in Bedok?", a: "Masjid Al-Ansar on Bedok North Avenue 1 serves the area — it's one of the East's key mosques, a short walk from Bedok North MRT." },
    ],
  },

  woodlands: {
    id: "woodlands",
    name: "Woodlands",
    coords: { lat: 1.4382, lng: 103.789 },
    intro:
      "Woodlands is the northern gateway, and its halal food scene feeds everyone from Causeway commuters to TEL-line day-trippers. Causeway Point above the interchange is the workhorse — floors of halal-certified restaurants, food-court stalls and bakeries that stay busy from breakfast to closing. Woods Square across the plaza adds newer café-style options for the office crowd. Head toward Marsiling and the hawker tradition takes over, with Malay stalls at the Marsiling Mall Hawker Centre serving some of the North's best-value plates. Masjid An-Nur's landmark blue-tinged minaret near Admiralty has watched over the community for decades. And when the eating is done, Woodlands Waterfront Park offers a sea breeze and a straight view across the Strait to Johor Bahru. This guide tracks the verified halal and Muslim-owned spots across the town centre, Marsiling and Admiralty — scores, badges and directions included.",
    mrts: ["Woodlands", "Woodlands South", "Marsiling", "Admiralty"],
    landmarks: [
      { name: "Causeway Point", type: "mall", venueId: "causeway-point" },
      { name: "Woods Square", type: "mall" },
      { name: "Marsiling Mall Hawker Centre", type: "hawker" },
      { name: "Woodlands Waterfront Park", type: "park" },
      { name: "Masjid An-Nur", type: "mosque" },
    ],
    faqs: [
      { q: "Does Causeway Point have halal food?", a: "Yes — Causeway Point has one of the North's largest spreads of halal-certified outlets across its food court and restaurant floors. Verify individual certificates on the MUIS register." },
      { q: "Where can I eat halal before crossing the Causeway?", a: "Causeway Point at Woodlands MRT is the most convenient full-service stop; the Marsiling Mall Hawker Centre offers a faster, cheaper hawker option nearby." },
    ],
  },

  sengkang: {
    id: "sengkang",
    name: "Sengkang",
    coords: { lat: 1.3868, lng: 103.8914 },
    intro:
      "Sengkang grew fast, and its halal food kept pace. Compass One above the MRT-LRT hub is the daily default — a compact mall where halal-certified chains, bakeries and dessert stops cover the family bases. Sengkang Grand Mall by Buangkok extends the same convenience south, while the Rivervale and Anchorvale neighbourhood centres hide Muslim-owned coffeeshop stalls that only locals seem to know. Masjid Al-Mawaddah on Compassvale Bow is one of Singapore's newer-generation mosques, purpose-built for this young town's large Muslim community. Between meals, the Sengkang Riverside Park and its floating wetland make an easy family stroll. Sengkang eating is unfussy, affordable and genuinely local — this guide keeps the verified list current across the LRT loops, with halal-confidence scores separating the MUIS-certified from the self-declared so young families can choose with certainty.",
    mrts: ["Sengkang", "Buangkok", "Ranggung"],
    landmarks: [
      { name: "Compass One", type: "mall" },
      { name: "Sengkang Grand Mall", type: "mall" },
      { name: "Sengkang Riverside Park", type: "park" },
      { name: "Masjid Al-Mawaddah", type: "mosque" },
    ],
    faqs: [
      { q: "What halal food is at Compass One?", a: "Compass One carries halal-certified chains, bakeries and food-court stalls across its retail floors — check each outlet's badge on our listings or its certificate on the MUIS register." },
      { q: "Is there a mosque in Sengkang?", a: "Masjid Al-Mawaddah on Compassvale Bow serves Sengkang — it's a modern mosque a short LRT hop from the town centre." },
    ],
  },

  punggol: {
    id: "punggol",
    name: "Punggol",
    coords: { lat: 1.4052, lng: 103.9024 },
    intro:
      "Punggol is Singapore's youngest food town, built around water. Waterway Point at the MRT-LRT hub carries the halal-certified anchor restaurants and food-hall staples, while One Punggol's hawker centre and Oasis Terraces along the waterway bring hawker pricing to the newest estates. Up at the coast, Northshore Plaza serves the seafront blocks, and the old Punggol Settlement jetty area keeps a few waterfront dining options (check badges — not all are halal). What makes Punggol special is the setting: eat, then walk it off along the Punggol Waterway or cross the bridge to Coney Island. The town's young Muslim families keep demand high, so new halal and Muslim-owned openings are constant — this guide tracks them as they land, each scored for halal confidence so you know what's MUIS-certified, what's Muslim-owned and what's self-declared before you order.",
    mrts: ["Punggol", "Punggol Coast", "Sam Kee"],
    landmarks: [
      { name: "Waterway Point", type: "mall", venueId: "waterway-point" },
      { name: "One Punggol Hawker Centre", type: "hawker" },
      { name: "Oasis Terraces", type: "mall" },
      { name: "Northshore Plaza", type: "mall" },
      { name: "Punggol Waterway Park", type: "park" },
      { name: "Coney Island", type: "park" },
    ],
    faqs: [
      { q: "Is there halal food at Waterway Point?", a: "Yes — Waterway Point carries halal-certified restaurants and food-hall outlets. Confirm individual certificates on the MUIS HalalSG register or via the badges on our listings." },
      { q: "Where can I eat halal near Coney Island?", a: "Northshore Plaza and Punggol Settlement are the closest options, though halal choices at the Settlement are limited — packing from Waterway Point before the walk is the safer plan." },
    ],
  },

  "arab-street": {
    id: "arab-street",
    name: "Arab Street",
    coords: { lat: 1.3021, lng: 103.8595 },
    intro:
      "Arab Street and the surrounding Kampong Glam quarter are the historic heart of Muslim Singapore, and the food follows. This is the island's densest strip for Middle Eastern, Turkish, Arab and Malay cooking — mezze and shawarma along Bussorah Street, biryani and murtabak near the mosque, and shisha cafés spilling onto Haji Lane after dark. Masjid Sultan, the golden-domed national landmark, anchors the district, so prayer is never far and the whole quarter runs on Muslim-friendly rhythms. Much of the food here is Muslim-run and pork-free by default, but 'default' is not 'certified' — so this guide scores each spot for halal confidence, flagging what carries a MUIS certificate versus what is Muslim-owned or self-declared. A short walk from Bugis MRT, Arab Street is the easiest place in Singapore to eat halal across cuisines in one evening, from a quick kebab to a sit-down Turkish spread.",
    mrts: ["Bugis", "Nicoll Highway"],
    landmarks: [
      { name: "Masjid Sultan", type: "mosque" },
      { name: "Bussorah Street", type: "heritage" },
      { name: "Haji Lane", type: "heritage" },
      { name: "Kampong Glam", type: "heritage" },
      { name: "Malay Heritage Centre", type: "attraction" },
    ],
    faqs: [
      { q: "Is the food at Arab Street halal?", a: "Most eateries around Arab Street and Kampong Glam are Muslim-run and pork-free, and many are MUIS-certified. It is still worth confirming the specific outlet's certificate on the MUIS HalalSG register or via its Humble Halal badge, especially for newer cafés." },
      { q: "What food is Arab Street known for?", a: "Middle Eastern and Turkish (shawarma, kebab, mezze), Arab biryani and murtabak, and Malay dishes — the widest halal cuisine mix in one walkable district in Singapore." },
      { q: "Is there a mosque at Arab Street?", a: "Yes — Masjid Sultan, the golden-domed national monument on Muscat Street, sits at the centre of the quarter, so prayer facilities are steps from most eateries." },
    ],
  },

  "ang-mo-kio": {
    id: "ang-mo-kio",
    name: "Ang Mo Kio",
    coords: { lat: 1.3691, lng: 103.8454 },
    intro:
      "Ang Mo Kio is one of the North-East's most reliable heartland food towns, and its halal options are spread across malls and markets rather than one strip. AMK Hub, right on the MRT, is the natural anchor — its food court and restaurants carry halal-certified chains and family spots — while Jubilee Square and Djitsun Mall add more choice around the bus interchange. For traditional flavours, the AMK 628 Market & Food Centre and the Teck Ghee blocks keep Malay and Muslim-owned stalls that locals have eaten at for decades. Masjid Al-Muttaqin serves the estate, anchoring the Friday crowd. With the North-South line and the Cross Island line arriving, Ang Mo Kio is only getting more connected. This guide tracks the certified and Muslim-owned options across the town centre and the quieter blocks, each with a halal-confidence score so you can tell MUIS-certified from self-declared before you go.",
    mrts: ["Ang Mo Kio", "Mayflower"],
    landmarks: [
      { name: "AMK Hub", type: "mall", venueId: "amk-hub" },
      { name: "Jubilee Square", type: "mall" },
      { name: "Djitsun Mall", type: "mall" },
      { name: "AMK 628 Market & Food Centre", type: "hawker" },
      { name: "Masjid Al-Muttaqin", type: "mosque" },
    ],
    faqs: [
      { q: "Is there halal food at AMK Hub?", a: "Yes — AMK Hub has halal-certified outlets across its food court and restaurants. Check each one's certificate on the MUIS HalalSG register, or look for the badge on its Humble Halal listing." },
      { q: "Where can I find traditional halal food in Ang Mo Kio?", a: "The AMK 628 Market & Food Centre and the older Teck Ghee blocks have long-running Malay and Muslim-owned stalls, best visited for breakfast and lunch." },
      { q: "Is there a mosque in Ang Mo Kio?", a: "Yes — Masjid Al-Muttaqin serves the Ang Mo Kio area, so many nearby eateries are used to the Friday-prayer lunch crowd." },
    ],
  },

  "changi-airport": {
    id: "changi-airport",
    name: "Changi Airport",
    coords: { lat: 1.3644, lng: 103.9915 },
    intro:
      "Changi Airport is one of the easiest places in Singapore to eat halal, whether you're flying or just visiting for the day. Jewel Changi Airport, connected to Terminal 1, holds the biggest concentration — its food halls and restaurants carry a strong line-up of halal-certified outlets — while all four terminals have halal options in their public and transit areas. Prayer rooms are available across the terminals, making Changi genuinely convenient for Muslim travellers. Because menus and operators change often at the airport, and transit-area access depends on your boarding pass, it pays to check before you commit: this guide scores each outlet for halal confidence and points to the MUIS HalalSG register for the current certificate. Whether you need a full meal before a long-haul flight, a quick bite at Jewel under the Rain Vortex, or suhoor timing around an early departure, the verified options are tracked here.",
    mrts: ["Changi Airport", "Expo"],
    landmarks: [
      { name: "Jewel Changi Airport", type: "mall", venueId: "jewel-changi-airport" },
      { name: "Terminal 1–4 food halls", type: "attraction" },
      { name: "Changi Airport prayer rooms", type: "mosque" },
    ],
    faqs: [
      { q: "Is there halal food at Changi Airport?", a: "Yes — Jewel and all four terminals have halal-certified outlets in their public and (some) transit areas. Menus and operators change often, so confirm the specific outlet on the MUIS HalalSG register before you rely on it." },
      { q: "Are there prayer rooms at Changi Airport?", a: "Yes — prayer rooms are available across the terminals (public and transit sides). Locations are signposted and listed on the airport's own facilities guide." },
      { q: "Where is the most halal food at Changi?", a: "Jewel Changi Airport (linked to Terminal 1) has the widest choice of halal-certified restaurants and food-hall stalls in one place." },
    ],
  },

  "holland-village": {
    id: "holland-village",
    name: "Holland Village",
    coords: { lat: 1.3116, lng: 103.7965 },
    intro:
      "Holland Village is a compact, café-heavy enclave in the west-central belt, popular for brunch, coffee and relaxed dining. It skews international and expat, so halal-certified spots are fewer here than in the heartlands — but they do exist, and the newer One Holland Village development plus Raffles Holland V and Holland Road Shopping Centre have broadened the choice. With its own Circle Line station and Buona Vista a stop away, 'Holland V' is an easy meet-up point; the trick is knowing which cafés and restaurants are Muslim-friendly before you sit down. This guide scores the verified halal and Muslim-owned options in and around the village, flags what's MUIS-certified versus self-declared, and — where on-site choices are thin — points you to the nearby Buona Vista and one-north clusters. Treat unmarked cafés with the usual caution: many serve alcohol and some use non-halal ingredients, so check the badge first.",
    mrts: ["Holland Village", "Buona Vista"],
    landmarks: [
      { name: "One Holland Village", type: "mall" },
      { name: "Raffles Holland V", type: "mall" },
      { name: "Holland Road Shopping Centre", type: "mall" },
      { name: "Holland Village Market & Food Centre", type: "hawker" },
    ],
    faqs: [
      { q: "Is there halal food in Holland Village?", a: "Yes, but fewer than in the heartlands — Holland Village is café- and expat-oriented, and many outlets serve alcohol or aren't certified. Use this page to find the verified halal and Muslim-owned options, and confirm certificates on the MUIS HalalSG register." },
      { q: "Which Holland Village mall has halal options?", a: "One Holland Village and Raffles Holland V are the newest and carry more halal-certified outlets; Holland Road Shopping Centre adds a few more. Check individual badges before you go." },
      { q: "Where else can I eat halal near Holland Village?", a: "Buona Vista and the one-north area, one MRT stop away, have additional halal-certified options if the village is quiet." },
    ],
  },

  "pasir-ris": {
    id: "pasir-ris",
    name: "Pasir Ris",
    coords: { lat: 1.3721, lng: 103.9493 },
    intro:
      "Pasir Ris pairs seaside leisure with solid heartland halal food. White Sands mall, directly at the MRT, is the everyday anchor, with halal-certified chains and a food court, while the newer Pasir Ris Mall adds more choice at the interchange. The real draw for families is the coast: Pasir Ris Park and the Downtown East resort strip (with E!Hub and Wild Wild Wet nearby) make this a weekend destination, and the Pasir Ris Central Hawker Centre brings modern hawker dining to the town centre. Malay and Muslim-owned stalls are woven through the estate, and Masjid Al-Istighfar serves the community off Pasir Ris Street 51. Whether you want a quick meal before the beach, a barbecue-supply run for the chalets, or dinner after a day at Downtown East, this guide tracks the verified halal and Muslim-owned options, each scored so you know what's MUIS-certified before you order.",
    mrts: ["Pasir Ris", "Pasir Ris East"],
    landmarks: [
      { name: "White Sands", type: "mall" },
      { name: "Pasir Ris Mall", type: "mall" },
      { name: "Pasir Ris Central Hawker Centre", type: "hawker" },
      { name: "Downtown East", type: "attraction" },
      { name: "Pasir Ris Park", type: "park" },
      { name: "Masjid Al-Istighfar", type: "mosque" },
    ],
    faqs: [
      { q: "Is there halal food at Pasir Ris / White Sands?", a: "Yes — White Sands and Pasir Ris Mall carry halal-certified outlets across their food courts and restaurants. Confirm each certificate on the MUIS HalalSG register or via the Humble Halal badge." },
      { q: "Where can I eat halal near Downtown East?", a: "The Pasir Ris town centre (White Sands, Pasir Ris Mall and the Central Hawker Centre) is the closest cluster; some outlets within Downtown East are halal-certified too — check the badges." },
      { q: "Is there a mosque in Pasir Ris?", a: "Yes — Masjid Al-Istighfar serves the Pasir Ris area, off Pasir Ris Street 51." },
    ],
  },

  sentosa: {
    id: "sentosa",
    name: "Sentosa",
    coords: { lat: 1.2494, lng: 103.8303 },
    intro:
      "Sentosa is a resort island, so eating halal here is about knowing where to look rather than assuming. Resorts World Sentosa carries the biggest concentration of halal-certified restaurants and food-hall outlets, and pockets of the beach and attraction zones have Muslim-friendly options — but many standalone bars and beach clubs are not suitable, so it pays to plan. The gateway is VivoCity at HarbourFront, which has a deep line-up of halal-certified eateries; many visitors eat there before crossing via the Sentosa Express or boardwalk. This guide scores the verified halal and Muslim-owned options on the island and at the VivoCity gateway, flagging MUIS-certified versus self-declared, so a day of beaches, Universal Studios or the cable car doesn't mean going hungry. When on-island choices near your spot are thin, the simplest move is to eat at VivoCity on the way in or out.",
    mrts: ["HarbourFront", "Sentosa Express"],
    landmarks: [
      { name: "Resorts World Sentosa", type: "attraction" },
      { name: "VivoCity (gateway)", type: "mall", venueId: "vivocity" },
      { name: "Sentosa beaches", type: "attraction" },
      { name: "Universal Studios Singapore", type: "attraction" },
    ],
    faqs: [
      { q: "Is there halal food on Sentosa?", a: "Yes, but it's concentrated — Resorts World Sentosa has the most halal-certified outlets, with some Muslim-friendly options in the attraction and beach zones. Many standalone bars and beach clubs are not suitable, so check badges and the MUIS register." },
      { q: "Where should I eat halal before going to Sentosa?", a: "VivoCity at HarbourFront, the island's gateway, has a wide range of halal-certified restaurants and food-hall stalls — many visitors eat there before crossing over." },
      { q: "Are there prayer facilities near Sentosa?", a: "The most convenient options are around HarbourFront/VivoCity on the mainland side; check the resort's guest services for prayer-space provisions on the island." },
    ],
  },

  "botanic-gardens": {
    id: "botanic-gardens",
    name: "Botanic Gardens",
    coords: { lat: 1.3138, lng: 103.8159 },
    intro:
      "The Singapore Botanic Gardens — a UNESCO World Heritage Site — is a place to walk first and eat second, and halal options right at the gates are limited. The dining inside and immediately around the Gardens skews café and fine-dining, and much of it is neither certified nor alcohol-free, so Muslim visitors are better off planning around the edges. Cluny Court by the Bukit Timah gate has a few options, and the Botanic Gardens and Napier MRT stations put you one or two stops from far richer halal clusters at Orchard and along the Downtown Line. This guide is honest about the on-site gap: it scores the verified halal and Muslim-owned options nearby, and points to the closest reliable clusters so you can pair a morning at the Gardens with a proper halal meal without a long detour. As always, check the badge before you sit down — 'garden café' rarely means certified.",
    mrts: ["Botanic Gardens", "Napier", "Stevens"],
    landmarks: [
      { name: "Singapore Botanic Gardens", type: "park" },
      { name: "National Orchid Garden", type: "attraction" },
      { name: "Cluny Court", type: "mall" },
    ],
    faqs: [
      { q: "Is there halal food at the Botanic Gardens?", a: "On-site halal options are limited — the Gardens' cafés and restaurants are mostly uncertified and some serve alcohol. Check any outlet's certificate on the MUIS HalalSG register, and consider eating at a nearby cluster instead." },
      { q: "Where can I eat halal near the Botanic Gardens?", a: "Orchard (a couple of MRT stops away) and the Downtown Line stations have far more halal-certified choices. Packing a picnic from a halal outlet before your visit is also a popular option." },
      { q: "Can I bring my own food to the Botanic Gardens?", a: "Yes — the Gardens are picnic-friendly, which makes bringing halal food from elsewhere an easy workaround for the limited on-site options." },
    ],
  },

  "clarke-quay": {
    id: "clarke-quay",
    name: "Clarke Quay",
    coords: { lat: 1.2906, lng: 103.8465 },
    intro:
      "Clarke Quay is best known for riverside nightlife, so halal-conscious diners need to choose carefully — a large share of the quay's venues are bars and clubs, and many restaurants serve alcohol. That said, the wider Singapore River area is more halal-friendly than its reputation suggests: Central Mall and the nearby Riverside and Hong Lim precincts carry halal-certified outlets, and Chinatown's deep halal clusters are a short walk or one MRT stop away. With Clarke Quay and Fort Canning stations on the North-East and Downtown lines, it's an easy pivot from the river to better options. This guide scores the verified halal and Muslim-owned spots in and around Clarke Quay, is upfront about where the gaps are, and points you to the closest reliable clusters — so an evening by the river can still end with a halal meal you can trust. Check the badge first; riverside 'restaurant' usually means a full bar too.",
    mrts: ["Clarke Quay", "Fort Canning", "Chinatown"],
    landmarks: [
      { name: "Clarke Quay", type: "attraction" },
      { name: "Central Mall", type: "mall" },
      { name: "Singapore River", type: "attraction" },
      { name: "Hong Lim Market & Food Centre", type: "hawker" },
    ],
    faqs: [
      { q: "Is there halal food at Clarke Quay?", a: "Some — but be selective. Much of Clarke Quay is bars and alcohol-serving restaurants. Central Mall and the nearby precincts have halal-certified outlets; confirm each on the MUIS HalalSG register or via its Humble Halal badge." },
      { q: "Where can I eat halal near Clarke Quay?", a: "Chinatown, one MRT stop or a short walk away, has far deeper halal clusters, and Hong Lim Market & Food Centre has Muslim-owned stalls. These are the safer bets for a reliable halal meal." },
      { q: "Is Clarke Quay suitable for Muslim visitors?", a: "It's primarily a nightlife district, so plan around it — enjoy the riverside walk, but choose your dining from the verified halal options here or in adjacent Chinatown." },
    ],
  },

  "city-hall": {
    id: "city-hall",
    name: "City Hall",
    coords: { lat: 1.2931, lng: 103.8520 },
    intro:
      "City Hall sits at the civic heart of Singapore, and its halal food lives mostly inside the malls that ring the interchange. Raffles City, directly above the station, and Funan a short walk away both carry halal-certified outlets across their food halls, while the CHIJMES and Bras Basah side adds cafés and restaurants — though not all are certified, so check before you sit. This is a lunchtime district for the offices around Beach Road and the Padang, and a natural staging point for the Marina Bay and Esplanade attractions nearby. With City Hall being a major North-South/East-West interchange, it connects fast to the deeper halal clusters at Bugis and Arab Street one or two stops away. This guide tracks the verified halal and Muslim-owned options across the City Hall malls and the surrounding civic district, each scored so you can tell MUIS-certified from self-declared.",
    mrts: ["City Hall", "Bras Basah", "Esplanade"],
    landmarks: [
      { name: "Raffles City", type: "mall", venueId: "raffles-city" },
      { name: "Funan", type: "mall", venueId: "funan" },
      { name: "CHIJMES", type: "heritage" },
      { name: "Padang & Civic District", type: "attraction" },
    ],
    faqs: [
      { q: "Is there halal food at Raffles City?", a: "Yes — Raffles City carries halal-certified outlets in its food hall and among its restaurants. Confirm each certificate on the MUIS HalalSG register or via the badge on its Humble Halal listing." },
      { q: "Where can I eat halal near City Hall?", a: "Raffles City and Funan are the closest malls with halal-certified options; for a wider choice, Bugis and Arab Street are one to two MRT stops away." },
      { q: "Is City Hall good for a halal work lunch?", a: "Yes — the malls around the interchange have halal-certified food-hall and fast-casual options that suit the Beach Road and civic-district office crowd." },
    ],
  },

  chinatown: {
    id: "chinatown",
    name: "Chinatown",
    coords: { lat: 1.2820, lng: 103.8443 },
    intro:
      "Chinatown surprises people: beneath the obvious Chinese-food reputation sits a genuinely deep halal layer. Chinatown Complex — Singapore's largest hawker centre — and the nearby Maxwell Food Centre both hold Muslim-owned and halal stalls among their hundreds, while the historic South Bridge Road stretch is home to two of the country's oldest mosques, Masjid Jamae and Masjid Al-Abrar, plus the Indian-Muslim heritage that spills over from adjacent Telok Ayer. People's Park Complex and Centre add food-court options. The trick here is precision — most stalls are not halal, so you eat by the badge, not the block. This guide scores the verified halal and Muslim-owned options across Chinatown's hawker centres and shophouses, flagging MUIS-certified versus self-declared, so a wander through the lanes can still end at a halal plate you can trust.",
    mrts: ["Chinatown", "Maxwell", "Telok Ayer"],
    landmarks: [
      { name: "Chinatown Complex Food Centre", type: "hawker" },
      { name: "Maxwell Food Centre", type: "hawker" },
      { name: "Masjid Jamae (Chulia)", type: "mosque" },
      { name: "Masjid Al-Abrar", type: "mosque" },
      { name: "People's Park Complex", type: "mall" },
    ],
    faqs: [
      { q: "Is there halal food in Chinatown?", a: "Yes, but you have to look — most stalls aren't halal. Chinatown Complex and Maxwell Food Centre have Muslim-owned and halal stalls, and the Telok Ayer side has Indian-Muslim food. Check each stall's badge or the MUIS HalalSG register." },
      { q: "Are there mosques in Chinatown?", a: "Yes — Masjid Jamae and Masjid Al-Abrar, two of Singapore's oldest mosques, sit on South Bridge Road, so prayer is convenient in the area." },
      { q: "Is there halal food at Maxwell Food Centre?", a: "There are Muslim-owned and halal stalls at Maxwell, though many stalls are not halal. Look for the stall's own halal marking and verify on the MUIS register." },
    ],
  },

  "tanjong-pagar": {
    id: "tanjong-pagar",
    name: "Tanjong Pagar",
    coords: { lat: 1.2765, lng: 103.8455 },
    intro:
      "Tanjong Pagar is a CBD district that eats well at lunch and into the evening. The office towers around the MRT drive demand, and the halal options cluster in the food centres and malls — Amoy Street Food Centre and Maxwell Food Centre (on the Chinatown edge) carry Muslim-owned and halal stalls, while Tanjong Pagar Plaza and 100AM add food-court and restaurant choices. The district is also known for its Korean strip, though most of those are not halal — so it pays to eat by the badge. Historic mosques on the Telok Ayer side are within walking distance. With the East-West line here and the Thomson-East Coast line at Maxwell, it's well connected to the wider halal clusters. This guide tracks the verified halal and Muslim-owned options across Tanjong Pagar's food centres, malls and shophouses, each scored for halal confidence before you go.",
    mrts: ["Tanjong Pagar", "Maxwell"],
    landmarks: [
      { name: "Amoy Street Food Centre", type: "hawker" },
      { name: "Maxwell Food Centre", type: "hawker" },
      { name: "Tanjong Pagar Plaza", type: "mall" },
      { name: "100 AM", type: "mall" },
    ],
    faqs: [
      { q: "Is there halal food in Tanjong Pagar?", a: "Yes — the food centres (Amoy Street, Maxwell) have Muslim-owned and halal stalls, and the malls carry halal-certified outlets, though many CBD restaurants are not halal. Check each one's badge or the MUIS HalalSG register." },
      { q: "Is the Korean food in Tanjong Pagar halal?", a: "Mostly not — Tanjong Pagar's Korean strip largely serves pork and alcohol. For halal Korean, choose a MUIS-certified Korean restaurant and verify it on the register." },
      { q: "Where's the best halal lunch in Tanjong Pagar?", a: "The hawker centres for quick, affordable stalls, or the mall food halls for halal-certified fast-casual — both suit the CBD lunch crowd." },
    ],
  },

  somerset: {
    id: "somerset",
    name: "Somerset",
    coords: { lat: 1.3006, lng: 103.8388 },
    intro:
      "Somerset is the youth-and-lifestyle end of the Orchard belt, and its halal food sits inside the cluster of malls around the station. 313@Somerset, Orchard Central and Orchard Gateway all carry halal-certified outlets across their food halls and restaurants, making this one of the easier stretches of Orchard to eat halal without hunting. The Cathay and the tail of Somerset Road add a few more options. Because it flows straight into the main Orchard shopping strip, Somerset works as a halal dining base for a day of retail, with Masjid Al-Falah a short walk away near Cairnhill for prayer. This guide keeps score of the verified halal and Muslim-owned options across the Somerset malls, from quick food-court meals between shops to sit-down dinners, flagging what's MUIS-certified versus self-declared before you order.",
    mrts: ["Somerset", "Orchard", "Dhoby Ghaut"],
    landmarks: [
      { name: "313@Somerset", type: "mall" },
      { name: "Orchard Central", type: "mall" },
      { name: "Orchard Gateway", type: "mall" },
      { name: "The Cathay", type: "mall" },
      { name: "Masjid Al-Falah", type: "mosque" },
    ],
    faqs: [
      { q: "Is there halal food at 313@Somerset?", a: "Yes — 313@Somerset carries halal-certified outlets in its food hall and among its restaurants. Confirm each certificate on the MUIS HalalSG register or via its Humble Halal badge." },
      { q: "Is there a mosque near Somerset?", a: "Yes — Masjid Al-Falah near Cairnhill is a short walk from Somerset MRT, making the area easy to combine with prayers." },
      { q: "Where can I eat halal around Somerset?", a: "313@Somerset, Orchard Central and Orchard Gateway all have halal-certified options; the main Orchard strip adds more a short walk away." },
    ],
  },

  harbourfront: {
    id: "harbourfront",
    name: "HarbourFront",
    coords: { lat: 1.2653, lng: 103.8220 },
    intro:
      "HarbourFront is the gateway to Sentosa and cruise terminals, and its halal food is anchored by one of Singapore's strongest mall line-ups: VivoCity. The island's largest mall carries a deep set of halal-certified restaurants and food-hall stalls, so most visitors — whether heading to Sentosa, boarding a cruise, or walking Mount Faber — eat here. HarbourFront Centre next door adds a few more options. Because Sentosa's own halal choices are concentrated and pricier, VivoCity at HarbourFront is the smart place to eat before or after crossing over. With the North-East and Circle lines meeting here, it's easy to reach from across the island. This guide tracks the verified halal and Muslim-owned options across the HarbourFront malls, each scored so you know what's MUIS-certified before a day at the waterfront.",
    mrts: ["HarbourFront"],
    landmarks: [
      { name: "VivoCity", type: "mall", venueId: "vivocity" },
      { name: "HarbourFront Centre", type: "mall" },
      { name: "Mount Faber", type: "park" },
      { name: "Sentosa gateway", type: "attraction" },
    ],
    faqs: [
      { q: "Is there halal food at HarbourFront / VivoCity?", a: "Yes — VivoCity has one of the deepest halal-certified line-ups of any Singapore mall, spanning restaurants and food-hall stalls. Confirm each on the MUIS HalalSG register or via its Humble Halal badge." },
      { q: "Where should I eat halal before Sentosa?", a: "VivoCity at HarbourFront is the gateway and the best bet — Sentosa's own halal options are more limited and pricier, so many visitors eat here first." },
      { q: "Is HarbourFront convenient for Muslim families?", a: "Yes — VivoCity's wide halal choice, the waterfront promenade and the Sentosa link make HarbourFront an easy family base." },
    ],
  },

  "toa-payoh": {
    id: "toa-payoh",
    name: "Toa Payoh",
    coords: { lat: 1.3329, lng: 103.8497 },
    intro:
      "Toa Payoh is a mature central heartland with a solid, everyday halal food scene. The town centre around HDB Hub and Toa Payoh Central carries halal-certified chains and food-court stalls, while the Toa Payoh Lorong 8 and Lorong 1 markets and food centres keep long-running Malay and Muslim-owned stalls that regulars swear by. Masjid Muhajirin off Braddell anchors the community. Being one of Singapore's oldest towns, Toa Payoh has a settled, local rhythm — this is neighbourhood halal eating rather than destination dining, and it's all the more reliable for it. With the North-South line at Toa Payoh and the Circle/Thomson lines at Braddell and Caldecott nearby, it's easy to reach. This guide tracks the verified halal and Muslim-owned options across the town centre and the market food centres, each scored so you can tell MUIS-certified from self-declared.",
    mrts: ["Toa Payoh", "Braddell", "Caldecott"],
    landmarks: [
      { name: "HDB Hub", type: "mall" },
      { name: "Toa Payoh Central", type: "mall" },
      { name: "Toa Payoh Lorong 8 Market & Food Centre", type: "hawker" },
      { name: "Masjid Muhajirin", type: "mosque" },
    ],
    faqs: [
      { q: "Is there halal food in Toa Payoh?", a: "Yes — the town centre (HDB Hub, Toa Payoh Central) has halal-certified chains and food-court stalls, and the Lorong 8 and Lorong 1 food centres have Malay and Muslim-owned stalls. Check each one's badge or the MUIS HalalSG register." },
      { q: "Is there a mosque in Toa Payoh?", a: "Yes — Masjid Muhajirin, off Braddell Road, serves the Toa Payoh area." },
      { q: "Where's the best traditional halal food in Toa Payoh?", a: "The Lorong 8 and Lorong 1 market and food centres, best visited for breakfast and lunch when the Malay stalls are freshest." },
    ],
  },

  "raffles-place": {
    id: "raffles-place",
    name: "Raffles Place",
    coords: { lat: 1.2839, lng: 103.8515 },
    intro:
      "Raffles Place is the core of Singapore's CBD, and it eats hardest at weekday lunch. The standout for halal diners is Lau Pa Sat — the historic cast-iron market whose Satay Street fires up in the evening and whose interior holds Muslim-owned and halal stalls — while nearby Telok Ayer and Amoy Street food centres add more, and the office malls (One Raffles Place, Marina Bay Link Mall) carry halal-certified fast-casual outlets. Two of the country's oldest mosques sit a short walk away on the Telok Ayer/South Bridge stretch. Weekends are quiet here, so time your visit for lunch or the satay-street evenings. This guide tracks the verified halal and Muslim-owned options across Raffles Place's food centres and towers, each scored for halal confidence so the CBD lunch run lands somewhere you can trust.",
    mrts: ["Raffles Place", "Telok Ayer", "Downtown"],
    landmarks: [
      { name: "Lau Pa Sat", type: "hawker" },
      { name: "Telok Ayer Market", type: "hawker" },
      { name: "One Raffles Place", type: "mall" },
      { name: "Marina Bay Link Mall", type: "mall" },
      { name: "Masjid Al-Abrar", type: "mosque" },
    ],
    faqs: [
      { q: "Is there halal food at Raffles Place?", a: "Yes — Lau Pa Sat has Muslim-owned and halal stalls (and the famous Satay Street in the evenings), and the office malls carry halal-certified fast-casual outlets. Check each stall's badge or the MUIS HalalSG register." },
      { q: "Is Satay Street at Lau Pa Sat halal?", a: "Satay Street has Muslim-owned satay stalls, but not every stall is certified — look for the stall's halal marking and verify where you can." },
      { q: "When is the best time to eat halal at Raffles Place?", a: "Weekday lunch for the food centres and malls, or the evening for Lau Pa Sat's Satay Street. Weekends in the CBD are much quieter." },
    ],
  },

  esplanade: {
    id: "esplanade",
    name: "Esplanade",
    coords: { lat: 1.2899, lng: 103.8558 },
    intro:
      "The Esplanade — Theatres on the Bay is Singapore's waterfront arts centre, and halal dining around it is a matter of stepping to the adjacent malls. The Esplanade's own outlets are limited and not all suitable, but Suntec City and Marina Square, both a short covered walk away, carry deep halal-certified line-ups, and Marina Bay Sands across the bay adds more. Masjid options are a little further, so plan prayer around City Hall or Bugis. For a concert or a bayside evening, the smart move is to eat at Suntec or Marina Square first, then walk over. This guide scores the verified halal and Muslim-owned options around the Esplanade and its neighbouring malls, is honest about the on-site gap, and points to the nearest reliable clusters so a night at the theatre still ends with a halal meal.",
    mrts: ["Esplanade", "City Hall", "Bayfront"],
    landmarks: [
      { name: "Esplanade — Theatres on the Bay", type: "attraction" },
      { name: "Suntec City", type: "mall", venueId: "suntec-city" },
      { name: "Marina Square", type: "mall", venueId: "marina-square" },
      { name: "Marina Bay waterfront", type: "attraction" },
    ],
    faqs: [
      { q: "Is there halal food at the Esplanade?", a: "On-site options are limited, but Suntec City and Marina Square — a short covered walk away — have deep halal-certified line-ups. Confirm outlets on the MUIS HalalSG register or via their Humble Halal badges." },
      { q: "Where can I eat halal before an Esplanade show?", a: "Suntec City or Marina Square are the closest reliable clusters; Marina Bay Sands across the bay adds more. Eat there, then walk over to the theatre." },
      { q: "Is the Esplanade area convenient for Muslim visitors?", a: "Yes, if you use the neighbouring malls — Suntec and Marina Square make the bayfront easy to combine with a halal meal, with prayer facilities around City Hall and Bugis." },
    ],
  },
};

/** Profile for an area-page id (returns undefined for areas without one). */
export function areaProfile(id?: string): AreaProfile | undefined {
  return id ? AREA_PROFILES[id] : undefined;
}

/** Nearest other areas by centroid distance — candidates for the "Related
 *  areas" block. Uses towns (47) + profiles as the coordinate universe; the
 *  caller filters to ids that actually have generated area pages. */
export function nearbyAreaIds(id: string, limit = 8): { id: string; name: string }[] {
  const origin = AREA_PROFILES[id]?.coords ?? towns.find((t) => t.id === id)?.coords;
  if (!origin) return [];
  const cands = new Map<string, { id: string; name: string; lat: number; lng: number }>();
  for (const t of towns) cands.set(t.id, { id: t.id, name: t.name, lat: t.coords.lat, lng: t.coords.lng });
  for (const p of Object.values(AREA_PROFILES)) cands.set(p.id, { id: p.id, name: p.name, lat: p.coords.lat, lng: p.coords.lng });
  cands.delete(id);
  return [...cands.values()]
    .map((c) => ({ id: c.id, name: c.name, d: haversineKm(origin, { lat: c.lat, lng: c.lng }) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ id: cid, name }) => ({ id: cid, name }));
}
