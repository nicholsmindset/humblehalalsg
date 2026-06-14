/* Humble Halal — mock data (ported from data.jsx) */
import type {
  Analytics,
  Area,
  BadgeKey,
  BadgeMetaEntry,
  Category,
  Listing,
  Mosque,
  Outlet,
  PrayerInfo,
  PrayerTimes,
  Review,
  VerifyInfo,
} from "./types";
import { eventCats, events, myTickets, spotsLeft } from "./events-data";
import { slugify } from "./slug";
import { deriveWeekHours } from "./hours";

export const categories: Category[] = [
  { id: "restaurants", label: "Restaurants", icon: "utensils" },
  { id: "cafes", label: "Cafés", icon: "coffee" },
  { id: "muslim-owned", label: "Muslim-Owned", icon: "store" },
  { id: "groceries", label: "Groceries", icon: "basket" },
  { id: "beauty", label: "Beauty", icon: "sparkles" },
  { id: "health", label: "Health & Medical", icon: "shield" },
  { id: "fashion", label: "Modest Fashion", icon: "store" },
  { id: "services", label: "Home Services", icon: "wrench" },
  { id: "automotive", label: "Automotive", icon: "wrench" },
  { id: "weddings", label: "Weddings", icon: "heart" },
  { id: "education", label: "Education", icon: "family" },
  { id: "professional", label: "Professional", icon: "building" },
  { id: "travel", label: "Travel & Umrah", icon: "globe" },
  { id: "mosques", label: "Mosques Nearby", icon: "mosque" },
  { id: "family", label: "Family Friendly", icon: "family" },
];

export const areas: Area[] = [
  { id: "tampines", name: "Tampines", count: 86, tone: "emerald", coords: { lat: 1.3530, lng: 103.9450 } },
  { id: "bugis", name: "Bugis", count: 124, tone: "gold", coords: { lat: 1.3009, lng: 103.8559 } },
  { id: "bedok", name: "Bedok", count: 73, tone: "emerald", coords: { lat: 1.3240, lng: 103.9300 } },
  { id: "geylang", name: "Geylang Serai", count: 152, tone: "gold", coords: { lat: 1.3176, lng: 103.8980 } },
  { id: "jurong", name: "Jurong", count: 64, tone: "emerald", coords: { lat: 1.3329, lng: 103.7436 } },
  { id: "paya-lebar", name: "Paya Lebar", count: 91, tone: "gold", coords: { lat: 1.3177, lng: 103.8920 } },
];

// Singapore's geographic centre — default map view.
export const SG_CENTER = { lat: 1.3521, lng: 103.8198 };

// badge keys: muis, admin, owned, friendly, nopork, pending
export const listings: Listing[] = [
  {
    id: "l1", name: "Warung Bumbu Rempah", cat: "Restaurants", catId: "restaurants",
    cuisine: "Indonesian · Nasi Padang", area: "Tampines", price: "$$",
    rating: 4.8, reviews: 312, badges: ["muis", "owned", "family"],
    blurb: "Slow-cooked rendang and sambal goreng in a cosy heartland corner.",
    img: "nasi padang spread", tone: "gold", open: true, distance: "0.4 km",
    prayer: true, delivery: true, featured: true,
    hours: "Open · closes 9:30 PM",
    phone: "+65 6123 4567", wa: "+65 9123 4567", ig: "@bumburempah.sg", web: "bumburempah.sg",
    address: "Blk 201 Tampines St 21, #01-1123, S521201",
    tags: ["Halal-certified", "Dine-in", "Prayer space", "Family friendly"],
  },
  {
    id: "l2", name: "Qahwa & Co.", cat: "Cafés", catId: "cafes",
    cuisine: "Specialty Coffee · Brunch", area: "Bugis", price: "$$",
    rating: 4.6, reviews: 184, badges: ["admin", "owned"],
    blurb: "Single-origin pour-overs and kunafa cheesecake in a sunlit shophouse.",
    img: "latte art & pastries", tone: "gold", open: true, distance: "1.2 km",
    prayer: false, delivery: true, featured: true,
    hours: "Open · closes 10:00 PM",
    phone: "+65 6222 1188", wa: "+65 9222 1188", ig: "@qahwa.co", web: "qahwa.co",
    address: "42 Haji Lane, #01-00, S189226",
    tags: ["Muslim-owned", "Brunch", "Wifi", "Outdoor seating"],
  },
  {
    id: "l3", name: "Tok Tok Mee Pok House", cat: "Restaurants", catId: "restaurants",
    cuisine: "Local · Noodles", area: "Bedok", price: "$",
    rating: 4.4, reviews: 96, badges: ["nopork", "friendly"],
    blurb: "Springy mee pok with house chilli — self-declared no pork, no lard.",
    img: "bowl of mee pok", tone: "emerald", open: false, distance: "2.6 km",
    prayer: false, delivery: false, featured: false,
    hours: "Closed · opens 7:00 AM",
    phone: "+65 6333 9090", wa: "", ig: "@toktokmeepok", web: "",
    address: "Blk 16 Bedok South Rd, #01-22, S460016",
    tags: ["No pork no lard", "Hawker", "Cash only"],
  },
  {
    id: "l4", name: "Rumah Tenun Beauty Bar", cat: "Beauty", catId: "beauty",
    cuisine: "Beauty · Muslimah Salon", area: "Geylang Serai", price: "$$$",
    rating: 4.9, reviews: 207, badges: ["admin", "owned", "family"],
    blurb: "Private muslimah salon — hair, facials and bridal in a calm setting.",
    img: "salon interior", tone: "gold", open: true, distance: "3.1 km",
    prayer: true, delivery: false, featured: true,
    hours: "Open · closes 8:00 PM",
    phone: "+65 6444 7711", wa: "+65 9444 7711", ig: "@rumahtenun.beauty", web: "rumahtenun.sg",
    address: "1 Geylang Serai, Wisma Geylang #03-12, S402001",
    tags: ["Muslim-owned", "Private rooms", "By appointment"],
  },
  {
    id: "l5", name: "Barakah Mart", cat: "Groceries", catId: "groceries",
    cuisine: "Grocery · Halal Butcher", area: "Jurong", price: "$$",
    rating: 4.3, reviews: 58, badges: ["muis", "owned"],
    blurb: "Fresh halal meat, frozen goods and pantry staples for the family.",
    img: "grocery aisle", tone: "emerald", open: true, distance: "5.4 km",
    prayer: false, delivery: true, featured: false,
    hours: "Open · closes 11:00 PM",
    phone: "+65 6555 2323", wa: "+65 9555 2323", ig: "@barakahmart", web: "barakahmart.sg",
    address: "Blk 505 Jurong West St 52, #01-08, S640505",
    tags: ["Halal-certified butcher", "Delivery", "Open late"],
  },
  {
    id: "l6", name: "Salim & Sons Aircon", cat: "Services", catId: "services",
    cuisine: "Home Services · Aircon", area: "Paya Lebar", price: "$$",
    rating: 4.7, reviews: 141, badges: ["owned", "friendly"],
    blurb: "Family-run aircon servicing and repair, trusted across the east.",
    img: "technician at work", tone: "emerald", open: true, distance: "4.0 km",
    prayer: false, delivery: false, featured: false,
    hours: "Open · closes 6:00 PM",
    phone: "+65 6777 4545", wa: "+65 9777 4545", ig: "", web: "salimandsons.sg",
    address: "8 Paya Lebar Rd, #05-01, S409051",
    tags: ["Muslim-owned", "On-site", "Warranty"],
  },
  {
    id: "l7", name: "Dapur Nenek", cat: "Restaurants", catId: "restaurants",
    cuisine: "Malay · Heritage", area: "Geylang Serai", price: "$$",
    rating: 4.5, reviews: 263, badges: ["muis", "family"],
    blurb: "Grandmother-recipe ayam masak merah and sayur lodeh, daily fresh.",
    img: "malay rice set", tone: "gold", open: true, distance: "3.4 km",
    prayer: true, delivery: true, featured: false,
    hours: "Open · closes 9:00 PM",
    phone: "+65 6888 1212", wa: "+65 9888 1212", ig: "@dapurnenek.sg", web: "",
    address: "Geylang Serai Market #02-140, S402001",
    tags: ["Halal-certified", "Prayer space", "Family friendly"],
  },
  {
    id: "l8", name: "The Modest Thread", cat: "Muslim-Owned", catId: "muslim-owned",
    cuisine: "Retail · Modest Fashion", area: "Bugis", price: "$$$",
    rating: 4.6, reviews: 89, badges: ["admin", "owned"],
    blurb: "Contemporary modestwear and hijabs, ethically made in small batches.",
    img: "boutique rack", tone: "gold", open: true, distance: "1.6 km",
    prayer: false, delivery: true, featured: false,
    hours: "Open · closes 9:00 PM",
    phone: "+65 6999 3434", wa: "+65 9999 3434", ig: "@modestthread", web: "modestthread.co",
    address: "Bugis Junction #02-18, S188021",
    tags: ["Muslim-owned", "Retail", "Fitting rooms"],
  },
  {
    id: "l9", name: "Kopi & Kueh Corner", cat: "Cafés", catId: "cafes",
    cuisine: "Café · Traditional Kueh", area: "Tampines", price: "$",
    rating: 4.2, reviews: 47, badges: ["pending"],
    blurb: "Nyonya kueh and kopi — verification documents under review.",
    img: "tray of kueh", tone: "gold", open: true, distance: "0.9 km",
    prayer: false, delivery: false, featured: false,
    hours: "Open · closes 7:00 PM",
    phone: "+65 6121 7878", wa: "", ig: "@kopikueh", web: "",
    address: "Tampines Mall #B1-22, S529510",
    tags: ["Pending verification", "Café"],
  },
  {
    id: "l10", name: "Madinah Spice Kitchen", cat: "Restaurants", catId: "restaurants",
    cuisine: "North Indian · Biryani", area: "Bedok", price: "$$",
    rating: 4.7, reviews: 198, badges: ["muis", "owned", "family"],
    blurb: "Dum biryani and tandoori, generous portions for the whole table.",
    img: "biryani platter", tone: "gold", open: true, distance: "2.1 km",
    prayer: true, delivery: true, featured: true,
    hours: "Open · closes 10:30 PM",
    phone: "+65 6234 5656", wa: "+65 9234 5656", ig: "@madinahspice", web: "madinahspice.sg",
    address: "Blk 58 New Upper Changi Rd, #01-1382, S461058",
    tags: ["Halal-certified", "Prayer space", "Family friendly", "Delivery"],
  },
];

export const reviews: Review[] = [
  { id: "r1", name: "Aisyah R.", avatar: "AR", rating: 5, date: "2 weeks ago", text: "The rendang here is the real deal — tender, rich and not too sweet. Prayer space was clean and the staff were so warm.", helpful: 24 },
  { id: "r2", name: "Faizal M.", avatar: "FM", rating: 5, date: "1 month ago", text: "Came with the whole family on a Sunday. Quick service even when busy, and the kids menu was a nice touch.", helpful: 11 },
  { id: "r3", name: "Nadia K.", avatar: "NK", rating: 4, date: "1 month ago", text: "Lovely flavours, portions are generous. Only wish parking was easier on weekends.", helpful: 6 },
];

export const badgeMeta: Record<BadgeKey, BadgeMetaEntry> = {
  muis: { key: "muis", cls: "badge--muis", label: "MUIS Certified", icon: "shield-check", tier: "certified" },
  admin: { key: "admin", cls: "badge--admin", label: "Admin Verified", icon: "badge-check", tier: "certified" },
  owned: { key: "owned", cls: "badge--owned", label: "Muslim-Owned", icon: "crescent", tier: "verified" },
  friendly: { key: "friendly", cls: "badge--friendly", label: "Halal-Friendly", icon: "info", tier: "declared" },
  nopork: { key: "nopork", cls: "badge--nopork", label: "No Pork No Lard", icon: "info", tier: "declared" },
  pending: { key: "pending", cls: "badge--pending", label: "Pending Verification", icon: "clock", tier: "pending" },
  family: { key: "family", cls: "badge--owned", label: "Family Friendly", icon: "family", tier: "feature" },
  prayer: { key: "prayer", cls: "badge--owned", label: "Prayer Space", icon: "mosque", tier: "feature" },
};

// Owner dashboard analytics (last 30 days)
export const analytics: Analytics = {
  views: 4820, calls: 318, whatsapp: 642, directions: 511, website: 207, saves: 389,
  spark: [12, 18, 15, 22, 26, 24, 31, 28, 35, 33, 40, 38, 44, 42, 49, 46, 52, 55, 51, 58, 62, 59, 66, 71, 68, 74, 79, 76, 83, 88],
  reviewTrend: [4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8],
};

// ---- Real photo wiring (Unsplash, confirmed-loading IDs) ----
export const IMG = (id: string) =>
  "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=900&q=70";
export const PIC: Record<string, string> = {
  nasipadang: "1565557623262-b51c2513a641", malayrice: "1604908176997-125f25cc6f3d", biryani: "1563379091339-03b21ab4a4f8",
  spread: "1504674900247-0877df9cc836", curry: "1631292784640-2b24be784d5d", meepok: "1569718212165-3a8278d5f624",
  coffee: "1554118811-1e0d58224f24", latte: "1517248135467-4c7edcad34c4", cafe: "1559339352-11d035aa65de",
  grocery: "1601050690597-df0568f70950", butcher: "1604503468506-a8da13d82791", salon: "1560066984-138dadb4c035",
  beauty: "1487412947147-5cebf100ffc2", boutique: "1441986300917-64674bd600d8", fashion: "1490481651871-ab68de25d43d",
  tech: "1621905251918-48416bd8575a", interior: "1414235077428-338989a2e8c0", sgstreet: "1565967511849-76a60a516170",
  shophouse: "1555921015-5532091f6026",
};
const listingImg: Record<string, string> = {
  l1: "nasipadang", l2: "cafe", l3: "meepok", l4: "salon", l5: "butcher",
  l6: "tech", l7: "spread", l8: "boutique", l9: "coffee", l10: "biryani",
};

/* ---- Bulk directory: more SG halal/Muslim-owned businesses across every
   category. Deterministic (no Math.random) so SSR and client render identically. */
const AREA_POINTS: Record<string, { lat: number; lng: number }> = {
  Tampines: { lat: 1.353, lng: 103.945 }, Bugis: { lat: 1.3009, lng: 103.8559 },
  Bedok: { lat: 1.324, lng: 103.93 }, "Geylang Serai": { lat: 1.3176, lng: 103.898 },
  Jurong: { lat: 1.3329, lng: 103.7436 }, "Paya Lebar": { lat: 1.3177, lng: 103.892 },
  Woodlands: { lat: 1.4382, lng: 103.789 }, Hougang: { lat: 1.3712, lng: 103.8926 },
  "Pasir Ris": { lat: 1.3721, lng: 103.9493 }, Yishun: { lat: 1.4304, lng: 103.835 },
};
const CAT_PIC: Record<string, string[]> = {
  restaurants: ["nasipadang", "biryani", "malayrice", "spread", "curry", "meepok"],
  cafes: ["cafe", "latte", "coffee"],
  groceries: ["grocery", "butcher"],
  beauty: ["salon", "beauty"],
  health: ["interior", "beauty"],
  fashion: ["boutique", "fashion"],
  services: ["tech", "interior"],
  automotive: ["tech"],
  weddings: ["beauty", "fashion"],
  education: ["interior", "shophouse"],
  professional: ["interior", "shophouse"],
  travel: ["sgstreet", "shophouse"],
};
type B = BadgeKey;
interface Spec { n: string; c: string; a: string; cu: string; p: string; b: B[]; bl: string; f?: boolean; t?: string[] }
const MORE: Spec[] = [
  { n: "Hjh Maimunah Restaurant", c: "restaurants", a: "Bugis", cu: "Malay · Nasi Padang", p: "$$", b: ["muis", "owned", "family"], bl: "Beloved Kampong Glam institution piling plates with rich, home-style Malay dishes.", f: true, t: ["Halal-certified", "Dine-in", "Prayer space"] },
  { n: "Sabar Menanti", c: "restaurants", a: "Geylang Serai", cu: "Indonesian · Nasi Padang", p: "$", b: ["muis", "owned"], bl: "Heritage nasi padang stall serving the same recipes since the 1960s." },
  { n: "Springleaf Prata Place", c: "restaurants", a: "Hougang", cu: "Indian-Muslim · Prata", p: "$", b: ["muis", "family"], bl: "Crispy prata and murtabak, plus inventive specials the whole family loves." },
  { n: "Mr Biryani SG", c: "restaurants", a: "Jurong", cu: "North Indian · Biryani", p: "$$", b: ["muis", "owned"], bl: "Fragrant dum biryani in generous portions, cooked to order." },
  { n: "Beirut Grill", c: "restaurants", a: "Bugis", cu: "Middle Eastern · Lebanese", p: "$$$", b: ["admin", "owned"], bl: "Shawarma, mezze and charcoal grills in a cosy Arab Street corner." },
  { n: "Seoul Halal Kitchen", c: "restaurants", a: "Tampines", cu: "Korean · Halal", p: "$$", b: ["admin", "owned", "family"], bl: "Halal Korean fried chicken, army stew and bibimbap done right." },
  { n: "The Halal Wagyu Co.", c: "restaurants", a: "Paya Lebar", cu: "Western · Steakhouse", p: "$$$", b: ["muis", "owned"], bl: "Premium halal wagyu grills and smash burgers in a smart-casual setting." },
  { n: "Warong Nasi Pariaman", c: "restaurants", a: "Bedok", cu: "Minang · Nasi Padang", p: "$", b: ["muis"], bl: "One of Singapore's oldest Minang stalls — fiery rendang and gulai." },
  { n: "Tasty Thai Halal", c: "restaurants", a: "Woodlands", cu: "Thai · Halal", p: "$$", b: ["admin", "owned"], bl: "Tom yum, green curry and mango sticky rice, all halal-friendly." },
  { n: "Fish & Co. (Halal)", c: "restaurants", a: "Pasir Ris", cu: "Seafood · Western", p: "$$", b: ["muis", "family"], bl: "Seafood platters and pasta in a family-friendly halal-certified chain." },
  { n: "Salam Cafe & Bistro", c: "cafes", a: "Geylang Serai", cu: "Café · Brunch", p: "$$", b: ["admin", "owned"], bl: "All-day brunch, kunafa lattes and a calm Muslim-owned space.", f: true },
  { n: "The Coffee Crescent", c: "cafes", a: "Bugis", cu: "Specialty Coffee", p: "$$", b: ["admin", "owned"], bl: "Single-origin pour-overs and house-baked pastries near Haji Lane." },
  { n: "Kopi & Kueh Tradisi", c: "cafes", a: "Tampines", cu: "Café · Nyonya Kueh", p: "$", b: ["friendly", "family"], bl: "Traditional kueh and kopi — self-declared no pork, no lard." },
  { n: "Selera Rasa Coffee", c: "cafes", a: "Yishun", cu: "Café · Local", p: "$", b: ["nopork"], bl: "Neighbourhood kopitiam vibes with halal-friendly toast sets." },
  { n: "Matcha & Madu", c: "cafes", a: "Paya Lebar", cu: "Café · Dessert", p: "$$", b: ["admin", "owned", "family"], bl: "Matcha, honey cakes and a cosy nook for catch-ups." },
  { n: "Barakah Halal Mart", c: "groceries", a: "Woodlands", cu: "Grocery · Halal Butcher", p: "$$", b: ["muis", "owned"], bl: "Fresh halal meat, frozen goods and pantry staples for the family." },
  { n: "Geylang Serai Wet Market", c: "groceries", a: "Geylang Serai", cu: "Market · Fresh Produce", p: "$", b: ["muis", "family"], bl: "Spices, fresh halal meat and festive goods at the heart of the east." },
  { n: "Al-Barakah Frozen", c: "groceries", a: "Jurong", cu: "Frozen · Wholesale", p: "$$", b: ["muis"], bl: "Halal frozen meats, nuggets and party platters in bulk." },
  { n: "Dates & Honey House", c: "groceries", a: "Bugis", cu: "Specialty · Dates", p: "$$", b: ["owned", "friendly"], bl: "Premium Ajwa dates, raw honey and zamzam for the season." },
  { n: "Rumi Modest Beauty", c: "beauty", a: "Tampines", cu: "Muslimah Salon", p: "$$$", b: ["admin", "owned", "family"], bl: "Private muslimah salon — hair, facials and bridal in a calm setting.", f: true },
  { n: "Aisha Spa & Hammam", c: "beauty", a: "Bugis", cu: "Spa · Hammam", p: "$$$", b: ["owned"], bl: "Women-only Moroccan hammam, massage and skincare rituals." },
  { n: "The Modest Glow", c: "beauty", a: "Bedok", cu: "Beauty · Skincare", p: "$$", b: ["owned", "friendly"], bl: "Halal-certified facials and brow artistry by appointment." },
  { n: "Barber Bros SG", c: "beauty", a: "Hougang", cu: "Barber · Grooming", p: "$", b: ["owned"], bl: "Sharp fades and beard grooming, Muslim-owned and proud." },
  { n: "Nadia Nails Studio", c: "beauty", a: "Paya Lebar", cu: "Nails · Lashes", p: "$$", b: ["owned", "friendly"], bl: "Breathable halal-friendly polish in a private women-only studio." },
  { n: "Crescent Family Clinic", c: "health", a: "Tampines", cu: "Clinic · GP", p: "$$", b: ["owned", "family"], bl: "Muslim-owned GP clinic with female doctors on request." },
  { n: "Shifa TCM & Bekam", c: "health", a: "Geylang Serai", cu: "Wellness · Cupping", p: "$$", b: ["owned"], bl: "Sunnah cupping (bekam) and traditional wellness therapies." },
  { n: "Noor Dental Care", c: "health", a: "Jurong", cu: "Dental", p: "$$$", b: ["owned"], bl: "Gentle family dentistry with a calm, modest-friendly clinic." },
  { n: "Mama's Confinement", c: "health", a: "Pasir Ris", cu: "Maternity · Confinement", p: "$$$", b: ["owned", "family"], bl: "Halal confinement meals and postnatal care for new mums." },
  { n: "FitMuslimah Studio", c: "health", a: "Woodlands", cu: "Fitness · Women-only", p: "$$", b: ["owned", "family"], bl: "Women-only gym and classes in a private, modest environment." },
  { n: "Aafiyah Pharmacy", c: "health", a: "Bedok", cu: "Pharmacy", p: "$", b: ["owned"], bl: "Halal supplements, skincare and prescriptions, advice in Malay & English." },
  { n: "Hijab House SG", c: "fashion", a: "Bugis", cu: "Modest Fashion · Hijab", p: "$$", b: ["admin", "owned"], bl: "Contemporary hijabs and modestwear, ethically made in small batches.", f: true },
  { n: "Anggun Bridal & Abaya", c: "fashion", a: "Geylang Serai", cu: "Abaya · Jubah", p: "$$$", b: ["owned"], bl: "Elegant abayas, jubah and baju kurung for every occasion." },
  { n: "Songket & Co.", c: "fashion", a: "Tampines", cu: "Traditional Wear", p: "$$$", b: ["owned", "family"], bl: "Handwoven songket, baju Melayu and festive sets." },
  { n: "Jahit Express Tailors", c: "fashion", a: "Hougang", cu: "Tailoring · Alterations", p: "$", b: ["owned"], bl: "Fast, reliable alterations and custom baju by master tailors." },
  { n: "Attar & Oud Gallery", c: "fashion", a: "Bugis", cu: "Perfume · Attar", p: "$$", b: ["owned", "friendly"], bl: "Alcohol-free attar, oud and bakhoor sourced from the Gulf." },
  { n: "Kopiah Corner", c: "fashion", a: "Yishun", cu: "Songkok · Kopiah", p: "$", b: ["owned"], bl: "Songkok, kopiah and prayer essentials for all ages." },
  { n: "CoolBreeze Aircon", c: "services", a: "Paya Lebar", cu: "Home Services · Aircon", p: "$$", b: ["owned", "friendly"], bl: "Family-run aircon servicing and repair, trusted across the east." },
  { n: "Bersih Cleaning Co.", c: "services", a: "Tampines", cu: "Cleaning · Pest", p: "$$", b: ["owned"], bl: "Home and office cleaning, disinfection and pest control." },
  { n: "Rumah Reno SG", c: "services", a: "Jurong", cu: "Renovation · Interior", p: "$$$", b: ["owned"], bl: "Full-home renovation and interior design with transparent quotes." },
  { n: "SwiftMove Movers", c: "services", a: "Woodlands", cu: "Movers · Logistics", p: "$$", b: ["owned", "friendly"], bl: "House and office moving, careful and on time." },
  { n: "Pak Man Handyman", c: "services", a: "Bedok", cu: "Plumbing · Electrical", p: "$", b: ["owned"], bl: "Trusted neighbourhood handyman — plumbing, lights and fixes." },
  { n: "Fresh Fold Laundry", c: "services", a: "Hougang", cu: "Laundry · Dry-clean", p: "$", b: ["owned", "friendly"], bl: "Wash, dry, fold and delicate dry-cleaning with pickup." },
  { n: "Salim & Sons Workshop", c: "automotive", a: "Paya Lebar", cu: "Car Workshop", p: "$$", b: ["owned", "friendly"], bl: "Honest car servicing and repair, Muslim-owned across two decades." },
  { n: "Gleam Auto Detailing", c: "automotive", a: "Jurong", cu: "Detailing · Grooming", p: "$$", b: ["owned"], bl: "Ceramic coating and interior detailing that brings cars back to new." },
  { n: "Halal Rides Rental", c: "automotive", a: "Tampines", cu: "Car Rental", p: "$$", b: ["owned", "friendly"], bl: "Affordable car rental for families, weddings and Umrah send-offs." },
  { n: "EastCoast Motors", c: "automotive", a: "Bedok", cu: "Used Car Dealer", p: "$$$", b: ["owned"], bl: "Quality pre-owned cars with honest, no-pressure advice." },
  { n: "Nikah Bliss Planners", c: "weddings", a: "Geylang Serai", cu: "Wedding Planning", p: "$$$", b: ["owned", "family"], bl: "Full Malay-Muslim wedding planning from akad to sanding.", f: true },
  { n: "Henna by Hana", c: "weddings", a: "Tampines", cu: "Bridal · Henna", p: "$$", b: ["owned"], bl: "Intricate bridal henna and inai for your big day." },
  { n: "Cahaya Photography", c: "weddings", a: "Bugis", cu: "Photo · Videography", p: "$$$", b: ["owned"], bl: "Timeless wedding photography and cinematic videography." },
  { n: "Hantaran Deco Studio", c: "weddings", a: "Woodlands", cu: "Hantaran · Deco", p: "$$", b: ["owned", "family"], bl: "Gorgeous hantaran trays, dais deco and kompang troupes." },
  { n: "Bloom & Barakah Florist", c: "weddings", a: "Paya Lebar", cu: "Florist", p: "$$", b: ["owned"], bl: "Fresh bridal bouquets, car deco and event florals." },
  { n: "Iqra Learning Centre", c: "education", a: "Tampines", cu: "Quran · Tahfiz", p: "$$", b: ["owned", "family"], bl: "Quran, tajweed and tahfiz classes for kids and adults." },
  { n: "Little Khalifah Preschool", c: "education", a: "Jurong", cu: "Childcare · Preschool", p: "$$$", b: ["owned", "family"], bl: "Islamic-values preschool with a nurturing, bilingual curriculum." },
  { n: "Cemerlang Tuition", c: "education", a: "Bedok", cu: "Tuition · Enrichment", p: "$$", b: ["owned"], bl: "PSLE and O-Level tuition by experienced MOE-trained tutors." },
  { n: "Madrasah Al-Irsyad Annex", c: "education", a: "Geylang Serai", cu: "Islamic Education", p: "$", b: ["owned", "family"], bl: "Weekend Islamic studies and Arabic for young learners." },
  { n: "SkillUp Academy", c: "education", a: "Hougang", cu: "Vocational · Skills", p: "$$", b: ["owned"], bl: "Practical baking, barista and digital-skills courses." },
  { n: "Amanah Accounting", c: "professional", a: "Paya Lebar", cu: "Accounting · Tax", p: "$$$", b: ["owned"], bl: "Bookkeeping, GST and corporate tax for SMEs and home businesses." },
  { n: "Adil Law Chambers", c: "professional", a: "Bugis", cu: "Legal · Syariah", p: "$$$", b: ["owned"], bl: "Family, Syariah and conveyancing matters handled with care." },
  { n: "Takaful Advisory SG", c: "professional", a: "Tampines", cu: "Takaful · Insurance", p: "$$", b: ["owned", "friendly"], bl: "Shariah-compliant insurance and financial planning." },
  { n: "Studio Dakwah Creative", c: "professional", a: "Jurong", cu: "Marketing · Design", p: "$$", b: ["owned"], bl: "Branding, web and social media for Muslim-owned businesses." },
  { n: "Andalus Travel & Umrah", c: "travel", a: "Geylang Serai", cu: "Umrah · Hajj", p: "$$$", b: ["muis", "owned", "family"], bl: "Trusted Umrah and Hajj packages with experienced mutawwif.", f: true },
  { n: "Barakah Holidays", c: "travel", a: "Bugis", cu: "Muslim-friendly Travel", p: "$$", b: ["owned"], bl: "Halal-friendly tours with prayer-aware itineraries worldwide." },
  { n: "Safar Tours SG", c: "travel", a: "Woodlands", cu: "Tours · Guides", p: "$$", b: ["owned", "friendly"], bl: "Curated halal travel and local heritage walks." },
];
const catLabelOf = (id: string) => categories.find((c) => c.id === id)?.label || id;
MORE.forEach((sp, i) => {
  const idx = 11 + i;
  const pics = CAT_PIC[sp.c] || ["spread"];
  const pic = pics[i % pics.length];
  const ap = AREA_POINTS[sp.a] || { lat: 1.3521, lng: 103.8198 };
  const open = idx % 9 !== 0;
  listings.push({
    id: `l${idx}`,
    name: sp.n, cat: catLabelOf(sp.c), catId: sp.c, cuisine: sp.cu, area: sp.a, price: sp.p,
    rating: Math.round((4.2 + ((idx * 7) % 8) / 10) * 10) / 10,
    reviews: 18 + ((idx * 37) % 300),
    badges: sp.b,
    blurb: sp.bl,
    img: sp.cu.toLowerCase(),
    tone: (["gold", "emerald", "cream"] as const)[idx % 3],
    open,
    distance: `${(0.4 + ((idx * 13) % 90) / 10).toFixed(1)} km`,
    prayer: sp.b.includes("prayer") || (sp.b.includes("muis") && idx % 2 === 0),
    delivery: ["restaurants", "cafes", "groceries"].includes(sp.c) && idx % 2 === 0,
    featured: !!sp.f,
    hours: open ? "Open · closes 9:30 PM" : "Closed · opens 9:00 AM",
    phone: `+65 6${String(100 + idx)} ${String(2000 + ((idx * 17) % 7000)).slice(0, 4)}`,
    wa: idx % 2 === 0 ? `+65 9${String(100 + idx)} ${String(3000 + ((idx * 13) % 6000)).slice(0, 4)}` : "",
    ig: `@${slugify(sp.n).replace(/-/g, "").slice(0, 18)}`,
    web: idx % 2 === 0 ? `${slugify(sp.n).slice(0, 16)}.sg` : "",
    address: `Blk ${100 + idx} ${sp.a}, Singapore`,
    tags: sp.t || [(sp.cu.split("·").slice(-1)[0] || sp.cu).trim()],
    image: IMG(PIC[pic] || PIC.spread),
    coords: { lat: ap.lat + ((idx % 5) - 2) * 0.004, lng: ap.lng + (((idx * 3) % 5) - 2) * 0.004 },
  });
});

listings.forEach((l, i) => {
  l.image = l.image || IMG(PIC[listingImg[l.id]] || "spread");
  // structured weekly hours (category-shaped, deterministic) for real "open now"
  l.hoursWeek = l.hoursWeek || deriveWeekHours(l.catId, i);
});
// gallery + collage + area imagery
const galleryKeys = ["interior", "spread", "curry", "beauty", "latte", "butcher"];
export const gallery = galleryKeys.map((k) => IMG(PIC[k]));
export const collage = [IMG(PIC.nasipadang), IMG(PIC.cafe), IMG(PIC.sgstreet)];
const areaImg: Record<string, string> = {
  tampines: "shophouse", bugis: "sgstreet", bedok: "shophouse", geylang: "sgstreet", jurong: "interior", "paya-lebar": "sgstreet",
};
areas.forEach((a) => {
  a.image = IMG(PIC[areaImg[a.id] || "sgstreet"]);
});

// ---- Verification provenance + community confirmation + prayer detail ----
const certBodies: Record<string, string> = { muis: "MUIS", admin: "Humble Halal" };
const verifyData: Record<string, VerifyInfo> = {
  l1: { certNo: "MUIS-2891-2024", verified: "18 days ago", expires: "Dec 2026", confirms: 142, renewed: true },
  l2: { certNo: "HH-AV-0412", verified: "6 days ago", expires: "Jun 2027", confirms: 88, renewed: true },
  l3: { certNo: null, verified: null, expires: null, confirms: 37, renewed: false },
  l4: { certNo: "HH-AV-0288", verified: "3 days ago", expires: "May 2027", confirms: 119, renewed: true },
  l5: { certNo: "MUIS-1043-2025", verified: "31 days ago", expires: "Mar 2026", confirms: 54, renewed: false, expiringSoon: true },
  l6: { certNo: null, verified: "2 months ago", expires: null, confirms: 96, renewed: false },
  l7: { certNo: "MUIS-3320-2024", verified: "12 days ago", expires: "Nov 2026", confirms: 203, renewed: true },
  l8: { certNo: "HH-AV-0501", verified: "9 days ago", expires: "Jul 2027", confirms: 61, renewed: true },
  l9: { certNo: null, verified: null, expires: null, confirms: 12, renewed: false },
  l10: { certNo: "MUIS-2055-2025", verified: "5 days ago", expires: "Aug 2027", confirms: 168, renewed: true },
};
const prayerDetail: Record<string, PrayerInfo> = {
  l1: { has: true, gender: "Separate male & female", wudhu: true, capacity: "~12 pax", note: "Mats provided · qiblat marked" },
  l4: { has: true, gender: "Female-friendly private room", wudhu: true, capacity: "~4 pax", note: "Quiet room available on request" },
  l7: { has: true, gender: "Separate male & female", wudhu: true, capacity: "~20 pax", note: "Located beside the market surau" },
  l10: { has: true, gender: "Shared space", wudhu: true, capacity: "~8 pax", note: "Mats & telekung provided" },
};
// ---- Franchise / multi-location storefronts ----
const franchiseData: Record<string, { brand: string; hq: string; outlets: Outlet[] }> = {
  l5: {
    brand: "Barakah Mart",
    hq: "Jurong West",
    outlets: [
      { id: "o1", name: "Jurong West (HQ)", area: "Jurong", address: "Blk 505 Jurong West St 52, #01-08, S640505", hours: "8:00 AM – 11:00 PM", open: true, distance: "5.4 km", certNo: "MUIS-1043-2025", flagship: true },
      { id: "o2", name: "Tampines Hub", area: "Tampines", address: "1 Tampines Walk, #02-14, S528523", hours: "9:00 AM – 10:00 PM", open: true, distance: "0.6 km", certNo: "MUIS-1044-2025" },
      { id: "o3", name: "Bedok Mall", area: "Bedok", address: "311 New Upper Changi Rd, #B2-30, S467360", hours: "10:00 AM – 10:00 PM", open: true, distance: "2.3 km", certNo: "MUIS-1045-2025" },
      { id: "o4", name: "Woodlands Causeway", area: "Woodlands", address: "1 Woodlands Sq, #03-02, S738099", hours: "9:00 AM – 9:00 PM", open: false, distance: "14 km", certNo: "MUIS-1046-2025" },
    ],
  },
  l10: {
    brand: "Madinah Spice Kitchen",
    hq: "Bedok",
    outlets: [
      { id: "o1", name: "Bedok (Original)", area: "Bedok", address: "Blk 58 New Upper Changi Rd, #01-1382, S461058", hours: "11:00 AM – 10:30 PM", open: true, distance: "2.1 km", certNo: "MUIS-2055-2025", flagship: true },
      { id: "o2", name: "Tampines Central", area: "Tampines", address: "Blk 137 Tampines St 11, #01-22, S521137", hours: "11:00 AM – 10:00 PM", open: true, distance: "0.9 km", certNo: "MUIS-2056-2025" },
      { id: "o3", name: "Paya Lebar Quarter", area: "Paya Lebar", address: "10 Paya Lebar Rd, #02-18, S409057", hours: "11:30 AM – 9:30 PM", open: true, distance: "4.0 km", certNo: "MUIS-2057-2025" },
    ],
  },
};

// Approximate SG coordinates per listing (near their area, small offsets).
const listingCoords: Record<string, { lat: number; lng: number }> = {
  l1: { lat: 1.3536, lng: 103.9440 }, // Tampines
  l2: { lat: 1.3007, lng: 103.8595 }, // Bugis / Haji Lane
  l3: { lat: 1.3235, lng: 103.9320 }, // Bedok
  l4: { lat: 1.3180, lng: 103.8975 }, // Geylang Serai
  l5: { lat: 1.3400, lng: 103.7050 }, // Jurong West
  l6: { lat: 1.3170, lng: 103.8930 }, // Paya Lebar
  l7: { lat: 1.3170, lng: 103.8990 }, // Geylang Serai market
  l8: { lat: 1.2995, lng: 103.8550 }, // Bugis Junction
  l9: { lat: 1.3525, lng: 103.9445 }, // Tampines Mall
  l10: { lat: 1.3250, lng: 103.9295 }, // Bedok
};

listings.forEach((l) => {
  l.slug = slugify(l.name);
  l.coords = l.coords || listingCoords[l.id];
  const primary = l.badges.find((b) => ["muis", "admin"].includes(b));
  l.certified = !!primary;
  l.certBody = primary ? certBodies[primary] : null;
  l.verify = verifyData[l.id] || { certNo: null, verified: null, expires: null, confirms: 0, renewed: false };
  l.prayerInfo =
    prayerDetail[l.id] ||
    (l.prayer
      ? { has: true, gender: "Shared space", wudhu: true, capacity: "Limited", note: "Ask staff for directions" }
      : { has: false });
  l.statusChanged = l.id === "l9"; // recently changed / under review flag
  const f = franchiseData[l.id];
  l.franchise = !!f;
  l.outlets = f ? f.outlets : null;
  l.outletCount = f ? f.outlets.length : 1;
});

// ---- Prayer times (today, mock SG) + nearby mosques per area ----
export const prayerTimes: PrayerTimes = {
  date: "Today", hijri: "28 Dhul-Qi’dah 1447",
  times: [
    { name: "Subuh", time: "5:42" }, { name: "Syuruk", time: "7:05" }, { name: "Zohor", time: "1:08" },
    { name: "Asar", time: "4:32" }, { name: "Maghrib", time: "7:11" }, { name: "Isyak", time: "8:25" },
  ],
  nextIndex: 3, // Asar is next
};
// ~60 of Singapore's ~72 MUIS mosques, grouped by region. Coordinates are
// approximate (for map pin placement); the directory links open Google Maps by
// mosque name so directions resolve accurately regardless of coord precision.
export const mosques: Mosque[] = [
  // ---- Central ----
  { id: "m-sultan", name: "Masjid Sultan", area: "Kampong Glam", region: "Central", coords: { lat: 1.3025, lng: 103.859 } },
  { id: "m-malabar", name: "Masjid Malabar", area: "Kampong Glam", region: "Central", coords: { lat: 1.3045, lng: 103.862 } },
  { id: "m-hajjah-fatimah", name: "Masjid Hajjah Fatimah", area: "Beach Road", region: "Central", coords: { lat: 1.303, lng: 103.863 } },
  { id: "m-bencoolen", name: "Masjid Bencoolen", area: "Bencoolen", region: "Central", coords: { lat: 1.2985, lng: 103.851 } },
  { id: "m-abdul-gafoor", name: "Masjid Abdul Gafoor", area: "Little India", region: "Central", coords: { lat: 1.307, lng: 103.855 } },
  { id: "m-angullia", name: "Masjid Angullia", area: "Little India", region: "Central", coords: { lat: 1.308, lng: 103.856 } },
  { id: "m-tasek-utara", name: "Masjid Tasek Utara", area: "Farrer Park", region: "Central", coords: { lat: 1.312, lng: 103.854 } },
  { id: "m-jamae-chulia", name: "Masjid Jamae Chulia", area: "Chinatown", region: "Central", coords: { lat: 1.2835, lng: 103.846 } },
  { id: "m-al-abrar", name: "Masjid Al-Abrar", area: "Chinatown", region: "Central", coords: { lat: 1.282, lng: 103.846 } },
  { id: "m-omar-kampong-melaka", name: "Masjid Omar Kampong Melaka", area: "Clarke Quay", region: "Central", coords: { lat: 1.288, lng: 103.847 } },
  { id: "m-moulana", name: "Masjid Moulana Mohamed Ali", area: "Raffles Place", region: "Central", coords: { lat: 1.2845, lng: 103.851 } },
  { id: "m-al-falah", name: "Masjid Al-Falah", area: "Orchard", region: "Central", coords: { lat: 1.305, lng: 103.833 } },
  { id: "m-khadijah", name: "Masjid Khadijah", area: "Geylang", region: "Central", coords: { lat: 1.314, lng: 103.887 } },
  { id: "m-haji-mohd-salleh", name: "Masjid Haji Mohd Salleh", area: "Geylang", region: "Central", coords: { lat: 1.317, lng: 103.887 } },
  { id: "m-haji-muhammad-salleh", name: "Masjid Haji Muhammad Salleh", area: "Tanjong Pagar", region: "Central", coords: { lat: 1.275, lng: 103.842 } },
  { id: "m-abdul-hamid", name: "Masjid Abdul Hamid Kampung Pasiran", area: "Novena", region: "Central", coords: { lat: 1.323, lng: 103.843 } },
  { id: "m-ahmad", name: "Masjid Ahmad", area: "Pasir Panjang", region: "Central", coords: { lat: 1.274, lng: 103.789 } },
  { id: "m-burhani", name: "Masjid Burhani", area: "Hill Street", region: "Central", coords: { lat: 1.2915, lng: 103.848 } },
  { id: "m-omar-salmah", name: "Masjid Omar Salmah", area: "Balestier", region: "Central", coords: { lat: 1.328, lng: 103.846 } },
  { id: "m-jamiyah-ar-rabitah", name: "Masjid Jamiyah Ar-Rabitah", area: "Tiong Bahru", region: "Central", coords: { lat: 1.286, lng: 103.829 } },
  { id: "m-sallim-mattar", name: "Masjid Sallim Mattar", area: "MacPherson", region: "Central", coords: { lat: 1.327, lng: 103.883 } },
  { id: "m-muhajirin", name: "Masjid Muhajirin", area: "Toa Payoh", region: "Central", coords: { lat: 1.337, lng: 103.853 } },
  { id: "m-an-nahdhah", name: "Masjid An-Nahdhah", area: "Bishan", region: "Central", coords: { lat: 1.354, lng: 103.848 } },
  { id: "m-hajjah-rahimabi", name: "Masjid Hajjah Rahimabi Kebun Limau", area: "Balestier", region: "Central", coords: { lat: 1.327, lng: 103.846 } },
  { id: "m-baalwie", name: "Masjid Ba'alwie", area: "Bukit Timah", region: "Central", coords: { lat: 1.318, lng: 103.817 } },
  { id: "m-al-huda", name: "Masjid Al-Huda", area: "Bukit Timah", region: "Central", coords: { lat: 1.331, lng: 103.787 } },
  { id: "m-kampong-delta", name: "Masjid Kampong Delta", area: "Tiong Bahru", region: "Central", coords: { lat: 1.288, lng: 103.832 } },
  { id: "m-mujahidin", name: "Masjid Mujahidin", area: "Queenstown", region: "Central", coords: { lat: 1.296, lng: 103.803 } },
  { id: "m-hang-jebat", name: "Masjid Hang Jebat", area: "Queenstown", region: "Central", coords: { lat: 1.301, lng: 103.802 } },
  { id: "m-jamek-queenstown", name: "Masjid Jamek Queenstown", area: "Queenstown", region: "Central", coords: { lat: 1.294, lng: 103.806 } },
  { id: "m-temenggong", name: "Masjid Temenggong Daeng Ibrahim", area: "Telok Blangah", region: "Central", coords: { lat: 1.274, lng: 103.823 } },
  { id: "m-al-amin", name: "Masjid Al-Amin", area: "Telok Blangah", region: "Central", coords: { lat: 1.272, lng: 103.809 } },
  { id: "m-hussain-sulaiman", name: "Masjid Hussain Sulaiman", area: "Pasir Panjang", region: "Central", coords: { lat: 1.276, lng: 103.792 } },
  // ---- East ----
  { id: "m-darul-ghufran", name: "Masjid Darul Ghufran", area: "Tampines", region: "East", dist: "280 m", coords: { lat: 1.3527, lng: 103.942 } },
  { id: "m-al-istighfar", name: "Masjid Al-Istighfar", area: "Pasir Ris", region: "East", coords: { lat: 1.372, lng: 103.949 } },
  { id: "m-al-taqua", name: "Masjid Al-Taqua", area: "Bedok", region: "East", coords: { lat: 1.327, lng: 103.929 } },
  { id: "m-alkaff-kg-melayu", name: "Masjid Alkaff Kampung Melayu", area: "Bedok", region: "East", coords: { lat: 1.333, lng: 103.917 } },
  { id: "m-al-ansar", name: "Masjid Al-Ansar", area: "Bedok Reservoir", region: "East", coords: { lat: 1.336, lng: 103.918 } },
  { id: "m-kassim", name: "Masjid Kassim", area: "Kembangan", region: "East", coords: { lat: 1.321, lng: 103.913 } },
  { id: "m-abdul-aleem", name: "Masjid Abdul Aleem Siddique", area: "Telok Kurau", region: "East", coords: { lat: 1.314, lng: 103.913 } },
  { id: "m-darul-aman", name: "Masjid Darul Aman", area: "Eunos", region: "East", coords: { lat: 1.319, lng: 103.903 } },
  { id: "m-al-abdul-razak", name: "Masjid Al-Abdul Razak", area: "Eunos", region: "East", coords: { lat: 1.323, lng: 103.902 } },
  { id: "m-khalid", name: "Masjid Khalid", area: "Joo Chiat", region: "East", coords: { lat: 1.312, lng: 103.9 } },
  { id: "m-kampung-siglap", name: "Masjid Kampung Siglap", area: "Marine Parade", region: "East", coords: { lat: 1.311, lng: 103.93 } },
  { id: "m-mydin", name: "Masjid Mydin", area: "Eunos", region: "East", coords: { lat: 1.321, lng: 103.901 } },
  { id: "m-wak-tanjong", name: "Masjid Wak Tanjong", area: "Paya Lebar", region: "East", coords: { lat: 1.317, lng: 103.892 } },
  // ---- North-East ----
  { id: "m-al-muttaqin", name: "Masjid Al-Muttaqin", area: "Ang Mo Kio", region: "North-East", coords: { lat: 1.368, lng: 103.847 } },
  { id: "m-al-istiqamah", name: "Masjid Al-Istiqamah", area: "Serangoon", region: "North-East", coords: { lat: 1.357, lng: 103.873 } },
  { id: "m-en-naeem", name: "Masjid En-Naeem", area: "Kovan", region: "North-East", coords: { lat: 1.358, lng: 103.885 } },
  { id: "m-alkaff-upper-serangoon", name: "Masjid Alkaff Upper Serangoon", area: "Upper Serangoon", region: "North-East", coords: { lat: 1.371, lng: 103.896 } },
  { id: "m-haji-yusoff", name: "Masjid Haji Yusoff", area: "Upper Serangoon", region: "North-East", coords: { lat: 1.334, lng: 103.888 } },
  { id: "m-al-mawaddah", name: "Masjid Al-Mawaddah", area: "Sengkang", region: "North-East", coords: { lat: 1.392, lng: 103.895 } },
  { id: "m-al-islah", name: "Masjid Al-Islah", area: "Punggol", region: "North-East", coords: { lat: 1.403, lng: 103.909 } },
  // ---- North ----
  { id: "m-an-nur", name: "Masjid An-Nur", area: "Woodlands", region: "North", coords: { lat: 1.434, lng: 103.774 } },
  { id: "m-yusof-ishak", name: "Masjid Yusof Ishak", area: "Woodlands", region: "North", coords: { lat: 1.449, lng: 103.8 } },
  { id: "m-ahmad-ibrahim", name: "Masjid Ahmad Ibrahim", area: "Yishun", region: "North", coords: { lat: 1.435, lng: 103.834 } },
  { id: "m-assyafaah", name: "Masjid Assyafaah", area: "Sembawang", region: "North", coords: { lat: 1.449, lng: 103.819 } },
  { id: "m-petempatan-melayu", name: "Masjid Petempatan Melayu Sembawang", area: "Sembawang", region: "North", coords: { lat: 1.456, lng: 103.832 } },
  { id: "m-darul-makmur", name: "Masjid Darul Makmur", area: "Yishun", region: "North", coords: { lat: 1.428, lng: 103.836 } },
  // ---- West ----
  { id: "m-maarof", name: "Masjid Maarof", area: "Jurong West", region: "West", coords: { lat: 1.3389, lng: 103.6967 } },
  { id: "m-assyakirin", name: "Masjid Assyakirin", area: "Taman Jurong", region: "West", coords: { lat: 1.335, lng: 103.72 } },
  { id: "m-al-mukminin", name: "Masjid Al-Mukminin", area: "Jurong East", region: "West", coords: { lat: 1.347, lng: 103.736 } },
  { id: "m-hasanah", name: "Masjid Hasanah", area: "Teban Gardens", region: "West", coords: { lat: 1.321, lng: 103.743 } },
  { id: "m-darussalam", name: "Masjid Darussalam", area: "Clementi", region: "West", coords: { lat: 1.313, lng: 103.766 } },
  { id: "m-tentera-diraja", name: "Masjid Tentera Diraja", area: "Clementi", region: "West", coords: { lat: 1.314, lng: 103.776 } },
  { id: "m-ar-raudhah", name: "Masjid Ar-Raudhah", area: "Bukit Batok", region: "West", coords: { lat: 1.349, lng: 103.749 } },
  { id: "m-al-iman", name: "Masjid Al-Iman", area: "Bukit Panjang", region: "West", coords: { lat: 1.38, lng: 103.762 } },
  { id: "m-al-khair", name: "Masjid Al-Khair", area: "Choa Chu Kang", region: "West", coords: { lat: 1.385, lng: 103.744 } },
  { id: "m-al-firdaus", name: "Masjid Al-Firdaus", area: "Boon Lay", region: "West", coords: { lat: 1.346, lng: 103.713 } },
  { id: "m-pusara-aman", name: "Masjid Pusara Aman", area: "Lim Chu Kang", region: "West", coords: { lat: 1.396, lng: 103.698 } },
];

export { eventCats, events, myTickets, spotsLeft };

/* Single aggregate object mirroring the prototype's window.HHData so ported
   screens can keep using `HHData.listings`, `HHData.events`, etc. */
export const HHData = {
  categories, areas, listings, reviews, badgeMeta, analytics,
  IMG, PIC, gallery, collage, prayerTimes, mosques,
  eventCats, events, myTickets, spotsLeft,
};

// Accept either the stable id (l1) or the SEO slug (warung-bumbu-rempah).
export const getListing = (idOrSlug: string) =>
  listings.find((l) => l.id === idOrSlug || l.slug === idOrSlug);
export const getEvent = (idOrSlug: string) =>
  events.find((e) => e.id === idOrSlug || e.slug === idOrSlug);

export const slugForListing = (id: string) =>
  listings.find((l) => l.id === id)?.slug ?? id;
export const slugForEvent = (id: string) =>
  events.find((e) => e.id === id)?.slug ?? id;
