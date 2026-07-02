/* Humble Halal — programmatic SEO landing pages for EVENTS.
   Mirrors lib/seo-pages.ts (the directory system) for the events vertical:
   category pages (/events/c/[slug]) and area pages (/events/in/[slug]), each
   resolving to a real filtered event view + evergreen intro/FAQ copy. Title
   formulas follow docs/seo/keyword-research.md §K (events & seasonal — e.g.
   "ramadan bazaar singapore", "geylang serai bazaar" are low-KD winners).
   Pages render even with zero live events (evergreen copy + host-event CTA) —
   listings are real Supabase events only, never fabricated. */
import type { EventItem } from "./types";
import { eventCats } from "./events-data";
import { SEO_YEAR } from "./seo-pages";
import type { QA } from "./faq";

export interface EventSeoPage {
  slug: string;
  kind: "category" | "area";
  /** SEO <title> (≤60 chars incl. year; H1 stays evergreen). */
  title: string;
  h1: string;
  intro: string;
  catId?: string;
  areaName?: string;
  /** Lowercase fragments matched against EventItem.area for area pages. */
  areaMatch?: string[];
  faq: QA[];
}

/** Trim to ~60 chars on a word boundary for clean SERP titles. */
function clip(s: string, max = 60) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[—-]\s*$/, "").trim();
}

const COMMON_FAQ: QA[] = [
  {
    q: "Are these events halal-friendly?",
    a: "Every event on Humble Halal is hosted by Muslim-owned businesses or community organisers, with halal catering, prayer arrangements and seating clearly labelled on each event page so you know before you book.",
  },
  {
    q: "How do tickets work?",
    a: "Free events take an instant RSVP; paid events check out securely through Stripe. Your ticket arrives with a scannable QR code in My Tickets — no printing needed.",
  },
];

const HOST_FAQ: QA = {
  q: "Can I list my own event?",
  a: "Yes — any Muslim-owned business or community organiser can host on Humble Halal. Submit your event at humblehalal.com/host-event; listings are reviewed before publishing and ticketing (free RSVP or paid) is built in.",
};

/* ---- Category pages: one per curated event category (lib/events-data). ----
   Copy targets the §K keyword cluster for each category. */
const CATEGORY_COPY: Record<string, { title: string; h1: string; intro: string; faq?: QA[] }> = {
  bazaar: {
    title: `Halal Bazaars & Markets in Singapore (${SEO_YEAR})`,
    h1: "Halal Bazaars & Markets in Singapore",
    intro:
      "From the Geylang Serai Ramadan bazaar to Hari Raya pop-ups and weekend halal markets — find Singapore's halal bazaars with dates, stall highlights, prayer-space info and directions in one place.",
    faq: [
      {
        q: "When is the Geylang Serai Ramadan bazaar?",
        a: `The Geylang Serai bazaar runs through Ramadan each year (evenings until late). Check the event listing here for this year's confirmed dates, opening hours and how to get there.`,
      },
    ],
  },
  workshop: {
    title: `Halal Classes & Workshops in Singapore (${SEO_YEAR})`,
    h1: "Halal Classes & Workshops in Singapore",
    intro:
      "Hands-on cooking masterclasses, Islamic calligraphy, modest fashion, and skills workshops — halal-catered and prayer-time aware, hosted by Muslim-owned businesses across Singapore.",
  },
  talk: {
    title: `Islamic Talks & Ta'lim in Singapore (${SEO_YEAR})`,
    h1: "Islamic Talks & Ta'lim in Singapore",
    intro:
      "Lectures, ta'lim circles and seminars by local asatizah and visiting speakers — with venue prayer arrangements and seating (mixed or segregated) labelled on every listing.",
  },
  community: {
    title: `Muslim Community & Family Events Singapore (${SEO_YEAR})`,
    h1: "Muslim Community & Family Events in Singapore",
    intro:
      "Family days, community iftars, Eid gatherings and neighbourhood meet-ups — halal-catered, family-friendly events for Singapore's Muslim community, updated weekly.",
  },
  charity: {
    title: `Charity & Fundraising Events in Singapore (${SEO_YEAR})`,
    h1: "Charity & Fundraising Events in Singapore",
    intro:
      "Support local and global causes at charity dinners, fundraising bazaars and volunteer drives — many accept zakat and sadaqah directly through the event page.",
    faq: [
      {
        q: "Can I donate without attending?",
        a: "Yes — charity events with donations enabled accept zakat and sadaqah straight from the event page, whether or not you RSVP. Every dollar shown as raised is a real, recorded figure.",
      },
    ],
  },
  business: {
    title: `Muslim Business & Networking Events SG (${SEO_YEAR})`,
    h1: "Muslim Business & Networking Events in Singapore",
    intro:
      "Networking nights, halal-industry seminars and entrepreneur meet-ups for Singapore's Muslim business community — connect over halal-catered sessions that respect prayer times.",
  },
  youth: {
    title: `Kids & Youth Events for Muslim Families (${SEO_YEAR})`,
    h1: "Kids & Youth Events for Muslim Families in Singapore",
    intro:
      "Holiday camps, youth circles, sports days and kids' workshops — safe, halal-catered programmes for young Muslims across Singapore, with age ranges on every listing.",
  },
};

/* ---- Area pages: curated towns with realistic event supply. `match` fragments
   are tested (lowercased substring) against EventItem.area. */
interface SeoEventArea { id: string; name: string; match: string[]; note?: string }
const EVENT_AREAS: SeoEventArea[] = [
  { id: "geylang-serai", name: "Geylang Serai", match: ["geylang", "eunos", "joo chiat"], note: "home of the Ramadan bazaar and Wisma Geylang Serai" },
  { id: "bedok", name: "Bedok", match: ["bedok", "siglap"], note: "the East's community hub" },
  { id: "tampines", name: "Tampines", match: ["tampines"], note: "with Our Tampines Hub hosting year-round" },
  { id: "pasir-ris", name: "Pasir Ris", match: ["pasir ris"] },
  { id: "marine-parade", name: "Marine Parade", match: ["marine parade", "katong"] },
  { id: "bugis", name: "Bugis & Kampong Glam", match: ["bugis", "kampong glam", "arab street", "rochor"], note: "around Sultan Mosque and Arab Street" },
  { id: "city", name: "City & Downtown", match: ["city", "downtown", "marina", "raffles", "tanjong pagar"] },
  { id: "toa-payoh", name: "Toa Payoh", match: ["toa payoh"] },
  { id: "ang-mo-kio", name: "Ang Mo Kio", match: ["ang mo kio"] },
  { id: "hougang", name: "Hougang", match: ["hougang", "kovan"] },
  { id: "sengkang", name: "Sengkang", match: ["sengkang"] },
  { id: "punggol", name: "Punggol", match: ["punggol"] },
  { id: "yishun", name: "Yishun", match: ["yishun"] },
  { id: "woodlands", name: "Woodlands", match: ["woodlands", "admiralty", "marsiling"] },
  { id: "jurong", name: "Jurong", match: ["jurong", "boon lay", "clementi"] },
];

function build(): EventSeoPage[] {
  const pages: EventSeoPage[] = [];

  for (const cat of eventCats) {
    const copy = CATEGORY_COPY[cat.id];
    if (!copy) continue;
    pages.push({
      slug: cat.id,
      kind: "category",
      title: clip(copy.title),
      h1: copy.h1,
      intro: copy.intro,
      catId: cat.id,
      faq: [...(copy.faq ?? []), ...COMMON_FAQ, HOST_FAQ],
    });
  }

  for (const a of EVENT_AREAS) {
    pages.push({
      slug: a.id,
      kind: "area",
      title: clip(`Halal Events in ${a.name}, Singapore (${SEO_YEAR})`),
      h1: `Halal Events in ${a.name}`,
      intro: `Things to do in ${a.name} for the Muslim community${a.note ? ` — ${a.note}` : ""}: bazaars, classes, talks and family events with halal catering and prayer arrangements labelled on every listing.`,
      areaName: a.name,
      areaMatch: a.match,
      faq: [
        {
          q: `What's on in ${a.name} this weekend?`,
          a: `This page lists upcoming halal-friendly events in and around ${a.name}, soonest first. Check back weekly — organisers add new bazaars, classes and community events all the time.`,
        },
        ...COMMON_FAQ,
      ],
    });
  }

  return pages;
}

const PAGES: EventSeoPage[] = build();

export function allEventSeoPages(): EventSeoPage[] {
  return PAGES;
}

export function eventSeoPagesByKind(kind: EventSeoPage["kind"]): EventSeoPage[] {
  return PAGES.filter((p) => p.kind === kind);
}

export function getEventSeoPage(kind: EventSeoPage["kind"], slug: string): EventSeoPage | undefined {
  return PAGES.find((p) => p.kind === kind && p.slug === slug);
}

/** Real events matching a page (published Supabase events passed in). */
export function eventsForSeoPage(page: EventSeoPage, events: EventItem[]): EventItem[] {
  if (page.kind === "category") return events.filter((e) => e.catId === page.catId);
  const frags = page.areaMatch ?? [];
  return events.filter((e) => {
    const area = (e.area || "").toLowerCase();
    return area && frags.some((f) => area.includes(f));
  });
}

/** Path helper for internal links. */
export function eventSeoPath(page: EventSeoPage): string {
  return page.kind === "category" ? `/events/c/${page.slug}` : `/events/in/${page.slug}`;
}

/** The area page an event belongs to (by its free-text area), if any —
 *  powers "Events in {area}" cross-links from event detail pages. */
export function eventSeoPageForArea(area: string | undefined): EventSeoPage | undefined {
  const a = (area || "").toLowerCase();
  if (!a) return undefined;
  return PAGES.find((p) => p.kind === "area" && p.areaMatch?.some((f) => a.includes(f)));
}
