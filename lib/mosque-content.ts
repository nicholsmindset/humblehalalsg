/* Hand-written mosque profiles (Phase 1) — the thin-content-proof layer.
   ONLY mosques with a profile here get an individual /mosques/[slug] page +
   sitemap entry; the rest stay as hub rows linking to the map (mirrors the
   AREA_INDEX gate in lib/seo-pages.ts).

   ACCURACY / LEGAL POSTURE (matches lib/area-content.ts):
   - Intros are OUR OWN words — MUIS mosque-directory prose is not open-licensed.
   - Only well-established FACTS are stated (facts aren't copyrightable): founding
     year, heritage status, neighbourhood, nearest MRT, address.
   - We do NOT fabricate per-mosque Jumaah session times / Muslimah availability
     (no live source to verify each). The detail page renders a factual SG-wide
     Jumaah explainer instead and tells visitors to confirm specifics with the
     mosque or MuslimSG. This keeps every page honest and non-thin via its unique
     intro + live prayer times + qibla + nearby halal food + map. */

export interface MosqueProfile {
  slug: string;
  address: string;
  postal?: string;
  nearestMrt?: string;
  builtYear?: string;
  heritage?: string; // e.g. "National Monument (gazetted 1975)"
  intro: string;
  facilities?: string[];
  faqs: { q: string; a: string }[];
}

function baseFaqs(name: string): { q: string; a: string }[] {
  return [
    {
      q: `What are the prayer times at ${name}?`,
      a: `${name} follows the official MUIS prayer times for Singapore, shown live on this page each day (Subuh, Zohor, Asar, Maghrib and Isyak). For the exact iqamah timing, arrive a few minutes early or check with the mosque.`,
    },
    {
      q: `Does ${name} hold Friday (Jumu'ah) prayers?`,
      a: `Yes. Like most Singapore mosques it holds Friday prayers around midday; larger mosques may run two sessions. Session times, khutbah language and whether a women's (Muslimah) space is available for Jumu'ah vary — confirm with the mosque or on the MuslimSG app.`,
    },
  ];
}

const PROFILES: MosqueProfile[] = [
  {
    slug: "masjid-sultan",
    address: "3 Muscat Street", postal: "198833", nearestMrt: "Bugis MRT",
    builtYear: "1924–1932 (present building)", heritage: "National Monument (gazetted 1975)",
    intro:
      "Masjid Sultan is Singapore's most iconic mosque — the golden-domed landmark at the heart of Kampong Glam. The present building, designed by Denis Santry of Swan & Maclaren and completed in 1932, replaced the original 1820s mosque built for Sultan Hussein Shah. Its prayer hall is one of the largest in Singapore and it remains a focal point for the Muslim community and visitors alike.",
    facilities: ["Large main prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access"],
    faqs: [
      { q: "Is Masjid Sultan open to non-Muslim visitors?", a: "Yes — visitors are welcome outside prayer times, with modest dress required (robes are provided at the entrance). Avoid entering the prayer hall during congregational prayers." },
      ...baseFaqs("Masjid Sultan"),
    ],
  },
  {
    slug: "masjid-abdul-gafoor",
    address: "41 Dunlop Street", postal: "209369", nearestMrt: "Rochor / Jalan Besar MRT",
    builtYear: "1907", heritage: "National Monument (gazetted 1979)",
    intro:
      "Masjid Abdul Gafoor in Little India is celebrated for its ornate façade and a sundial above the main entrance inscribed with the names of 25 prophets. Completed in 1907 and restored in the 2000s, it blends Indo-Islamic and European architectural detail and serves the Indian-Muslim community of the Dunlop Street area.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities"],
    faqs: baseFaqs("Masjid Abdul Gafoor"),
  },
  {
    slug: "masjid-jamae-chulia",
    address: "218 South Bridge Road", postal: "058767", nearestMrt: "Chinatown MRT",
    builtYear: "1826", heritage: "National Monument (gazetted 1974)",
    intro:
      "Masjid Jamae (Chulia) is one of Singapore's oldest mosques, built in the 1820s by the Chulia community — Tamil Muslims from South India's Coromandel Coast. Its distinctive twin minaret gateway on South Bridge Road stands amid Chinatown's temples and shophouses, a reminder of the area's long multi-religious history.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities"],
    faqs: baseFaqs("Masjid Jamae"),
  },
  {
    slug: "masjid-al-abrar",
    address: "192 Telok Ayer Street", postal: "068635", nearestMrt: "Telok Ayer MRT",
    builtYear: "1850s (present building)", heritage: "National Monument (gazetted 1974)",
    intro:
      "Masjid Al-Abrar on Telok Ayer Street began as a humble thatched prayer house in the 1820s — earning the nickname Kuchu Palli (\"hut mosque\") — before the present building rose in the 1850s. Founded by the Chulia community near the old shoreline, it sits on a street that once welcomed arriving immigrants of many faiths.",
    facilities: ["Main prayer hall", "Wudhu facilities"],
    faqs: baseFaqs("Masjid Al-Abrar"),
  },
  {
    slug: "masjid-hajjah-fatimah",
    address: "4001 Beach Road", postal: "199584", nearestMrt: "Nicoll Highway / Lavender MRT",
    builtYear: "1846", heritage: "National Monument (gazetted 1973)",
    intro:
      "Masjid Hajjah Fatimah is named after the Malaccan-born businesswoman who funded it in 1846 — a rare mosque named after a woman. Its European-influenced tower leans slightly, earning it the affectionate title of Singapore's own \"leaning tower.\" The complex blends Malay, Islamic and colonial architectural styles near the old Kampong Glam waterfront.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities"],
    faqs: baseFaqs("Masjid Hajjah Fatimah"),
  },
  {
    slug: "masjid-malabar",
    address: "471 Victoria Street", postal: "198370", nearestMrt: "Bugis MRT",
    builtYear: "1963 (completed)",
    intro:
      "Masjid Malabar, the blue-tiled mosque on the edge of Kampong Glam, is the spiritual home of Singapore's Malabar Muslim community from Kerala, South India. Its striking lapis-blue geometric tilework makes it one of the most photographed mosques in the city, completed in 1963 after decades of community fundraising.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities"],
    faqs: baseFaqs("Masjid Malabar"),
  },
  {
    slug: "masjid-omar-kampong-melaka",
    address: "10 Keng Cheow Street", postal: "059607", nearestMrt: "Clarke Quay MRT",
    builtYear: "1820 (founded); rebuilt 1980s",
    intro:
      "Masjid Omar Kampong Melaka holds the distinction of being Singapore's oldest mosque, founded in 1820 by the Arab trader Syed Omar Aljunied — a philanthropist whose name marks streets across the city. Rebuilt in its current form, it sits quietly along the Singapore River near Clarke Quay, anchoring one of the island's earliest Muslim settlements.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities"],
    faqs: baseFaqs("Masjid Omar Kampong Melaka"),
  },
  {
    slug: "masjid-mujahidin",
    address: "590 Stirling Road", postal: "148952", nearestMrt: "Queenstown MRT",
    builtYear: "1977",
    intro:
      "Masjid Mujahidin in Queenstown was the first mosque built under Singapore's Mosque Building Fund, opening in 1977 to serve the new HDB heartlands. It set the template for the modern \"new-generation\" neighbourhood mosque — purpose-built for growing estates rather than inherited from a historic kampong.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access"],
    faqs: baseFaqs("Masjid Mujahidin"),
  },
  {
    slug: "masjid-darul-ghufran",
    address: "503 Tampines Avenue 5", postal: "529651", nearestMrt: "Tampines MRT",
    builtYear: "1990",
    intro:
      "Masjid Darul Ghufran is one of Singapore's largest mosques, serving the dense Tampines heartland since 1990. After a major redevelopment it can accommodate several thousand worshippers, making it a major centre for Friday and Ramadan prayers in the east.",
    facilities: ["Large main prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access", "aLIVE Islamic learning"],
    faqs: baseFaqs("Masjid Darul Ghufran"),
  },
  {
    slug: "masjid-an-nahdhah",
    address: "9A Bishan Street 14", postal: "579786", nearestMrt: "Bishan MRT",
    builtYear: "2006",
    intro:
      "Masjid An-Nahdhah in Bishan doubles as a mosque and a centre for inter-faith understanding — it houses the Harmony Centre, which introduces visitors to Islam and Singapore's multi-religious society. Its clean, contemporary architecture reflects its role as a modern community and education hub.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access", "Harmony Centre"],
    faqs: baseFaqs("Masjid An-Nahdhah"),
  },
  {
    slug: "masjid-assyafaah",
    address: "1 Admiralty Lane", postal: "757620", nearestMrt: "Sembawang MRT",
    builtYear: "2004",
    intro:
      "Masjid Assyafaah in Sembawang is an award-winning piece of modern mosque architecture — it forgoes the traditional dome and minaret for a bold, sculptural concrete form and intricate aluminium screens. Completed in 2004, it shows how a Singapore mosque can be unmistakably contemporary while remaining rooted in Islamic design principles.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access"],
    faqs: baseFaqs("Masjid Assyafaah"),
  },
  {
    slug: "masjid-maarof",
    address: "20 Jurong West Street 26", postal: "648125", nearestMrt: "Gombak / Boon Lay area",
    builtYear: "2016",
    intro:
      "Masjid Maarof is one of the largest mosques in the west, opened in 2016 to serve the growing Jurong West community. Built to modern eco-conscious standards with generous naturally-lit prayer halls, it can host thousands of worshippers for Friday and festival prayers.",
    facilities: ["Large main prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access", "aLIVE Islamic learning"],
    faqs: baseFaqs("Masjid Maarof"),
  },
  {
    slug: "masjid-al-islah",
    address: "30 Punggol Field", postal: "828812", nearestMrt: "Punggol MRT",
    builtYear: "2015",
    intro:
      "Masjid Al-Islah in Punggol is Singapore's pioneering eco-mosque — designed to be naturally ventilated and day-lit, cutting its reliance on air-conditioning. Opened in 2015 for the young Punggol town, it pairs sustainable design with generous community and learning spaces.",
    facilities: ["Naturally-ventilated prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access", "aLIVE Islamic learning"],
    faqs: baseFaqs("Masjid Al-Islah"),
  },
  {
    slug: "masjid-al-mawaddah",
    address: "151 Compassvale Bow", postal: "544997", nearestMrt: "Sengkang MRT",
    builtYear: "2009",
    intro:
      "Masjid Al-Mawaddah serves the Sengkang and Compassvale heartlands, opened in 2009 as one of the north-east's new-generation mosques. Its warm, modern design and family-friendly programmes have made it a busy community anchor for the surrounding estates.",
    facilities: ["Main prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access", "aLIVE Islamic learning"],
    faqs: baseFaqs("Masjid Al-Mawaddah"),
  },
  {
    slug: "masjid-yusof-ishak",
    address: "10 Woodlands Drive 17", postal: "737774", nearestMrt: "Woodlands South MRT",
    builtYear: "2017",
    intro:
      "Masjid Yusof Ishak in Woodlands is named after Singapore's first President, Encik Yusof Ishak. Opened in 2017, it is one of the newest mosques on the island — a spacious, contemporary building serving the growing northern community with modern learning and family facilities.",
    facilities: ["Large main prayer hall", "Women's prayer area", "Wudhu facilities", "Wheelchair access", "aLIVE Islamic learning"],
    faqs: baseFaqs("Masjid Yusof Ishak"),
  },
];

const BY_SLUG = new Map(PROFILES.map((p) => [p.slug, p]));

export function mosqueProfile(slug: string): MosqueProfile | undefined {
  return BY_SLUG.get(slug);
}

export function profiledMosqueSlugs(): string[] {
  return PROFILES.map((p) => p.slug);
}
