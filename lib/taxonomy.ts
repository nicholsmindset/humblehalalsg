/* Humble Halal — full business taxonomy for a Singapore halal directory.
   2-level tree (category → subcategory). Seeds the categories/subcategories
   tables and drives Explore filters + programmatic SEO pages. Icons map to the
   existing Icon set in components/ui.tsx. */

export interface SubCategory {
  id: string;
  label: string;
}
export interface Category {
  id: string;
  label: string;
  icon: string;
  blurb: string;
  subs: SubCategory[];
}

const s = (id: string, label: string): SubCategory => ({ id, label });

export const TAXONOMY: Category[] = [
  {
    id: "food-drink",
    label: "Food & Drink",
    icon: "utensils",
    blurb: "Halal restaurants, cafés, hawker stalls and home-based food.",
    subs: [
      s("malay-indonesian", "Malay / Indonesian"),
      s("nasi-padang", "Nasi Padang"),
      s("indian-muslim", "Indian-Muslim / Mamak"),
      s("north-indian", "North Indian / Pakistani"),
      s("middle-eastern", "Middle Eastern / Arab / Turkish"),
      s("western", "Western"),
      s("korean", "Korean"),
      s("japanese", "Japanese"),
      s("thai", "Thai"),
      s("chinese-muslim", "Chinese-Muslim"),
      s("seafood", "Seafood"),
      s("bbq-grill", "BBQ / Grill"),
      s("fast-food", "Fried chicken / Fast food"),
      s("cafes", "Cafés & Coffee"),
      s("bakery-kueh", "Bakeries / Kueh / Confectionery"),
      s("desserts", "Desserts & Ice Cream"),
      s("bubble-tea", "Bubble tea / Juice"),
      s("hawker", "Hawker stalls"),
      s("home-based", "Home-based food (HBB)"),
      s("food-truck", "Food trucks / Pop-ups"),
    ],
  },
  {
    id: "catering",
    label: "Catering & Events Food",
    icon: "utensils",
    blurb: "Buffet, event and wedding catering, private chefs and dessert tables.",
    subs: [s("buffet", "Buffet / Event catering"), s("private-chef", "Private chefs"), s("wedding-catering", "Wedding catering"), s("dessert-table", "Dessert tables")],
  },
  {
    id: "groceries",
    label: "Groceries & Food Retail",
    icon: "basket",
    blurb: "Halal butchers, minimarts, frozen and specialty food retail.",
    subs: [s("butcher", "Halal butchers / Meat"), s("minimart", "Supermarkets / Minimarts"), s("frozen", "Frozen & wholesale"), s("spices", "Spices / Dry goods"), s("specialty", "Dates / Honey / Specialty")],
  },
  {
    id: "beauty",
    label: "Beauty & Grooming",
    icon: "sparkles",
    blurb: "Muslimah salons, barbers, spa, aesthetics and halal cosmetics.",
    subs: [s("muslimah-salon", "Muslimah salons / Hair"), s("barber", "Barbers"), s("spa", "Spa & massage"), s("nails-lashes", "Nails & lashes"), s("aesthetics", "Aesthetics"), s("cosmetics", "Halal cosmetics / Skincare")],
  },
  {
    id: "health",
    label: "Health & Medical",
    icon: "shield",
    blurb: "Clinics, dental, pharmacies, wellness and women-friendly fitness.",
    subs: [s("clinic", "Clinics (GP / TCM)"), s("dental", "Dental"), s("pharmacy", "Pharmacies"), s("bekam", "Cupping (bekam) / Wellness"), s("maternity", "Maternity & confinement"), s("fitness", "Fitness / Gyms (women-friendly)")],
  },
  {
    id: "fashion",
    label: "Fashion & Modest Retail",
    icon: "store",
    blurb: "Modest fashion, hijab, tailoring, attire and attar.",
    subs: [s("modest-fashion", "Modest fashion / Hijab"), s("abaya-jubah", "Abaya / Jubah / Baju kurung"), s("tailoring", "Tailoring & alterations"), s("songkok", "Songkok / Kopiah"), s("footwear", "Footwear & accessories"), s("attar", "Attar / Perfume")],
  },
  {
    id: "home-services",
    label: "Home & Living Services",
    icon: "wrench",
    blurb: "Aircon, cleaning, renovation, movers and handyman services.",
    subs: [s("aircon", "Aircon servicing"), s("cleaning", "Cleaning / Pest control"), s("renovation", "Renovation / Contractor / Interior"), s("movers", "Movers"), s("handyman", "Plumbing / Electrical / Handyman"), s("laundry", "Laundry / Dry-clean")],
  },
  {
    id: "automotive",
    label: "Automotive",
    icon: "wrench",
    blurb: "Workshops, detailing, dealers and car rental.",
    subs: [s("workshop", "Workshops / Servicing"), s("detailing", "Detailing"), s("dealer", "Car dealers"), s("rental", "Rental")],
  },
  {
    id: "professional",
    label: "Professional & Business",
    icon: "building",
    blurb: "Accounting, legal/Syariah, Takaful, Islamic finance and creative.",
    subs: [s("accounting", "Accounting / Bookkeeping"), s("legal", "Legal / Syariah"), s("takaful", "Insurance / Takaful"), s("finance", "Islamic finance / Planning"), s("creative", "Marketing / Design / Web"), s("printing", "Printing"), s("coworking", "Coworking")],
  },
  {
    id: "weddings",
    label: "Weddings & Lifestyle",
    icon: "heart",
    blurb: "Bridal, photography, hantaran, deco, florists and event rental.",
    subs: [s("bridal-mua", "Bridal / MUA"), s("photo-video", "Photography / Videography"), s("hantaran", "Kompang / Hantaran / Deco"), s("florist", "Florists"), s("event-rental", "Event rental / Planning")],
  },
  {
    id: "education",
    label: "Education & Childcare",
    icon: "family",
    blurb: "Quran, madrasah, tuition, childcare and vocational training.",
    subs: [s("quran", "Quran / Tahfiz / Tajweed"), s("madrasah", "Madrasah / Islamic education"), s("tuition", "Tuition / Enrichment"), s("childcare", "Childcare / Preschool"), s("vocational", "Vocational")],
  },
  {
    id: "travel",
    label: "Travel & Hospitality",
    icon: "globe",
    blurb: "Umrah/Hajj agencies, halal-friendly stays and tour guides.",
    subs: [s("umrah-hajj", "Umrah / Hajj agencies"), s("hotels", "Halal-friendly hotels / Stays"), s("tour-guide", "Tour guides")],
  },
  {
    id: "community",
    label: "Religious & Community",
    icon: "mosque",
    blurb: "Mosques, Islamic organisations, zakat and funeral services.",
    subs: [s("mosque", "Mosques / Surau"), s("org", "Islamic orgs / Charities"), s("zakat", "Zakat / Fitrah"), s("funeral", "Funeral (Islamic) services")],
  },
  {
    id: "shops",
    label: "Shops & Misc",
    icon: "store",
    blurb: "Islamic bookstores, gifts, toys, pets and nurseries.",
    subs: [s("bookstore", "Islamic bookstores"), s("gifts", "Gifts / Home"), s("toys", "Toys / Kids"), s("pets", "Pets"), s("nursery", "Plants / Nurseries")],
  },
];

/* Cross-cutting attributes (facets/filters, NOT categories). */
export interface Attribute {
  id: string;
  label: string;
  group: "halal" | "amenity" | "service" | "payment";
}
export const ATTRIBUTES: Attribute[] = [
  { id: "muis", label: "MUIS Certified", group: "halal" },
  { id: "muslim-owned", label: "Muslim-owned", group: "halal" },
  { id: "no-pork-no-lard", label: "No pork no lard", group: "halal" },
  { id: "zabihah", label: "Zabihah meat", group: "halal" },
  { id: "alcohol-free", label: "Alcohol-free", group: "halal" },
  { id: "prayer-space", label: "Prayer space", group: "amenity" },
  { id: "women-friendly", label: "Women-friendly / Private rooms", group: "amenity" },
  { id: "family-friendly", label: "Family-friendly", group: "amenity" },
  { id: "wheelchair", label: "Wheelchair access", group: "amenity" },
  { id: "dine-in", label: "Dine-in", group: "service" },
  { id: "takeaway", label: "Takeaway", group: "service" },
  { id: "delivery", label: "Delivery (Grab / Foodpanda / Deliveroo)", group: "service" },
  { id: "open-late", label: "Open late", group: "service" },
  { id: "paynow", label: "PayNow", group: "payment" },
  { id: "card", label: "Card", group: "payment" },
];

export const CATEGORY_BY_ID = new Map(TAXONOMY.map((c) => [c.id, c]));
export function findSub(catId: string, subId: string) {
  return CATEGORY_BY_ID.get(catId)?.subs.find((x) => x.id === subId);
}
export const allCategorySlugs = () => TAXONOMY.map((c) => c.id);
