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
  /** Street address — OPTIONAL. We only state addresses we can verify; the
   *  map + directions run off the mosque's real coordinates regardless, so a
   *  page without a precise address still works (falls back to area). Never
   *  invent an address just to fill the field. */
  address?: string;
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

  // ---- Central ----
  { slug: "masjid-bencoolen", nearestMrt: "Bencoolen MRT", builtYear: "2004 (present building)",
    intro: "Masjid Bencoolen is unusual among Singapore mosques — the present building is integrated into a mixed-use development on Bencoolen Street, with the prayer halls sitting within a modern high-rise in the heart of the Bras Basah–Bencoolen arts and civic district. It serves office workers, students and residents in the city centre.",
    faqs: baseFaqs("Masjid Bencoolen") },
  { slug: "masjid-angullia", nearestMrt: "Rochor / Little India MRT",
    intro: "Masjid Angullia stands on Serangoon Road in Little India, founded by the prominent Angullia family of Gujarati Muslim traders. A long-standing anchor for the area's Muslim community, it sits among Little India's shophouses, temples and bustling five-foot-ways.",
    faqs: baseFaqs("Masjid Angullia") },
  { slug: "masjid-tasek-utara", nearestMrt: "Farrer Park MRT",
    intro: "Masjid Tasek Utara serves the Farrer Park and Jalan Besar neighbourhoods, a densely built part of central Singapore. It offers a convenient daily prayer space for residents, shopkeepers and workers in the surrounding streets.",
    faqs: baseFaqs("Masjid Tasek Utara") },
  { slug: "masjid-moulana-mohamed-ali", nearestMrt: "Telok Ayer / Raffles Place MRT",
    intro: "Masjid Moulana Mohamed Ali is a small heritage mosque tucked into the edge of the Central Business District, serving the workers and residents of the Raffles Place and Tanjong Pagar area. Its modest scale belies a long history in Singapore's commercial heart.",
    faqs: baseFaqs("Masjid Moulana Mohamed Ali") },
  { slug: "masjid-al-falah", nearestMrt: "Orchard / Somerset MRT",
    intro: "Masjid Al-Falah is one of the rare mosques right on Orchard Road, housed within a building near Cairnhill. Its central location makes it a well-used prayer space for shoppers, tourists and office workers along Singapore's main shopping belt.",
    faqs: baseFaqs("Masjid Al-Falah") },
  { slug: "masjid-khadijah", nearestMrt: "Aljunied / Paya Lebar MRT", builtYear: "early 1900s",
    intro: "Masjid Khadijah on Geylang Road is a heritage mosque dating to the early twentieth century, long associated with Singapore's Javanese Muslim community. It remains a busy neighbourhood mosque in the lively Geylang district.",
    faqs: baseFaqs("Masjid Khadijah") },
  { slug: "masjid-haji-mohd-salleh", nearestMrt: "Aljunied MRT",
    intro: "Masjid Haji Mohd Salleh is a neighbourhood mosque in the Geylang area, serving the surrounding residents and the many Muslim-owned eateries and shophouses of the district.",
    faqs: baseFaqs("Masjid Haji Mohd Salleh") },
  { slug: "masjid-haji-muhammad-salleh", nearestMrt: "Tanjong Pagar / Outram Park MRT",
    intro: "Masjid Haji Muhammad Salleh on Palmer Road is best known for the adjoining shrine (keramat) of Habib Noh, a revered nineteenth-century saint — making the hill above it a long-standing place of visitation. The mosque anchors a pocket of heritage at the southern edge of the city.",
    faqs: baseFaqs("Masjid Haji Muhammad Salleh") },
  { slug: "masjid-abdul-hamid-kampung-pasiran", nearestMrt: "Novena MRT",
    intro: "Masjid Abdul Hamid Kampung Pasiran serves the Mount Pleasant and Novena area, a quieter, greener part of central Singapore. It recalls the former kampong that once stood here, now surrounded by low-rise homes and medical facilities.",
    faqs: baseFaqs("Masjid Abdul Hamid Kampung Pasiran") },
  { slug: "masjid-ahmad", nearestMrt: "Pasir Panjang MRT",
    intro: "Masjid Ahmad is a neighbourhood mosque in the Pasir Panjang area along Singapore's south-western coast, serving residents and workers of the surrounding estates and port district.",
    faqs: baseFaqs("Masjid Ahmad") },
  { slug: "masjid-burhani", nearestMrt: "City Hall / Clarke Quay MRT",
    intro: "Masjid Burhani on Hill Street is the mosque of Singapore's Dawoodi Bohra community, distinguished by its ornate architecture and detailing. It sits in the civic district near the Singapore River, a short walk from the historic core.",
    faqs: baseFaqs("Masjid Burhani") },
  { slug: "masjid-omar-salmah", nearestMrt: "Boon Keng / Toa Payoh MRT",
    intro: "Masjid Omar Salmah serves the Balestier and Boon Keng area, a neighbourhood known for its heritage shophouses and famous food. It is a convenient daily prayer space for residents and the many visitors to Balestier Road.",
    faqs: baseFaqs("Masjid Omar Salmah") },
  { slug: "masjid-jamiyah-ar-rabitah", nearestMrt: "Tiong Bahru / Outram Park MRT",
    intro: "Masjid Jamiyah Ar-Rabitah, near Tiong Bahru, is associated with Jamiyah Singapore, one of the country's oldest Muslim welfare organisations. It combines a neighbourhood prayer space with community and educational activities.",
    faqs: baseFaqs("Masjid Jamiyah Ar-Rabitah") },
  { slug: "masjid-sallim-mattar", nearestMrt: "MacPherson / Mattar MRT",
    intro: "Masjid Sallim Mattar serves the MacPherson and Mattar area in central-eastern Singapore, a mixed residential and light-industrial district. It offers a well-used daily prayer space for the surrounding estates.",
    faqs: baseFaqs("Masjid Sallim Mattar") },
  { slug: "masjid-muhajirin", nearestMrt: "Braddell / Toa Payoh MRT", builtYear: "1977",
    intro: "Masjid Muhajirin in Toa Payoh opened in 1977 as one of the first mosques funded by Singapore's Mosque Building Fund, built to serve the pioneering HDB new town. It helped set the pattern for the modern heartland mosque.",
    faqs: baseFaqs("Masjid Muhajirin") },
  { slug: "masjid-hajjah-rahimabi-kebun-limau", nearestMrt: "Boon Keng MRT",
    intro: "Masjid Hajjah Rahimabi Kebun Limau serves the Whampoa and Balestier area, another mosque named after a woman benefactor. It anchors a long-settled residential district in central Singapore.",
    faqs: baseFaqs("Masjid Hajjah Rahimabi Kebun Limau") },
  { slug: "masjid-ba-alwie", nearestMrt: "Botanic Gardens MRT",
    intro: "Masjid Ba'alwie, off Lewis Road near Bukit Timah, is the mosque of the Ba'alwie community and is well known for its distinctive character and its long tradition of Maulid gatherings. It is a smaller, community-centred mosque rather than a large congregational one.",
    faqs: baseFaqs("Masjid Ba'alwie") },
  { slug: "masjid-al-huda", nearestMrt: "Beauty World MRT",
    intro: "Masjid Al-Huda serves the Bukit Timah area, a leafy district of private homes and nature reserves in central-western Singapore. It provides a neighbourhood prayer space for the surrounding community.",
    faqs: baseFaqs("Masjid Al-Huda") },
  { slug: "masjid-kampong-delta", nearestMrt: "Tiong Bahru / Havelock MRT",
    intro: "Masjid Kampong Delta serves the Delta and Tiong Bahru area near the Singapore River's southern bank, recalling the former kampong that gave it its name. It is a compact neighbourhood mosque amid the surrounding HDB estates.",
    faqs: baseFaqs("Masjid Kampong Delta") },
  { slug: "masjid-hang-jebat", nearestMrt: "Commonwealth / Queenstown MRT",
    intro: "Masjid Hang Jebat serves the Queenstown area, one of Singapore's oldest satellite towns. Named after the legendary Malay warrior, it is a neighbourhood mosque for the surrounding estates.",
    faqs: baseFaqs("Masjid Hang Jebat") },
  { slug: "masjid-jamek-queenstown", nearestMrt: "Queenstown MRT",
    intro: "Masjid Jamek Queenstown serves the heart of Queenstown, Singapore's first satellite town. It is a long-standing community mosque for the residents of the surrounding blocks.",
    faqs: baseFaqs("Masjid Jamek Queenstown") },
  { slug: "masjid-temenggong-daeng-ibrahim", nearestMrt: "Telok Blangah MRT", heritage: "Historic royal mosque",
    intro: "Masjid Temenggong Daeng Ibrahim in Telok Blangah is one of Singapore's few mosques not administered by MUIS, tied to the lineage of the Johor Temenggong. Set on a historic site near Bukit Chermin, it carries deep heritage from the era before modern Singapore.",
    faqs: baseFaqs("Masjid Temenggong Daeng Ibrahim") },
  { slug: "masjid-al-amin", nearestMrt: "Telok Blangah / Labrador Park MRT",
    intro: "Masjid Al-Amin serves the Telok Blangah and Bukit Merah area on Singapore's southern ridge, close to the parks and residential estates of the south coast. It is a well-used neighbourhood mosque.",
    faqs: baseFaqs("Masjid Al-Amin") },
  { slug: "masjid-hussain-sulaiman", nearestMrt: "Pasir Panjang / Haw Par Villa MRT",
    intro: "Masjid Hussain Sulaiman serves the Pasir Panjang area along the south-western coast, a neighbourhood mosque for residents and workers in the surrounding district.",
    faqs: baseFaqs("Masjid Hussain Sulaiman") },

  // ---- East ----
  { slug: "masjid-al-istighfar", nearestMrt: "Pasir Ris MRT",
    intro: "Masjid Al-Istighfar serves the Pasir Ris new town in Singapore's east, a modern mosque for the families of the surrounding estates near the beach and Downtown East.",
    faqs: baseFaqs("Masjid Al-Istighfar") },
  { slug: "masjid-al-taqua", nearestMrt: "Bedok / Tanah Merah MRT",
    intro: "Masjid Al-Taqua serves the Bedok area, one of the east's most populous residential towns. It is a busy neighbourhood mosque for the many families of the surrounding blocks.",
    faqs: baseFaqs("Masjid Al-Taqua") },
  { slug: "masjid-alkaff-kampung-melayu", nearestMrt: "Eunos / Kembangan MRT",
    intro: "Masjid Alkaff Kampung Melayu carries the name of the philanthropic Alkaff family, who endowed mosques and gardens across old Singapore. Serving the Bedok and Kampung Melayu area, it links the present-day estate to the district's kampong past.",
    faqs: baseFaqs("Masjid Alkaff Kampung Melayu") },
  { slug: "masjid-al-ansar", nearestMrt: "Bedok Reservoir MRT",
    intro: "Masjid Al-Ansar overlooks the Bedok Reservoir, serving the surrounding residential estates in Singapore's east. Its waterside setting makes it one of the more scenic neighbourhood mosques.",
    faqs: baseFaqs("Masjid Al-Ansar") },
  { slug: "masjid-kassim", nearestMrt: "Eunos / Kembangan MRT", builtYear: "1920s",
    intro: "Masjid Kassim on Changi Road is a heritage mosque dating to the 1920s, long associated with the area's Indian-Muslim community. It anchors a historic stretch between Geylang Serai and Kembangan.",
    faqs: baseFaqs("Masjid Kassim") },
  { slug: "masjid-abdul-aleem-siddique", nearestMrt: "Eunos / Kembangan MRT",
    intro: "Masjid Abdul Aleem Siddique in Telok Kurau is named after the renowned twentieth-century missionary and scholar Maulana Abdul Aleem Siddique, who was influential in Singapore's Muslim community. It serves the surrounding residential estate.",
    faqs: baseFaqs("Masjid Abdul Aleem Siddique") },
  { slug: "masjid-darul-aman", nearestMrt: "Eunos / Paya Lebar MRT",
    intro: "Masjid Darul Aman serves the Eunos and Jalan Eunos area, a busy neighbourhood mosque close to Geylang Serai and the eastern heartlands.",
    faqs: baseFaqs("Masjid Darul Aman") },
  { slug: "masjid-al-abdul-razak", nearestMrt: "Eunos / Kembangan MRT",
    intro: "Masjid Al-Abdul Razak serves the Eunos area in eastern Singapore, providing a daily prayer space for the residents of the surrounding estates.",
    faqs: baseFaqs("Masjid Al-Abdul Razak") },
  { slug: "masjid-khalid", nearestMrt: "Eunos / Dakota MRT",
    intro: "Masjid Khalid serves the Joo Chiat and Geylang area, a district rich in Peranakan and Malay heritage. It is a long-standing neighbourhood mosque amid the colourful shophouses of the east.",
    faqs: baseFaqs("Masjid Khalid") },
  { slug: "masjid-kampung-siglap", nearestMrt: "Marine Parade MRT",
    intro: "Masjid Kampung Siglap traces its roots to the old Siglap kampong on Singapore's east coast, one of the area's heritage mosques. It serves the Marine Parade and Siglap community today.",
    faqs: baseFaqs("Masjid Kampung Siglap") },
  { slug: "masjid-mydin", nearestMrt: "Eunos / Kembangan MRT",
    intro: "Masjid Mydin serves the Eunos and Jalan Mydin area of eastern Singapore, a neighbourhood mosque for the surrounding residential streets.",
    faqs: baseFaqs("Masjid Mydin") },
  { slug: "masjid-wak-tanjong", nearestMrt: "Paya Lebar / Dakota MRT",
    intro: "Masjid Wak Tanjong on Paya Lebar Road is a heritage mosque with a long history in the area, today also home to an aLIVE Islamic learning centre. It serves the Paya Lebar and Geylang communities.",
    faqs: baseFaqs("Masjid Wak Tanjong") },

  // ---- North-East ----
  { slug: "masjid-al-muttaqin", nearestMrt: "Ang Mo Kio MRT",
    intro: "Masjid Al-Muttaqin serves the Ang Mo Kio new town, one of Singapore's largest heartland towns. It is a busy neighbourhood mosque for the many families of the surrounding estates.",
    faqs: baseFaqs("Masjid Al-Muttaqin") },
  { slug: "masjid-al-istiqamah", nearestMrt: "Serangoon MRT",
    intro: "Masjid Al-Istiqamah serves the Serangoon area in north-eastern Singapore, providing a daily prayer space for residents of the surrounding town.",
    faqs: baseFaqs("Masjid Al-Istiqamah") },
  { slug: "masjid-en-naeem", nearestMrt: "Kovan / Hougang MRT",
    intro: "Masjid En-Naeem serves the Kovan and Hougang area, a neighbourhood mosque for the residents of the surrounding north-eastern estates.",
    faqs: baseFaqs("Masjid En-Naeem") },
  { slug: "masjid-alkaff-upper-serangoon", nearestMrt: "Hougang / Kovan MRT",
    intro: "Masjid Alkaff Upper Serangoon carries the name of the Alkaff family, whose philanthropy shaped mosques and gardens across old Singapore. It serves the Upper Serangoon and Hougang community.",
    faqs: baseFaqs("Masjid Alkaff Upper Serangoon") },
  { slug: "masjid-haji-yusoff", nearestMrt: "Kaki Bukit / Bartley MRT",
    intro: "Masjid Haji Yusoff serves the Upper Serangoon and Kaki Bukit area, a neighbourhood mosque for the surrounding residential and industrial district.",
    faqs: baseFaqs("Masjid Haji Yusoff") },

  // ---- North ----
  { slug: "masjid-an-nur", nearestMrt: "Woodlands MRT",
    intro: "Masjid An-Nur is one of the larger mosques in the north, serving the growing Woodlands town near the Causeway to Malaysia. Its spacious halls host busy Friday and festival prayers for the north's Muslim community.",
    faqs: baseFaqs("Masjid An-Nur") },
  { slug: "masjid-ahmad-ibrahim", nearestMrt: "Yishun / Khatib MRT",
    intro: "Masjid Ahmad Ibrahim in Yishun is named after Encik Ahmad Ibrahim, a pioneering Singapore politician and unionist. It serves the northern Yishun estates as a busy community mosque.",
    faqs: baseFaqs("Masjid Ahmad Ibrahim") },
  { slug: "masjid-petempatan-melayu-sembawang", nearestMrt: "Sembawang MRT", heritage: "Malay Settlement heritage mosque",
    intro: "Masjid Petempatan Melayu Sembawang stands on land of the historic Kampong Wak Hassan Malay Settlement, one of the last surviving village-era mosques in Singapore's far north. It carries a strong sense of the kampong heritage that once lined the northern coast.",
    faqs: baseFaqs("Masjid Petempatan Melayu Sembawang") },
  { slug: "masjid-darul-makmur", nearestMrt: "Yishun MRT",
    intro: "Masjid Darul Makmur anchors the Muslim community of Yishun in Singapore's north, off Yishun Avenue. It is a busy heartland mosque, especially at Friday prayers when the surrounding estates gather.",
    faqs: baseFaqs("Masjid Darul Makmur") },

  // ---- West ----
  { slug: "masjid-assyakirin", nearestMrt: "Lakeside / Chinese Garden MRT",
    intro: "Masjid Assyakirin serves Taman Jurong in Singapore's west, distinguished by its prominent dome. It is a long-standing community mosque for the surrounding Jurong estates.",
    faqs: baseFaqs("Masjid Assyakirin") },
  { slug: "masjid-al-mukminin", nearestMrt: "Jurong East MRT",
    intro: "Masjid Al-Mukminin serves the Jurong East area, close to one of the west's main commercial and transport hubs. It is a busy neighbourhood mosque for the surrounding town.",
    faqs: baseFaqs("Masjid Al-Mukminin") },
  { slug: "masjid-hasanah", nearestMrt: "Clementi / Jurong East MRT",
    intro: "Masjid Hasanah serves the Teban Gardens and West Coast area, a neighbourhood mosque for the residents of the surrounding western estates.",
    faqs: baseFaqs("Masjid Hasanah") },
  { slug: "masjid-darussalam", nearestMrt: "Clementi / Dover MRT",
    intro: "Masjid Darussalam serves the Clementi area along Commonwealth Avenue West, a busy heartland mosque for the surrounding estates and nearby campuses.",
    faqs: baseFaqs("Masjid Darussalam") },
  { slug: "masjid-tentera-diraja", nearestMrt: "Clementi MRT", heritage: "Historic military-linked mosque",
    intro: "Masjid Tentera Diraja — the \"Royal Armed Forces\" mosque — in Clementi carries a distinctive heritage linked to Malay servicemen, its name recalling the historic military connection. Today it serves the surrounding Clementi community.",
    faqs: baseFaqs("Masjid Tentera Diraja") },
  { slug: "masjid-ar-raudhah", nearestMrt: "Bukit Gombak MRT",
    intro: "Masjid Ar-Raudhah serves Bukit Batok in the west, a modern mosque for the families of the surrounding new-town estates.",
    faqs: baseFaqs("Masjid Ar-Raudhah") },
  { slug: "masjid-al-iman", nearestMrt: "Bukit Panjang MRT",
    intro: "Masjid Al-Iman serves the Bukit Panjang area in Singapore's west, a modern neighbourhood mosque for the surrounding estates near the hills and reservoirs.",
    faqs: baseFaqs("Masjid Al-Iman") },
  { slug: "masjid-al-khair", nearestMrt: "Choa Chu Kang / Yew Tee MRT",
    intro: "Masjid Al-Khair serves the Choa Chu Kang new town in Singapore's west, a modern mosque for the many young families of the surrounding estates.",
    faqs: baseFaqs("Masjid Al-Khair") },
  { slug: "masjid-al-firdaus", nearestMrt: "Boon Lay / Lakeside MRT",
    intro: "Masjid Al-Firdaus serves the Boon Lay and western Jurong area, a neighbourhood mosque for the residents and workers of the surrounding district.",
    faqs: baseFaqs("Masjid Al-Firdaus") },
  { slug: "masjid-pusara-aman", heritage: "Cemetery mosque",
    intro: "Masjid Pusara Aman sits within the Pusara Aman Muslim cemetery in Lim Chu Kang, in Singapore's rural north-west. It serves primarily for funeral (jenazah) prayers and the families who visit the cemetery.",
    faqs: baseFaqs("Masjid Pusara Aman") },
];

const BY_SLUG = new Map(PROFILES.map((p) => [p.slug, p]));

export function mosqueProfile(slug: string): MosqueProfile | undefined {
  return BY_SLUG.get(slug);
}

export function profiledMosqueSlugs(): string[] {
  return PROFILES.map((p) => p.slug);
}
