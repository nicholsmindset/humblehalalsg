/* Humble Halal — shared domain types */

export interface LatLng {
  lat: number;
  lng: number;
}

export type BadgeKey =
  | "muis"
  | "admin"
  | "owned"
  | "friendly"
  | "nopork"
  | "pending"
  | "family"
  | "prayer";

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface Area {
  id: string;
  name: string;
  count: number;
  tone: string;
  image?: string;
  coords?: LatLng;
}

export interface VerifyInfo {
  certNo: string | null;
  verified: string | null;
  expires: string | null;
  confirms: number;
  renewed: boolean;
  expiringSoon?: boolean;
}

export interface PrayerInfo {
  has: boolean;
  gender?: string;
  wudhu?: boolean;
  capacity?: string;
  note?: string;
}

export interface Outlet {
  id: string;
  name: string;
  area: string;
  address: string;
  hours: string;
  open: boolean;
  distance: string;
  certNo: string;
  flagship?: boolean;
}

export interface Listing {
  id: string;
  slug?: string;
  name: string;
  cat: string;
  catId: string;
  cuisine: string;
  area: string;
  price: string;
  rating: number;
  reviews: number;
  badges: BadgeKey[];
  blurb: string;
  /** Stored SEO overrides (from AI listing-enrichment, admin-approved). Prefer
   *  these in generateMetadata; fall back to the computed title/description. */
  seoTitle?: string;
  seoDescription?: string;
  /** Hawker stall unit number (e.g. "#01-42"), when this listing is a hawker stall. */
  stallNo?: string;
  /** Set when this listing belongs to a hawker centre — it lives in the /hawker
   *  vertical and is excluded from the general /explore directory feed. */
  hawkerCentreId?: string;
  img: string;
  tone: string;
  open: boolean;
  distance: string;
  prayer: boolean;
  delivery: boolean;
  featured: boolean;
  /** Subscription tier (PlanKey: free | verified | featured | premium). Drives
   *  feature-gating via lib/plans. Optional — defaults to "free" when absent. */
  plan?: string;
  hours: string;
  phone: string;
  wa: string;
  ig: string;
  web: string;
  address: string;
  postal?: string;
  tags: string[];
  // enrichment (added at module load)
  image?: string;
  /** Owner-uploaded gallery ({url, caption?}, cover first). The public page
   *  renders these; stock imagery is only a fallback when this is empty. */
  photos?: { url: string; caption?: string }[];
  certified?: boolean;
  certBody?: string | null;
  /** True when an owner has claimed this business (owner_id or claimed_by set).
   *  Drives the "Is this your business? Claim it" prompt on unclaimed pages. */
  claimed?: boolean;
  verify?: VerifyInfo;
  prayerInfo?: PrayerInfo;
  statusChanged?: boolean;
  franchise?: boolean;
  outlets?: Outlet[] | null;
  outletCount?: number;
  coords?: LatLng;
  distanceKm?: number;
  hoursWeek?: import("./hours").WeekHours;
}

export interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
}

export interface BadgeMetaEntry {
  key: BadgeKey;
  cls: string;
  label: string;
  icon: string;
  tier: string;
}

export interface Analytics {
  views: number;
  calls: number;
  whatsapp: number;
  directions: number;
  website: number;
  saves: number;
  spark: number[];
  reviewTrend: number[];
}

export interface PrayerTimes {
  date: string;
  hijri: string;
  times: { name: string; time: string }[];
  nextIndex: number;
}

export interface Mosque {
  id: string;
  name: string;
  area: string;
  region: "Central" | "East" | "North-East" | "North" | "West";
  dist?: string;
  coords: LatLng;
}

export interface EventTier {
  name: string;
  price: number;
  perks: string;
}

/** How attendees are seated/grouped. Surfaced as a badge + filter. */
export type GenderArrangement = "mixed" | "segregated" | "sisters" | "brothers";

export interface EventItem {
  id: string;
  slug?: string;
  title: string;
  catId: string;
  cat: string;
  img: string;
  tone: string;
  free: boolean;
  priceFrom: number;
  tiers?: EventTier[];
  dateLabel: string;
  timeLabel: string;
  dateISO: string;
  /** Optional event end time (HH:MM, 24h) — used for prayer-overlap detection. */
  endTime?: string;
  multiDay?: string;
  venue: string;
  area: string;
  /** Venue coordinates — powers the nearest-mosque + prayer-aware features. */
  venueCoords?: LatLng;
  capacity: number;
  taken: number;
  rsvp?: boolean;
  organiserId: string | null;
  organiser: string;
  organiserBiz: boolean;
  blurb: string;
  tags: string[];
  prayerNearby: boolean;
  halalCatering: boolean;
  featured: boolean;
  attendees: number;
  soldOut?: boolean;
  // ── Islamic / Muslim-first layer ──────────────────────────────────────────
  /** Attendee gender arrangement (mixed/segregated/sisters/brothers). */
  genderArrangement?: GenderArrangement;
  /** Free-text seating note, e.g. "Sisters on level 2, brothers on level 1". */
  seatingNote?: string;
  /** Organiser note about the prayer arrangement at/near the venue. */
  prayerSlotNote?: string;
  /** Whether a charity event accepts zakat/sadaqah donations (distinct from tickets). */
  donationEnabled?: boolean;
  /** Running total raised (cents) — real figure only; never fabricated. */
  donationRaisedCents?: number;
  /** Organiser refund policy label, e.g. "Flexible — full refund up to 48h before". */
  refundPolicy?: string;
  /** When true, RSVPs are join requests the organiser approves before confirming. */
  requiresApproval?: boolean;
  /** Who pays the booking fee: buyer on top ("pass", default) or organiser ("absorb"). */
  feeMode?: "pass" | "absorb";
}

export interface Ticket {
  eventId: string;
  tier: string;
  qty: number;
  ref: string;
  status: string;
}

export interface Tweaks {
  hero: string;
  heading: string;
  badge: string;
  card: string;
  accent: string;
  radius: number;
}

export interface UserState {
  loggedIn: boolean;
  role: "user" | "owner";
  name: string;
}

export type Lang = "en" | "ms";

export interface Prefs {
  onboarded: boolean;
  homeArea: string;
  certifiedOnly: boolean;
  prayerHidden?: boolean;
  lang?: Lang;
  ramadan?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  ids: string[];
}
