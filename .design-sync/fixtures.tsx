// Preview fixtures for design-sync cards. Realistic Humble Halal domain data
// (ported from lib/data seed listings) plus a ready-made AppProvider +
// DirectoryProvider wrapper, so context-dependent components (ListingCard,
// SearchBar, MyCoupons, …) render inside their real context in the DS pane.
//
// Exported through `extraEntries` so it lands on window.HumbleHalal and the
// authored previews/*.tsx can import { PreviewShell, sampleListing, … } from it.
import * as React from "react";
import type { Listing } from "@/lib/types";
import { AppProvider } from "@/components/app-context";
import { DirectoryProvider } from "@/components/directory-context";

export const sampleListings: Listing[] = [
  {
    id: "l1", name: "Warung Bumbu Rempah", cat: "Restaurants", catId: "restaurants",
    cuisine: "Indonesian · Nasi Padang", area: "Tampines", price: "$$",
    rating: 4.8, reviews: 312, badges: ["muis", "owned", "family"],
    blurb: "Slow-cooked rendang and sambal goreng in a cosy heartland corner.",
    img: "nasi padang spread", tone: "gold", open: true, distance: "0.4 km",
    prayer: true, delivery: true, featured: true, claimed: true,
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
    prayer: false, delivery: true, featured: true, claimed: true,
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
    prayer: false, delivery: false, featured: false, claimed: false,
    hours: "Closed · opens 7:00 AM",
    phone: "+65 6333 9090", wa: "", ig: "@toktokmeepok", web: "",
    address: "Blk 16 Bedok South Rd, #01-22, S460016",
    tags: ["No pork no lard", "Hawker", "Cash only"],
  },
];

export const sampleListing = sampleListings[0];

export const sampleCategories = [
  { id: "restaurants", label: "Restaurants", icon: "utensils" },
  { id: "cafes", label: "Cafés", icon: "coffee" },
  { id: "groceries", label: "Groceries", icon: "basket" },
  { id: "beauty", label: "Beauty", icon: "sparkles" },
];

export const sampleAreas = [
  { id: "tampines", name: "Tampines", count: 42, tone: "emerald" },
  { id: "bugis", name: "Bugis", count: 28, tone: "gold" },
  { id: "bedok", name: "Bedok", count: 35, tone: "emerald" },
];

/** Wraps children in the app + directory context so context-reading components
 *  (useApp / useDirectory) render their real UI in a preview card. */
export function PreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <DirectoryProvider listings={sampleListings} categories={sampleCategories} areas={sampleAreas}>
        {children}
      </DirectoryProvider>
    </AppProvider>
  );
}
