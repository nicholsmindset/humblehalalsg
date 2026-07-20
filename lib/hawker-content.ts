/* Hand-written hawker-centre profiles (Phase 1) — the thin-content-proof layer,
   mirroring lib/mosque-content.ts. ONLY centres with a profile here get
   index:true on /hawker/[centre] (and a sitemap entry via profiledHawkerIds());
   the rest render but stay noindex until they earn a profile.

   ACCURACY / LEGAL POSTURE:
   - Intros are OUR OWN words; only well-established public facts are stated.
   - Hawker centres are MIXED halal/non-halal venues. Halal status — MUIS
     certification or Muslim ownership — belongs to INDIVIDUAL STALLS, never to
     the centre. Every profile says so explicitly; we never call a centre
     "halal", only describe the density/character of its halal-relevant stalls.
   - No invented stall names. Stall types/cuisines are described generically
     except for genuinely famous, widely documented names (e.g. the Geylang
     Serai nasi padang trays, Haig Road's putu piring, Adam Road's nasi lemak
     cluster, Tekka's briyani row).
   - Prayer-space notes only where we're confident of real proximity. */

export interface HawkerProfile {
  /** hawker_centres.id (slug) — must match the v3 seed. */
  id: string;
  /** 120–200 words, our own prose: what the centre is known for, halal-stall
   *  character, access. Renders in the page hero. */
  intro: string;
  /** Generic stall types / dishes the centre is known for (rendered as tags). */
  knownFor?: string[];
  /** Nearest mosque / prayer space — only stated when confidently close. */
  prayerNote?: string;
  /** Practical, honest visit tips. */
  tips?: string[];
  faqs: { q: string; a: string }[];
}

const PROFILES: HawkerProfile[] = [
  {
    id: "geylang-serai-market",
    intro:
      "Geylang Serai Market & Food Centre is the heart of Malay-Muslim food culture in Singapore. Rebuilt in 2009 with a striking Minangkabau-inspired roof, the two-storey complex pairs a wet market — long trusted for halal meat, spices, kueh and Raya essentials — with a sprawling cooked-food centre upstairs. Unusually for a Singapore hawker centre, the large majority of its food stalls are Muslim-owned: this is where you come for nasi padang ladled from dozens of trays, charcoal-grilled satay, briyani, mee soto, mee rebus, lontong and old-school Malay kueh. During Ramadan, the streets around it host Singapore's most famous bazaar, and the whole precinct heaves in the run-up to Hari Raya. Even here, though, halal status applies stall by stall — most stalls are Muslim-owned rather than MUIS-certified, so look for the certificate or ownership signs at each stall. Paya Lebar MRT is about a ten-minute walk away.",
    knownFor: ["Nasi padang", "Satay", "Briyani", "Mee soto & mee rebus", "Malay kueh", "Halal wet market"],
    prayerNote:
      "Wisma Geylang Serai is next door, and Masjid Khalid on Joo Chiat Road is a short walk away — convenient for Zohor or Asar before or after you eat.",
    tips: [
      "Go in the morning for the wet market and the freshest kueh; many cooked-food stalls sell out after lunch.",
      "During Ramadan, expect big crowds — the bazaar sprawls around the market itself.",
    ],
    faqs: [
      {
        q: "Is Geylang Serai Market halal?",
        a: "Hawker centres are mixed venues, so halal status is per stall, not per centre. At Geylang Serai the large majority of cooked-food stalls are Muslim-owned and the wet market is known for halal meat — but MUIS certification (or Muslim ownership) belongs to individual stalls, so check the certificate or ask the stallholder before ordering.",
      },
      {
        q: "How do I get to Geylang Serai Market?",
        a: "The market is at 1 Geylang Serai, about a ten-minute walk from Paya Lebar MRT (East-West and Circle lines), with buses along Sims Avenue and Changi Road. This page has a map and one-tap directions.",
      },
      {
        q: "When is the best time to visit Geylang Serai Market?",
        a: "Mornings for the wet market and kueh; late morning to early afternoon for the cooked-food stalls, many of which sell out by mid-afternoon. During Ramadan the surrounding bazaar runs into the night and crowds peak before Hari Raya.",
      },
    ],
  },
  {
    id: "haig-road-market-food-centre",
    intro:
      "Haig Road Market & Food Centre sits a few minutes' walk from Geylang Serai, and shares its neighbour's character: a big share of the cooked-food stalls here are Muslim-owned, making it one of the easiest hawker centres in Singapore for halal-conscious diners to graze through. It is best known for putu piring — the steamed rice-flour cakes filled with gula melaka that have made the centre a pilgrimage stop — alongside nasi padang, ayam penyet, mee rebus, goreng pisang and Indian-Muslim favourites. Because it pulls slightly fewer tourists than Geylang Serai proper, queues are often shorter and seats easier to find, which makes it a good lunch alternative when the market is heaving. As at every hawker centre, halal status is a per-stall matter: many stalls here are Muslim-owned rather than MUIS-certified, so look for the certificate or halal signage at each stall. Paya Lebar MRT is roughly ten minutes away on foot.",
    knownFor: ["Putu piring", "Nasi padang", "Ayam penyet", "Goreng pisang", "Indian-Muslim fare"],
    prayerNote:
      "The Geylang Serai precinct — including Wisma Geylang Serai and Masjid Khalid on Joo Chiat Road — is within walking distance for prayers.",
    tips: [
      "The famous putu piring queue moves fast, but peak weekend afternoons can still mean a wait.",
      "Combine with a Geylang Serai Market trip — they're a short walk apart.",
    ],
    faqs: [
      {
        q: "Are the stalls at Haig Road Market & Food Centre halal?",
        a: "Halal status is per stall — a hawker centre itself is never 'halal'. Haig Road has a notably high share of Muslim-owned stalls, but certification and ownership vary stall to stall, so check for a MUIS certificate or Muslim-owned signage at each one.",
      },
      {
        q: "What is Haig Road famous for?",
        a: "Putu piring above all — the steamed rice cakes with gula melaka — plus a strong spread of Malay staples like nasi padang, ayam penyet and goreng pisang.",
      },
      {
        q: "How do I get to Haig Road Market & Food Centre?",
        a: "It's at 14 Haig Road, about ten minutes on foot from Paya Lebar MRT and a few minutes from Geylang Serai Market. This page has a map and directions.",
      },
    ],
  },
  {
    id: "adam-road-food-centre",
    intro:
      "Adam Road Food Centre is small — a single ring of a few dozen stalls at the junction of Adam and Dunearn Roads — but it punches far above its weight for halal-conscious diners. A striking number of its stalls are Muslim-owned, and it is best known island-wide for nasi lemak: the centre's nasi lemak stalls, led by the long-famous Selera Rasa, draw queues from breakfast until late. Beyond nasi lemak you'll find mee rebus, mee soto, briyani, roti john and teh tarik pulled to order, with several stalls running into the late evening — which has made Adam Road a classic supper stop. Its position opposite the Singapore Botanic Gardens (Botanic Gardens MRT is just across the junction) also makes it the natural halal-friendly refuel after a morning walk in the Gardens. The usual rule still applies: halal status here is stall-by-stall — most halal-relevant stalls are Muslim-owned rather than MUIS-certified, so check the signage at each stall.",
    knownFor: ["Nasi lemak", "Mee rebus & mee soto", "Briyani", "Roti john", "Teh tarik", "Late-night supper"],
    tips: [
      "Nasi lemak queues peak at breakfast and lunch on weekends — go early or mid-afternoon.",
      "Pair it with the Botanic Gardens: the MRT station and Gardens gate are right across the junction.",
    ],
    faqs: [
      {
        q: "Is Adam Road Food Centre halal?",
        a: "No hawker centre is halal as a whole — status belongs to individual stalls. Adam Road has an unusually high share of Muslim-owned stalls for its size, including its famous nasi lemak cluster, but you should still look for the MUIS certificate or Muslim-owned signage at each stall.",
      },
      {
        q: "What should I eat at Adam Road Food Centre?",
        a: "Nasi lemak is the signature — Selera Rasa is the most famous name — with mee rebus, mee soto, briyani and roti john as strong follow-ups, and teh tarik to finish.",
      },
      {
        q: "How do I get to Adam Road Food Centre?",
        a: "It's at 2 Adam Road, at the Dunearn Road junction directly across from Botanic Gardens MRT (Downtown and Circle lines). This page has a map and one-tap directions.",
      },
    ],
  },
  {
    id: "old-airport-road-food-centre",
    intro:
      "Old Airport Road Food Centre, open since 1973 on the site of Singapore's first civil airport, is one of the island's largest and most celebrated hawker centres — over a hundred stalls, many of them decades-old names that food guides return to year after year. For halal-conscious diners it needs honest framing: the majority of stalls here are Chinese and not halal, but scattered among them is a worthwhile handful of Muslim-owned and halal-friendly stalls serving Malay and Indian-Muslim staples — think nasi padang, mee goreng, satay and drinks stalls. That makes Old Airport Road a centre you visit for the atmosphere and its specific halal stalls rather than for free-range grazing: know which stalls you're aiming for (this page lists the ones we've verified), and check the MUIS certificate or Muslim-owned signage at the stall itself before ordering. Dakota MRT on the Circle line is about five minutes' walk away, making it one of the easiest classic centres to reach.",
    knownFor: ["Heritage hawker centre", "Nasi padang", "Mee goreng", "Satay", "Old-school kopi & drinks"],
    tips: [
      "Most stalls here are not halal — come with specific halal stalls in mind rather than browsing freely.",
      "Peak lunch is very crowded; mid-afternoon is the relaxed window.",
    ],
    faqs: [
      {
        q: "Is Old Airport Road Food Centre halal?",
        a: "No — and no hawker centre is. Old Airport Road is predominantly non-halal Chinese stalls, with a smaller number of Muslim-owned and halal-friendly stalls among them. Halal status is strictly per stall: use the verified stall list on this page and confirm the certificate or signage at the stall.",
      },
      {
        q: "Why visit Old Airport Road if most stalls aren't halal?",
        a: "It's one of Singapore's great heritage food centres — the atmosphere, the history and its specific Muslim-owned stalls make it worth a targeted visit, especially if you're eating with a mixed group where others want the famous non-halal names.",
      },
      {
        q: "How do I get to Old Airport Road Food Centre?",
        a: "It's at 51 Old Airport Road, about five minutes' walk from Dakota MRT on the Circle line. This page has a map and one-tap directions.",
      },
    ],
  },
  {
    id: "tekka-centre",
    intro:
      "Tekka Centre is Little India's landmark market and food centre, and one of the best places in Singapore for Indian-Muslim food. Its cooked-food floor is famous for a whole row of long-running briyani stalls — Tekka briyani is a category of its own, with dum-style rice, tender mutton and chicken drawing lunchtime queues — alongside prata, murtabak, teh tarik and Indian rojak. The wet market below includes butchers serving the halal-conscious community, and the whole building sits directly beside Little India MRT, making it one of the easiest centres to reach. Tekka is a mixed venue: alongside its many Muslim-run Indian stalls are Chinese and other non-halal stalls, so halal status remains a per-stall matter — most halal-relevant stalls here are Muslim-owned rather than MUIS-certified, and the certificate or ownership signage at the stall is your guide. For prayers, Masjid Abdul Gafoor on Dunlop Street and Masjid Angullia on Serangoon Road are both a short walk away.",
    knownFor: ["Briyani", "Prata & murtabak", "Indian rojak", "Teh tarik", "Wet market with halal butchers"],
    prayerNote:
      "Masjid Abdul Gafoor (Dunlop Street) and Masjid Angullia (Serangoon Road) are both within a short walk of Tekka Centre.",
    tips: [
      "Briyani stalls often sell out by mid-afternoon — lunch is the safe window.",
      "The centre also houses clothing and goods stalls upstairs; it's a full Little India stop, not just a meal.",
    ],
    faqs: [
      {
        q: "Is Tekka Centre halal?",
        a: "Tekka is a mixed hawker centre — many of its Indian food stalls are Muslim-owned, but Chinese and other non-halal stalls operate alongside them. Halal status belongs to individual stalls, so check for a MUIS certificate or Muslim-owned signage at each stall before ordering.",
      },
      {
        q: "What is Tekka Centre famous for?",
        a: "Briyani above all — its row of long-running briyani stalls is one of Singapore's best-known — plus prata, murtabak, Indian rojak and teh tarik, with a working wet market downstairs.",
      },
      {
        q: "Is there a mosque near Tekka Centre?",
        a: "Yes — Masjid Abdul Gafoor on Dunlop Street and Masjid Angullia on Serangoon Road are both a short walk away, so it's easy to pray and eat in one Little India trip.",
      },
    ],
  },
  {
    id: "bedok-interchange-hawker-centre",
    intro:
      "Bedok Interchange Hawker Centre sits at the very centre of Bedok town — beside the air-conditioned bus interchange, Bedok Mall and Bedok MRT — which makes it one of the most convenient hawker stops in the east. Rebuilt in the mid-2010s as part of the town-centre makeover, it's a bright, busy centre where east-siders queue for breakfast noodles and old favourites. For halal-conscious diners it's a genuinely mixed venue: many of its most famous stalls are Chinese and not halal, but there's a solid selection of Muslim-owned stalls serving nasi lemak, mee soto, Malay economy rice and Indian-Muslim staples, plus halal-friendly drinks and dessert stalls. Treat halal status as per-stall — check the MUIS certificate or Muslim-owned signage before ordering, and use the verified stall list on this page as your starting point. Because it's stacked next to the interchange, it's an easy meal before or after connecting almost anywhere in the east.",
    knownFor: ["Nasi lemak", "Mee soto", "Malay economy rice", "Indian-Muslim fare", "Transport-hub convenience"],
    tips: [
      "Breakfast and lunch peaks are intense — this is one of the east's busiest centres; off-peak visits are much calmer.",
      "Bedok Mall next door has additional halal-certified eateries if the stalls you wanted are sold out.",
    ],
    faqs: [
      {
        q: "Are there halal stalls at Bedok Interchange Hawker Centre?",
        a: "Yes — a solid selection of Muslim-owned stalls serve Malay and Indian-Muslim staples. But the centre as a whole is mixed, with many non-halal stalls; halal status is per stall, so check the certificate or signage at each one.",
      },
      {
        q: "How do I get to Bedok Interchange Hawker Centre?",
        a: "It's at 208B New Upper Changi Road, directly beside Bedok MRT and the Bedok bus interchange — effectively zero walk from either. This page has a map and directions.",
      },
    ],
  },
  {
    id: "marsiling-mall-hawker-centre",
    intro:
      "Marsiling Mall Hawker Centre, opened in 2017 on the upper floor of the Marsiling Mall complex, is the north's quiet achiever — a clean, modern centre with a wet market below and a reputation for generous, well-priced food. It has become a destination for briyani in particular: Muslim-owned briyani and Malay-food stalls here draw diners from across Woodlands and beyond, alongside nasi lemak, mee rebus and halal-friendly western and drinks stalls, with plenty of non-halal stalls operating alongside them. Its location between Marsiling and Woodlands MRT stations (each roughly a ten-minute walk or short bus hop) and near the Causeway makes it a practical first or last meal on a JB run. As everywhere, halal status is a stall-level matter — most halal-relevant stalls are Muslim-owned rather than MUIS-certified, so look for the signage at each stall. Masjid An-Nur, one of the north's major mosques, is a short bus ride away in Woodlands.",
    knownFor: ["Briyani", "Nasi lemak", "Mee rebus", "Halal-friendly western", "Value prices"],
    prayerNote:
      "Masjid An-Nur in Woodlands — one of the biggest mosques in the north — is a short bus or car ride away.",
    tips: [
      "Popular briyani stalls can sell out by early afternoon on weekends.",
      "Heading to or from JB? It's a convenient, cheaper alternative to eating at the checkpoint.",
    ],
    faqs: [
      {
        q: "Is Marsiling Mall Hawker Centre halal?",
        a: "The centre is mixed — halal status is per stall. Marsiling Mall has well-known Muslim-owned briyani and Malay stalls alongside non-halal ones, so check for a MUIS certificate or Muslim-owned signage at each stall you order from.",
      },
      {
        q: "What is Marsiling Mall Hawker Centre known for?",
        a: "Briyani is the headline — its Muslim-owned briyani stalls have a strong following in the north — plus nasi lemak, mee rebus and good-value hawker staples generally.",
      },
      {
        q: "How do I get to Marsiling Mall Hawker Centre?",
        a: "It's at 4 Woodlands Street 12, between Marsiling and Woodlands MRT stations — around ten minutes on foot from Marsiling, or a short bus ride from either. This page has a map and directions.",
      },
    ],
  },
  {
    id: "our-tampines-hub-hawker-centre",
    intro:
      "The hawker centre at Our Tampines Hub sits inside Singapore's first integrated community and lifestyle hub — sharing a roof with the stadium, swimming pools, library and community club — which makes it one of the most family-friendly places to eat in the east. Opened in 2017 and run on a social-enterprise model, it's a bright, modern centre with a wide spread of stalls, and a healthy share of them are Muslim-owned or halal-certified: expect nasi lemak, briyani, ayam penyet, Malay economy rice and halal western alongside the usual non-halal Chinese stalls. That mix means the standard rule applies — halal status is per stall, so check the MUIS certificate or Muslim-owned signage at each stall, and use this page's verified list as your shortcut. Tampines MRT and the bus interchange are under ten minutes' walk through the town centre, and Masjid Darul Ghufran — one of Singapore's largest mosques — is a short walk away on Tampines Avenue 5, making prayer-plus-lunch trips easy.",
    knownFor: ["Nasi lemak", "Briyani", "Ayam penyet", "Halal western", "Family-friendly integrated hub"],
    prayerNote:
      "Masjid Darul Ghufran, one of Singapore's largest mosques, is a short walk away along Tampines Avenue 5.",
    tips: [
      "Weekend lunch coincides with stadium and pool crowds — arrive before noon for easy seats.",
      "Return your tray: the hub's centre was an early adopter of tray-return systems.",
    ],
    faqs: [
      {
        q: "Are there halal stalls at Our Tampines Hub?",
        a: "Yes — the hub's hawker centre has a healthy share of Muslim-owned and halal-certified stalls, but it's a mixed centre and halal status is per stall. Check the MUIS certificate or Muslim-owned signage at each stall before ordering.",
      },
      {
        q: "Is there a mosque near Our Tampines Hub?",
        a: "Yes — Masjid Darul Ghufran, one of the largest mosques in Singapore, is a short walk away on Tampines Avenue 5, so you can easily combine prayers with a meal at the hub.",
      },
      {
        q: "How do I get to the hawker centre at Our Tampines Hub?",
        a: "Our Tampines Hub is at 1 Tampines Walk, under ten minutes' walk from Tampines MRT and the bus interchange. The hawker centre is inside the hub; this page has a map and directions.",
      },
    ],
  },
];

const BY_ID = new Map(PROFILES.map((p) => [p.id, p]));

/** Profile for a centre id, if hand-written (the index/sitemap gate). */
export function hawkerProfile(id: string): HawkerProfile | undefined {
  return BY_ID.get(id);
}

/** Centre ids with a hand-written profile — the ONLY /hawker/[centre] pages
 *  that are index:true and belong in the sitemap (mirrors profiledMosqueSlugs). */
export function profiledHawkerIds(): string[] {
  return PROFILES.map((p) => p.id);
}
