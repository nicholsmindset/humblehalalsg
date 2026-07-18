/* Editorial calendar. Two layers:
   1. `contentCalendar` (legacy) — weekly slots read by the original C1 draft job
      (scripts/claude-jobs/prompts/blog-draft.md → lib/blog-drafts.ts). Kept as-is.
   2. `postSchedule` (NEW) — the dated, de-duplicated 90-day plan starting 2026-07-26,
      one post/day. Read by the scheduled-drafter job (claude-schedule.yml), which
      writes each due slot as a Keystatic entry (content/posts/*.yaml) with
      status:"scheduled" + its publishDate, and by the daily publisher workflow.
   Reconciliation + full per-post detail: docs/seo/content-calendar-final.md. */

export interface CalendarSlot {
  week: string; // ISO week-start YYYY-MM-DD
  title: string;
  template: "best-of" | "cuisine" | "area" | "seasonal" | "explainer";
  primaryKeyword: string;
  targetSlug: string; // money/landing page to link to
  notes?: string;
}

export const contentCalendar: CalendarSlot[] = [
  { week: "2026-06-15", title: "Best Halal BBQ & Grills in Singapore", template: "cuisine", primaryKeyword: "halal bbq singapore", targetSlug: "halal-bbq-singapore" },
  { week: "2026-06-22", title: "Halal Food in Orchard Road", template: "area", primaryKeyword: "halal food orchard", targetSlug: "halal-food-in-orchard" },
  { week: "2026-06-29", title: "Best Halal Desserts in Singapore", template: "best-of", primaryKeyword: "halal dessert singapore", targetSlug: "halal-desserts-singapore" },
  { week: "2026-07-06", title: "Halal Western Food in Singapore", template: "cuisine", primaryKeyword: "halal western food singapore", targetSlug: "halal-western-singapore" },
];

export function slotsDueThisWeek(weekStart: string): CalendarSlot[] {
  return contentCalendar.filter((s) => s.week === weekStart);
}

/* ============================ Dated 90-day schedule ============================ */

/** Header-tag template ids from docs/content-calendar-90day.md §2. */
export type PostTemplate = "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7";

export interface ScheduledPost {
  /** Go-live date (SGT). Matches the Keystatic entry's datePublished. */
  publishDate: string; // YYYY-MM-DD
  slug: string;
  title: string;
  category: string; // BlogCategorySlug (see lib/blog-categories.ts)
  template: PostTemplate;
  primaryKeyword: string;
  volume: number; // SG monthly volume (Ahrefs)
  kd: number; // keyword difficulty
  /** "seeded" = a content/posts/<slug>.yaml entry already exists; "queued" = the
      scheduled-drafter still needs to write it. */
  status: "seeded" | "queued";
}

// One post per day from 2026-07-26. De-duplicated against the ~31 already-published
// posts (lib/blog.ts) and the /is-halal pSEO family (every "is [brand] halal" topic
// is routed there, not here). See docs/seo/content-calendar-final.md for the full
// reconciliation and per-post PAA/internal-link detail.
export const postSchedule: ScheduledPost[] = [
  { publishDate: "2026-07-26", slug: "waktu-solat-singapore", title: "Waktu Solat Singapore — Prayer Times & Guide", category: "prayers-deen", template: "T5", primaryKeyword: "waktu solat singapore", volume: 9000, kd: 0, status: "seeded" },
  { publishDate: "2026-07-27", slug: "doa-selepas-solat", title: "Doa Selepas Solat — Rumi, Arabic & Meaning", category: "prayers-deen", template: "T5", primaryKeyword: "doa selepas solat", volume: 5700, kd: 1, status: "seeded" },
  { publishDate: "2026-07-28", slug: "halal-food-orchard-road", title: "Halal Food in Orchard Road: Where to Eat", category: "areas-malls", template: "T2", primaryKeyword: "orchard halal food", volume: 1000, kd: 0, status: "seeded" },
  { publishDate: "2026-07-29", slug: "mediterranean-food-singapore", title: "Mediterranean Restaurants in Singapore (Halal-Friendly)", category: "cuisines", template: "T4", primaryKeyword: "mediterranean food singapore", volume: 1200, kd: 1, status: "seeded" },
  { publishDate: "2026-07-30", slug: "halal-food-suntec-marina-square", title: "Halal Food at Suntec City & Marina Square", category: "areas-malls", template: "T2", primaryKeyword: "suntec halal food", volume: 1300, kd: 0, status: "seeded" },
  { publishDate: "2026-07-31", slug: "halal-food-near-me-singapore", title: "Halal Food Near Me: The Complete Singapore Guide", category: "areas-malls", template: "T3", primaryKeyword: "halal food near me", volume: 15000, kd: 19, status: "seeded" },
  { publishDate: "2026-08-01", slug: "doa-buka-puasa-niat-puasa", title: "Doa Buka Puasa & Niat Puasa: Arabic, Rumi + Meaning", category: "prayers-deen", template: "T5", primaryKeyword: "doa buka puasa", volume: 3100, kd: 0, status: "seeded" },
  { publishDate: "2026-08-02", slug: "halal-food-vivocity-harbourfront", title: "Halal Food at VivoCity & HarbourFront", category: "areas-malls", template: "T2", primaryKeyword: "vivocity halal food", volume: 1400, kd: 4, status: "seeded" },
  { publishDate: "2026-08-03", slug: "nasi-padang-singapore-guide", title: "Nasi Padang in Singapore: The Ultimate Guide", category: "cuisines", template: "T4", primaryKeyword: "nasi padang singapore", volume: 700, kd: 3, status: "seeded" },
  { publishDate: "2026-08-04", slug: "malay-wedding-customs-checklist", title: "Malay Wedding in Singapore: Customs, Checklist & Etiquette", category: "muslim-services", template: "T7", primaryKeyword: "malay wedding", volume: 450, kd: 0, status: "seeded" },
  { publishDate: "2026-08-05", slug: "halal-food-jurong-east", title: "Halal Food at Jurong East (Jurong Point, JEM, Westgate & IMM)", category: "areas-malls", template: "T2", primaryKeyword: "jurong point halal food", volume: 1100, kd: 1, status: "seeded" },
  { publishDate: "2026-08-06", slug: "doa-qunut-guide", title: "Doa Qunut — Rumi, Arabic & When to Recite", category: "prayers-deen", template: "T5", primaryKeyword: "doa qunut", volume: 3400, kd: 1, status: "seeded" },
  { publishDate: "2026-08-07", slug: "halal-cruises-from-singapore", title: "Halal Cruises from Singapore 2026", category: "muslim-travel", template: "T7", primaryKeyword: "halal cruise singapore", volume: 300, kd: 0, status: "seeded" },
  { publishDate: "2026-08-08", slug: "halal-food-northpoint-causeway-point", title: "Halal Food at Northpoint & Causeway Point (Yishun/Woodlands)", category: "areas-malls", template: "T2", primaryKeyword: "northpoint halal food", volume: 1200, kd: 0, status: "seeded" },
  { publishDate: "2026-08-09", slug: "halal-food-funan-raffles-city", title: "Halal Food at Funan & Raffles City (City Hall)", category: "areas-malls", template: "T2", primaryKeyword: "funan halal food", volume: 800, kd: 0, status: "seeded" },
  { publishDate: "2026-08-10", slug: "doa-dhuha-guide", title: "Doa Dhuha & Solat Dhuha Guide", category: "prayers-deen", template: "T5", primaryKeyword: "doa dhuha", volume: 3400, kd: 1, status: "seeded" },
  { publishDate: "2026-08-11", slug: "songkok-kopiah-singapore", title: "Best Songkok & Kopiah Shops in Singapore", category: "muslim-services", template: "T7", primaryKeyword: "songkok", volume: 1100, kd: 0, status: "seeded" },
  { publishDate: "2026-08-12", slug: "halal-food-nex-serangoon", title: "Halal Food at NEX & Serangoon", category: "areas-malls", template: "T2", primaryKeyword: "nex halal food", volume: 800, kd: 0, status: "seeded" },
  { publishDate: "2026-08-13", slug: "halal-food-tampines", title: "Halal Food in Tampines (Hub, Mall & MRT)", category: "areas-malls", template: "T2", primaryKeyword: "tampines halal food", volume: 700, kd: 0, status: "seeded" },
  { publishDate: "2026-08-14", slug: "daily-duas-singapore", title: "Daily Duas: Naik Kenderaan, Keluar Rumah & More", category: "prayers-deen", template: "T5", primaryKeyword: "doa naik kenderaan", volume: 2100, kd: 0, status: "queued" },
  { publishDate: "2026-08-15", slug: "prayer-rooms-changi-airport", title: "Prayer Rooms & Surau at Changi Airport: Terminal Guide", category: "muslim-travel", template: "T5", primaryKeyword: "prayer room changi airport", volume: 100, kd: 0, status: "queued" },
  { publishDate: "2026-08-16", slug: "best-briyani-singapore", title: "The Best Briyani in Singapore (Indian-Muslim Classics)", category: "cuisines", template: "T4", primaryKeyword: "best briyani singapore", volume: 600, kd: 9, status: "queued" },
  { publishDate: "2026-08-17", slug: "halal-food-plaza-singapura", title: "Halal Food at Plaza Singapura & Dhoby Ghaut", category: "areas-malls", template: "T2", primaryKeyword: "plaza singapura halal food", volume: 600, kd: 0, status: "queued" },
  { publishDate: "2026-08-18", slug: "islamic-calendar-2026-singapore", title: "Islamic Calendar 2026 Singapore (Hijri to Gregorian)", category: "prayers-deen", template: "T5", primaryKeyword: "islamic calendar 2026", volume: 1400, kd: 0, status: "queued" },
  { publishDate: "2026-08-19", slug: "abaya-singapore-guide", title: "Abaya Singapore: Where to Shop & How to Style", category: "muslim-services", template: "T7", primaryKeyword: "abaya", volume: 1500, kd: 12, status: "queued" },
  { publishDate: "2026-08-20", slug: "halal-food-paya-lebar", title: "Halal Food in Paya Lebar (PLQ & Paya Lebar Quarter)", category: "areas-malls", template: "T2", primaryKeyword: "paya lebar halal food", volume: 600, kd: 0, status: "queued" },
  { publishDate: "2026-08-21", slug: "halal-pizza-singapore", title: "Halal Pizza in Singapore: Which Chains Are Halal?", category: "cuisines", template: "T3", primaryKeyword: "halal pizza singapore", volume: 400, kd: 0, status: "queued" },
  { publishDate: "2026-08-22", slug: "best-shawarma-singapore", title: "Where to Find the Best Shawarma in Singapore", category: "cuisines", template: "T4", primaryKeyword: "shawarma singapore", volume: 250, kd: 0, status: "queued" },
  { publishDate: "2026-08-23", slug: "halal-food-east-singapore-malls", title: "Halal Food in East SG (Bedok, Changi City Point, Downtown East)", category: "areas-malls", template: "T2", primaryKeyword: "bedok mall halal food", volume: 500, kd: 0, status: "queued" },
  { publishDate: "2026-08-24", slug: "zakat-calculator-singapore", title: "Zakat Calculator Singapore — Harta, Emas & Nisab", category: "prayers-deen", template: "T5", primaryKeyword: "zakat calculator", volume: 600, kd: 3, status: "queued" },
  { publishDate: "2026-08-25", slug: "halal-food-sentosa", title: "Halal Food in Sentosa: Beach & Resort Eats", category: "areas-malls", template: "T2", primaryKeyword: "halal food sentosa", volume: 200, kd: 0, status: "queued" },
  { publishDate: "2026-08-26", slug: "hantaran-dulang-kadi-singapore", title: "Hantaran & Dulang Guide + Finding a Kadi in Singapore", category: "muslim-services", template: "T7", primaryKeyword: "hantaran", volume: 200, kd: 0, status: "queued" },
  { publishDate: "2026-08-27", slug: "halal-food-bangkok-guide", title: "Halal Food in Bangkok: Markets, Malls & the Airport", category: "muslim-travel", template: "T4", primaryKeyword: "halal food in bangkok", volume: 100, kd: 0, status: "queued" },
  { publishDate: "2026-08-28", slug: "is-kombucha-halal", title: "Is Kombucha Halal? Alcohol, Fermentation & the Ruling", category: "halal-questions", template: "T6", primaryKeyword: "is kombucha halal", volume: 200, kd: 0, status: "queued" },
  { publishDate: "2026-08-29", slug: "halal-japanese-restaurants-singapore", title: "Halal Japanese Restaurants in Singapore (Sushi, Ramen, Curry)", category: "cuisines", template: "T4", primaryKeyword: "halal japanese restaurant singapore", volume: 200, kd: 0, status: "queued" },
  { publishDate: "2026-08-30", slug: "qibla-direction-singapore", title: "Qibla Direction Singapore — Find the Kiblat", category: "prayers-deen", template: "T5", primaryKeyword: "qibla direction singapore", volume: 150, kd: 0, status: "queued" },
  { publishDate: "2026-08-31", slug: "what-is-takaful-singapore", title: "What Is Takaful? Islamic Insurance for Singaporeans", category: "muslim-services", template: "T6", primaryKeyword: "takaful", volume: 400, kd: 24, status: "queued" },
  { publishDate: "2026-09-01", slug: "halal-food-seoul-guide", title: "Halal Food in Seoul: Where Singaporeans Should Eat", category: "muslim-travel", template: "T4", primaryKeyword: "halal food in seoul", volume: 100, kd: 0, status: "queued" },
  { publishDate: "2026-09-02", slug: "halal-desserts-singapore-guide", title: "Halal Dessert Spots in Singapore (+ Near Me)", category: "cuisines", template: "T3", primaryKeyword: "halal dessert near me", volume: 600, kd: 0, status: "queued" },
  { publishDate: "2026-09-03", slug: "halal-chinese-restaurants-singapore", title: "Halal Chinese Restaurants in Singapore (Dim Sum, Hotpot, Zi Char)", category: "cuisines", template: "T4", primaryKeyword: "halal chinese restaurant singapore", volume: 350, kd: 8, status: "queued" },
  { publishDate: "2026-09-04", slug: "digital-tasbih-counter", title: "Digital Tasbih Counter — Online Dzikir Tool", category: "prayers-deen", template: "T5", primaryKeyword: "tasbih", volume: 500, kd: 1, status: "queued" },
  { publishDate: "2026-09-05", slug: "bekam-cupping-singapore", title: "Bekam (Cupping) in Singapore: Benefits, Price & Where to Go", category: "muslim-services", template: "T7", primaryKeyword: "bekam singapore", volume: 150, kd: 6, status: "queued" },
  { publishDate: "2026-09-06", slug: "halal-food-japan-guide", title: "Halal Food in Japan: A Singaporean Muslim's Survival Guide", category: "muslim-travel", template: "T4", primaryKeyword: "halal food in japan", volume: 100, kd: 6, status: "queued" },
  { publishDate: "2026-09-07", slug: "is-gelatin-halal", title: "Is Gelatin Halal? Pork vs Beef vs Plant Sources", category: "halal-questions", template: "T6", primaryKeyword: "is gelatin halal", volume: 150, kd: 1, status: "queued" },
  { publishDate: "2026-09-08", slug: "halal-seafood-singapore", title: "Halal Seafood Restaurants in Singapore", category: "cuisines", template: "T3", primaryKeyword: "halal seafood singapore", volume: 350, kd: 11, status: "queued" },
  { publishDate: "2026-09-09", slug: "halal-thai-food-singapore", title: "Halal Thai Food in Singapore: Tom Yum, Boat Noodles & More", category: "cuisines", template: "T4", primaryKeyword: "halal thai food singapore", volume: 450, kd: 20, status: "queued" },
  { publishDate: "2026-09-10", slug: "halal-mini-buffet-catering-singapore", title: "Halal Mini Buffet Catering in Singapore", category: "muslim-services", template: "T7", primaryKeyword: "halal mini buffet catering singapore", volume: 250, kd: 3, status: "queued" },
  { publishDate: "2026-09-11", slug: "halal-investment-singapore", title: "Halal Investment in Singapore: A Beginner's Guide", category: "muslim-services", template: "T7", primaryKeyword: "halal investment", volume: 150, kd: 3, status: "queued" },
  { publishDate: "2026-09-12", slug: "baju-melayu-guide", title: "The Complete Guide to Baju Melayu", category: "muslim-services", template: "T7", primaryKeyword: "baju melayu", volume: 1000, kd: 14, status: "queued" },
  { publishDate: "2026-09-13", slug: "no-pork-no-lard-vs-halal", title: "What No Pork No Lard Actually Means (vs Halal)", category: "halal-questions", template: "T6", primaryKeyword: "no pork no lard", volume: 150, kd: 0, status: "queued" },
  { publishDate: "2026-09-14", slug: "halal-bbq-grill-singapore", title: "Halal BBQ & Grill in Singapore", category: "cuisines", template: "T3", primaryKeyword: "halal bbq singapore", volume: 300, kd: 8, status: "queued" },
  { publishDate: "2026-09-15", slug: "middle-eastern-food-singapore", title: "Middle Eastern Food in Singapore: Halal Guide to Arab Street", category: "cuisines", template: "T4", primaryKeyword: "middle eastern food singapore", volume: 300, kd: 6, status: "queued" },
  { publishDate: "2026-09-16", slug: "nama-bayi-islam", title: "Nama Bayi Islam — Boy & Girl Names from the Quran", category: "prayers-deen", template: "T5", primaryKeyword: "nama bayi lelaki islam", volume: 150, kd: 0, status: "queued" },
  { publishDate: "2026-09-17", slug: "muslimah-hair-salon-singapore", title: "Muslimah-Friendly Hair Salons in Singapore (Private Rooms)", category: "muslim-services", template: "T7", primaryKeyword: "muslimah hair salon", volume: 300, kd: 15, status: "queued" },
  { publishDate: "2026-09-18", slug: "halal-food-tokyo-guide", title: "Halal Food in Tokyo: From Tokyo Station to Asakusa", category: "muslim-travel", template: "T4", primaryKeyword: "halal food in tokyo", volume: 80, kd: 3, status: "queued" },
  { publishDate: "2026-09-19", slug: "tahajjud-time-singapore", title: "Tahajjud Time Singapore — When & How to Pray", category: "prayers-deen", template: "T5", primaryKeyword: "tahajjud time singapore", volume: 60, kd: 0, status: "queued" },
  { publishDate: "2026-09-20", slug: "halal-mexican-food-singapore", title: "Halal Mexican Food in Singapore: Tacos, Burritos & Quesadillas", category: "cuisines", template: "T4", primaryKeyword: "halal mexican food singapore", volume: 100, kd: 0, status: "queued" },
  { publishDate: "2026-09-21", slug: "wasiat-islamic-will-singapore", title: "Wasiat (Islamic Will) in Singapore: How to Write One", category: "muslim-services", template: "T6", primaryKeyword: "wasiat", volume: 100, kd: 0, status: "queued" },
  { publishDate: "2026-09-22", slug: "is-mirin-halal", title: "Is Mirin Halal? Cooking With Japanese Rice Wine", category: "halal-questions", template: "T6", primaryKeyword: "is mirin halal", volume: 70, kd: 0, status: "queued" },
  { publishDate: "2026-09-23", slug: "halal-food-bali-guide", title: "Halal Food in Bali: Eating Well in Kuta, Seminyak & Ubud", category: "muslim-travel", template: "T4", primaryKeyword: "halal food in bali", volume: 70, kd: 0, status: "queued" },
  { publishDate: "2026-09-24", slug: "women-only-gym-singapore", title: "Women-Only & Muslimah Gyms in Singapore", category: "muslim-services", template: "T7", primaryKeyword: "women only gym singapore", volume: 70, kd: 0, status: "queued" },
];

/** The publish gate used by lib/cms-blog.ts. A post is live when it is Published,
    or Scheduled with a publish date that has arrived (SGT). Kept pure + here so it
    can be unit-tested without the server-only CMS module. String compare is safe:
    both values are YYYY-MM-DD. */
export function isPostLive(
  status: string,
  datePublished: string | null | undefined,
  todayISO: string,
): boolean {
  return status === "published" || (status === "scheduled" && !!datePublished && datePublished <= todayISO);
}

/** Scheduled posts whose publishDate has arrived (dateISO = today, SGT). */
export function scheduledDueBy(dateISO: string): ScheduledPost[] {
  return postSchedule.filter((p) => p.publishDate <= dateISO);
}

/** Scheduled posts due exactly on dateISO (the daily publisher's "is anything due today?"). */
export function scheduledDueOn(dateISO: string): ScheduledPost[] {
  return postSchedule.filter((p) => p.publishDate === dateISO);
}

/** The next `n` still-unwritten slots (status:"queued") the drafter should draft. */
export function nextQueuedSlots(n: number): ScheduledPost[] {
  return postSchedule.filter((p) => p.status === "queued").slice(0, n);
}
