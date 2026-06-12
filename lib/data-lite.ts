/* Humble Halal — lightweight shared data.

   This module is imported by the always-loaded chrome (header/footer) and UI
   primitives, so it must stay tiny: no listings, events or mosque directory.
   The heavy dataset lives in ./data and is pulled per-route (or lazily). */
import type { Area, BadgeKey, BadgeMetaEntry, Category, PrayerTimes } from "./types";

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

export const prayerTimes: PrayerTimes = {
  date: "Today", hijri: "28 Dhul-Qi’dah 1447",
  times: [
    { name: "Subuh", time: "5:42" }, { name: "Syuruk", time: "7:05" }, { name: "Zohor", time: "1:08" },
    { name: "Asar", time: "4:32" }, { name: "Maghrib", time: "7:11" }, { name: "Isyak", time: "8:25" },
  ],
  nextIndex: 3, // Asar is next
};

// Mosque shown in the header prayer strip (full directory stays in ./data).
export const prayerMosque = { name: "Masjid Sultan", area: "Kampong Glam", dist: "" };
