/* Lightweight UI i18n for high-visibility strings (EN + Bahasa Melayu).
   Not a full localization of every screen — covers nav, hero and common CTAs. */
import type { Lang } from "./types";

type Key =
  | "nav.explore" | "nav.events" | "nav.forBusiness" | "nav.pricing"
  | "nav.login" | "nav.listBusiness" | "nav.certifiedOnly"
  | "hero.eyebrow" | "hero.h1" | "hero.sub" | "hero.search"
  | "chip.nearMe" | "chip.openNow" | "chip.prayer" | "chip.family"
  | "common.seeAll" | "common.ramadan" | "tab.home" | "tab.search"
  | "tab.add" | "tab.saved" | "tab.profile";

const DICT: Record<Lang, Record<Key, string>> = {
  en: {
    "nav.explore": "Explore",
    "nav.events": "Events",
    "nav.forBusiness": "For Business",
    "nav.pricing": "Pricing",
    "nav.login": "Log in",
    "nav.listBusiness": "List your business",
    "nav.certifiedOnly": "Certified only",
    "hero.eyebrow": "Singapore-first halal guide",
    "hero.h1": "Halal, the way you trust it — across Singapore and beyond.",
    "hero.sub": "MUIS-certified kitchens, Muslim-owned cafés, services and shops — plus Muslim-friendly hotels and flights for when you travel.",
    "hero.search": "Search halal food, places near you, or a halal-friendly hotel…",
    "chip.nearMe": "Near me",
    "chip.openNow": "Open now",
    "chip.prayer": "Prayer space",
    "chip.family": "Family friendly",
    "common.seeAll": "See all",
    "common.ramadan": "Ramadan mode",
    "tab.home": "Home",
    "tab.search": "Search",
    "tab.add": "Add",
    "tab.saved": "Saved",
    "tab.profile": "Profile",
  },
  ms: {
    "nav.explore": "Terokai",
    "nav.events": "Acara",
    "nav.forBusiness": "Untuk Bisnes",
    "nav.pricing": "Harga",
    "nav.login": "Log masuk",
    "nav.listBusiness": "Senaraikan bisnes anda",
    "nav.certifiedOnly": "Disahkan sahaja",
    "hero.eyebrow": "Panduan halal nombor satu Singapura",
    "hero.h1": "Halal yang anda percaya — di Singapura dan luar negara.",
    "hero.sub": "Dapur disahkan MUIS, kafe milik Muslim, perkhidmatan dan kedai — serta hotel dan penerbangan mesra Muslim untuk perjalanan anda.",
    "hero.search": "Cari restoran, kafe, perkhidmatan, kedai…",
    "chip.nearMe": "Berdekatan",
    "chip.openNow": "Buka sekarang",
    "chip.prayer": "Ruang solat",
    "chip.family": "Mesra keluarga",
    "common.seeAll": "Lihat semua",
    "common.ramadan": "Mod Ramadan",
    "tab.home": "Utama",
    "tab.search": "Cari",
    "tab.add": "Tambah",
    "tab.saved": "Disimpan",
    "tab.profile": "Profil",
  },
};

export function t(lang: Lang | undefined, key: Key): string {
  return DICT[lang || "en"][key] ?? DICT.en[key];
}

export const LANG_LABEL: Record<Lang, string> = { en: "EN", ms: "BM" };
