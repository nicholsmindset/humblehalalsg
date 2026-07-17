/* Humble Halal — Deen Tools catalog.
   The single source of truth for the /tools hub + nav. Ported from the
   "Deen Hustle" tools suite and rebuilt natively for SEO + cross-sell.
   Add an entry here when a tool ships; the hub renders from this list so
   there are never dead links. Keep `live: true` only for routes that exist. */

export type ToolCategory = "Worship" | "Trackers" | "Calculators" | "Knowledge" | "Finders";

export interface Tool {
  slug: string; // route segment under /tools
  title: string; // card + H1 title
  blurb: string; // one-line description
  icon: string; // Icon name from components/ui.tsx
  category: ToolCategory;
  /** Extra search synonyms (local names, abbreviations, plurals) so the hub
      search matches how people actually type — e.g. "faraid", "misbaha",
      "e-number". Not shown in the UI. */
  keywords?: string[];
  /** Local-only, no sign-up — surfaced as a reassurance chip on cards. */
  privateLocal?: boolean;
  /** Cross-link to an existing surface (e.g. the verified directory) instead of
      a dedicated /tools/<slug> page. Keeps us from rebuilding what we already
      have, and routes traffic into the core product. */
  href?: string;
  live: boolean;
}

/** The destination for a tool card: an explicit cross-link, else /tools/<slug>. */
export function toolHref(t: Tool): string {
  return t.href ?? `/tools/${t.slug}`;
}

export const TOOLS: Tool[] = [
  {
    slug: "quran",
    title: "Quran Reader",
    blurb: "Read all 114 surahs in Arabic, English & audio.",
    icon: "doc",
    category: "Worship",
    keywords: ["koran", "quran", "surah", "surat", "ayah", "ayat", "mushaf", "recitation"],
    live: true,
  },
  {
    slug: "quran-search",
    title: "Search the Quran",
    blurb: "Find any word across the whole Quran.",
    icon: "search",
    category: "Worship",
    href: "/tools/quran/search",
    live: true,
  },
  {
    slug: "prayer-times",
    title: "Prayer Times",
    blurb: "Daily salah times for your location.",
    icon: "clock",
    category: "Worship",
    keywords: ["solat", "sholat", "azan", "adhan", "waktu solat", "subuh", "zohor", "asar", "maghrib", "isyak", "namaz"],
    privateLocal: true,
    live: true,
  },
  {
    slug: "tasbih",
    title: "Tasbih Counter",
    blurb: "A digital misbaha for dhikr — counts stay on your device.",
    icon: "crescent",
    category: "Worship",
    keywords: ["tasbeeh", "tasbeh", "zikir", "dhikr", "counter", "misbaha", "prayer beads"],
    privateLocal: true,
    live: true,
  },
  {
    slug: "duas",
    title: "Dua Library",
    blurb: "Authentic everyday duas by occasion, with sources.",
    icon: "bookmark",
    category: "Worship",
    keywords: ["doa", "supplication", "supplications", "zikir", "prayers"],
    live: true,
  },
  {
    slug: "99-names",
    title: "99 Names of Allah",
    blurb: "Al-Asma ul-Husna — Arabic, transliteration and meaning.",
    icon: "sparkles",
    category: "Knowledge",
    keywords: ["asma", "asmaul husna", "names of allah", "attributes"],
    live: true,
  },
  {
    slug: "hadith",
    title: "Hadith of the Day",
    blurb: "A daily authentic hadith, with its source.",
    icon: "star",
    category: "Knowledge",
    live: true,
  },
  {
    slug: "baby-names",
    title: "Muslim Baby Names",
    blurb: "Meaningful names for boys & girls, with meanings.",
    icon: "family",
    category: "Knowledge",
    live: true,
  },
  {
    slug: "ingredient-checker",
    title: "Is this ingredient halal?",
    blurb: "Look up any E-number or food additive's halal status.",
    icon: "search",
    category: "Knowledge",
    keywords: ["ingredients", "e-number", "e number", "additive", "additives", "gelatin", "emulsifier", "haram", "halal check", "food codes"],
    live: true,
  },
  {
    slug: "date-converter",
    title: "Hijri Date Converter",
    blurb: "Convert between Hijri and Gregorian dates.",
    icon: "calendar",
    category: "Calculators",
    keywords: ["islamic date", "gregorian", "masehi", "date converter", "today hijri"],
    live: true,
  },
  {
    slug: "zakat",
    title: "Zakat Calculator",
    blurb: "Work out the 2.5% due on your zakatable wealth.",
    icon: "dollar",
    category: "Calculators",
    live: true,
  },
  {
    slug: "zakat-fitrah",
    title: "Zakat Fitrah Calculator",
    blurb: "SG fitrah per person before Eid (2026 MUIS rates).",
    icon: "dollar",
    category: "Calculators",
    privateLocal: true,
    live: true,
  },
  {
    slug: "fidyah",
    title: "Fidyah Calculator",
    blurb: "Compensation for fasts you can't make up (SG rate).",
    icon: "dollar",
    category: "Calculators",
    privateLocal: true,
    live: true,
  },
  {
    slug: "imsak-timetable",
    title: "Imsak & Iftar Times",
    blurb: "Today's suhoor end & buka puasa times for Singapore.",
    icon: "clock",
    category: "Worship",
    live: true,
  },
  {
    slug: "islamic-calendar",
    title: "Islamic Calendar",
    blurb: "Countdowns to Ramadan, Eid, Hajj and more.",
    icon: "calendar",
    category: "Calculators",
    live: true,
  },
  {
    slug: "inheritance",
    title: "Inheritance (Faraid)",
    blurb: "Qur'anic shares for spouse, parents & children.",
    icon: "users",
    category: "Calculators",
    keywords: ["faraid", "faraidh", "estate", "will", "waris", "harta pusaka"],
    live: true,
  },
  {
    slug: "halal-stocks",
    title: "Halal Stock Screener",
    blurb: "Screen shares against Shariah financial ratios.",
    icon: "chart",
    category: "Calculators",
    live: true,
  },
  {
    slug: "qibla",
    title: "Qibla Compass",
    blurb: "Find the direction of prayer from where you are.",
    icon: "near",
    category: "Worship",
    keywords: ["kiblat", "kaaba", "direction", "compass", "arah kiblat"],
    privateLocal: true,
    live: true,
  },
  // Trackers — all local-first (on-device), no account.
  {
    slug: "salah-tracker",
    title: "Salah Tracker",
    blurb: "Log the 5 daily prayers and build a streak.",
    icon: "check",
    category: "Trackers",
    privateLocal: true,
    live: true,
  },
  {
    slug: "ramadan",
    title: "Ramadan Tracker",
    blurb: "Mark the days you fast across the month.",
    icon: "moon",
    category: "Trackers",
    privateLocal: true,
    live: true,
  },
  {
    slug: "hifz",
    title: "Hifz Tracker",
    blurb: "Track Quran memorization across all 114 surahs.",
    icon: "bookmark",
    category: "Trackers",
    privateLocal: true,
    live: true,
  },
  {
    slug: "khatam",
    title: "Khatam Tracker",
    blurb: "Complete a 30-juz Quran read-through.",
    icon: "list",
    category: "Trackers",
    privateLocal: true,
    live: true,
  },
  {
    slug: "sadaqah",
    title: "Sadaqah Log",
    blurb: "Track your charity and a giving goal.",
    icon: "heart",
    category: "Trackers",
    privateLocal: true,
    live: true,
  },
  // Finders cross-link into the core product — we already have a MUIS-verified
  // directory and a mosque directory, so we route here rather than rebuild.
  {
    slug: "halal-food",
    title: "Halal Food Near You",
    blurb: "Browse the MUIS-verified halal directory.",
    icon: "utensils",
    category: "Finders",
    href: "/explore",
    live: true,
  },
  {
    slug: "mosque-finder",
    title: "Mosque Finder",
    blurb: "Find masjids near you across Singapore.",
    icon: "mosque",
    category: "Finders",
    keywords: ["masjid", "mosques", "surau", "jumaah", "friday prayer"],
    href: "/mosques",
    live: true,
  },
  {
    slug: "prayer-rooms",
    title: "Prayer Rooms & Musollahs",
    blurb: "Non-mosque prayer spaces in malls, MRT & more.",
    icon: "mosque",
    category: "Finders",
    keywords: ["musollah", "musolla", "surau", "prayer space", "prayer room"],
    href: "/prayer-rooms",
    live: true,
  },
];

export const CATEGORY_ORDER: ToolCategory[] = ["Worship", "Trackers", "Calculators", "Knowledge", "Finders"];

/** Live tools grouped by category, in display order. */
export function toolsByCategory(): { category: ToolCategory; items: Tool[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: TOOLS.filter((t) => t.live && t.category === category),
  })).filter((g) => g.items.length);
}

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug && t.live);
}

/** Lowercase, strip punctuation to spaces (so "e-number" → "e number",
    "Al-Asma" → "al asma"), collapse whitespace. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Does a tool match a free-text search query? Tokenised (every word must
    hit), substring-based, and singular/plural tolerant so "ingredients"
    finds "ingredient" and vice-versa. Searches title, blurb, category and
    keywords. Empty query matches everything. */
export function toolMatches(t: Tool, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const hay = normalize(`${t.title} ${t.blurb} ${t.category} ${(t.keywords || []).join(" ")}`);
  return q.split(" ").every((tok) => {
    if (hay.includes(tok)) return true;
    if (tok.endsWith("s") && hay.includes(tok.slice(0, -1))) return true; // plural → singular
    if (!tok.endsWith("s") && hay.includes(`${tok}s`)) return true;       // singular → plural
    return false;
  });
}
