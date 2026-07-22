/* Lightweight UI i18n for high-visibility strings (EN + Bahasa Melayu).
   Covers the app chrome that appears on every page — nav, hero, common CTAs
   and the full site footer. Long-form page/body copy is still English; a
   real per-page localization would need locale routing (see the i18n plan). */
import type { Lang } from "./types";

type Key =
  | "nav.explore" | "nav.events" | "nav.forBusiness" | "nav.pricing"
  | "nav.login" | "nav.listBusiness" | "nav.certifiedOnly"
  | "hero.eyebrow" | "hero.h1" | "hero.sub" | "hero.search"
  | "chip.nearMe" | "chip.openNow" | "chip.prayer" | "chip.family"
  | "common.seeAll" | "common.ramadan" | "tab.home" | "tab.search"
  | "tab.add" | "tab.saved" | "tab.profile"
  // Footer — column titles
  | "footer.col.discover" | "footer.col.community" | "footer.col.business"
  | "footer.col.trust" | "footer.col.company"
  // Footer — link labels
  | "footer.link.deals" | "footer.link.map" | "footer.link.travel"
  | "footer.link.flights" | "footer.link.trips" | "footer.link.tools"
  | "footer.link.mosques" | "footer.link.prayerRooms" | "footer.link.saved"
  | "footer.link.blog" | "footer.link.ownerStart" | "footer.link.advertise"
  | "footer.link.hostEvent" | "footer.link.claim" | "footer.link.quote"
  | "footer.link.verify" | "footer.link.isHalal" | "footer.link.report"
  | "footer.link.suggest" | "footer.link.about" | "footer.link.contact"
  | "footer.link.faq"
  // Footer — brand + clouds + legal + base
  | "footer.intro" | "footer.newsletter" | "footer.operatedBy" | "footer.growthBy"
  | "footer.browseCategory" | "footer.halalGuides" | "footer.halalDirectory"
  | "footer.allCategories" | "footer.allGuides"
  | "footer.legal.terms" | "footer.legal.privacy" | "footer.legal.pdpa"
  | "footer.legal.cookies" | "footer.legal.accessibility" | "footer.legal.disclaimer"
  | "footer.legal.certChanges"
  | "footer.base.copyright" | "footer.base.verify";

const DICT: Record<Lang, Record<Key, string>> = {
  en: {
    "nav.explore": "Explore",
    "nav.events": "Events",
    "nav.forBusiness": "For Business",
    "nav.pricing": "Pricing",
    "nav.login": "Log in",
    "nav.listBusiness": "List your business",
    "nav.certifiedOnly": "Certified / listed",
    "hero.eyebrow": "Singapore-first halal guide",
    "hero.h1": "Find halal you can trust — across Singapore.",
    "hero.sub": "MUIS-certified kitchens, Muslim-owned cafés, hawker stalls and services — every listing labelled and scored, so you always know what's verified.",
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
    "footer.col.discover": "Discover",
    "footer.col.community": "Community & tools",
    "footer.col.business": "For business",
    "footer.col.trust": "Trust & safety",
    "footer.col.company": "Company",
    "footer.link.deals": "Deals & coupons",
    "footer.link.map": "Map view",
    "footer.link.travel": "Halal travel & hotels",
    "footer.link.flights": "Flights",
    "footer.link.trips": "My trips",
    "footer.link.tools": "Islamic tools",
    "footer.link.mosques": "Mosques in Singapore",
    "footer.link.prayerRooms": "Prayer rooms (musollah)",
    "footer.link.saved": "Saved places",
    "footer.link.blog": "Blog & guides",
    "footer.link.ownerStart": "Owner getting-started",
    "footer.link.advertise": "Advertise with us",
    "footer.link.hostEvent": "Host an event",
    "footer.link.claim": "Claim a listing",
    "footer.link.quote": "Request a quote",
    "footer.link.verify": "How we verify",
    "footer.link.isHalal": "Is it halal? checker",
    "footer.link.report": "Report an issue",
    "footer.link.suggest": "Suggest a place",
    "footer.link.about": "About us",
    "footer.link.contact": "Contact us",
    "footer.link.faq": "FAQ",
    "footer.intro": "Singapore’s most trusted halal & Muslim-owned business directory. A discovery platform, not a certifier.",
    "footer.newsletter": "Get the weekly halal guide",
    "footer.operatedBy": "Operated by",
    "footer.growthBy": "Growth services by",
    "footer.browseCategory": "Browse by category",
    "footer.halalGuides": "Halal guides",
    "footer.halalDirectory": "Halal directory",
    "footer.allCategories": "All categories →",
    "footer.allGuides": "All guides →",
    "footer.legal.terms": "Terms",
    "footer.legal.privacy": "Privacy",
    "footer.legal.pdpa": "PDPA",
    "footer.legal.cookies": "Cookies",
    "footer.legal.accessibility": "Accessibility",
    "footer.legal.disclaimer": "Halal disclaimer",
    "footer.legal.certChanges": "Certification changes",
    "footer.base.copyright": "© 2026 Humble Halal. Built for the Singapore Muslim community.",
    "footer.base.verify": "Always verify certification on MUIS HalalSG.",
  },
  ms: {
    "nav.explore": "Terokai",
    "nav.events": "Acara",
    "nav.forBusiness": "Untuk Bisnes",
    "nav.pricing": "Harga",
    "nav.login": "Log masuk",
    "nav.listBusiness": "Senaraikan bisnes anda",
    "nav.certifiedOnly": "Disahkan / tersenarai",
    "hero.eyebrow": "Panduan halal nombor satu Singapura",
    "hero.h1": "Cari halal yang anda percaya — di seluruh Singapura.",
    "hero.sub": "Dapur disahkan MUIS, kafe milik Muslim, gerai hawker dan perkhidmatan — setiap senarai dilabel dan diskor, supaya anda sentiasa tahu apa yang disahkan.",
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
    "footer.col.discover": "Terokai",
    "footer.col.community": "Komuniti & alatan",
    "footer.col.business": "Untuk bisnes",
    "footer.col.trust": "Kepercayaan & keselamatan",
    "footer.col.company": "Syarikat",
    "footer.link.deals": "Tawaran & kupon",
    "footer.link.map": "Paparan peta",
    "footer.link.travel": "Pelancongan & hotel halal",
    "footer.link.flights": "Penerbangan",
    "footer.link.trips": "Perjalanan saya",
    "footer.link.tools": "Alatan Islam",
    "footer.link.mosques": "Masjid di Singapura",
    "footer.link.prayerRooms": "Bilik solat (musollah)",
    "footer.link.saved": "Tempat disimpan",
    "footer.link.blog": "Blog & panduan",
    "footer.link.ownerStart": "Panduan pemilik",
    "footer.link.advertise": "Iklan bersama kami",
    "footer.link.hostEvent": "Anjur acara",
    "footer.link.claim": "Tuntut senarai",
    "footer.link.quote": "Minta sebut harga",
    "footer.link.verify": "Cara kami mengesahkan",
    "footer.link.isHalal": "Penyemak: Halal?",
    "footer.link.report": "Laporkan isu",
    "footer.link.suggest": "Cadangkan tempat",
    "footer.link.about": "Tentang kami",
    "footer.link.contact": "Hubungi kami",
    "footer.link.faq": "Soalan lazim",
    "footer.intro": "Direktori halal & bisnes milik Muslim paling dipercayai di Singapura. Platform penemuan, bukan pensijil.",
    "footer.newsletter": "Dapatkan panduan halal mingguan",
    "footer.operatedBy": "Dikendalikan oleh",
    "footer.growthBy": "Perkhidmatan pertumbuhan oleh",
    "footer.browseCategory": "Lihat mengikut kategori",
    "footer.halalGuides": "Panduan halal",
    "footer.halalDirectory": "Direktori halal",
    "footer.allCategories": "Semua kategori →",
    "footer.allGuides": "Semua panduan →",
    "footer.legal.terms": "Terma",
    "footer.legal.privacy": "Privasi",
    "footer.legal.pdpa": "PDPA",
    "footer.legal.cookies": "Kuki",
    "footer.legal.accessibility": "Kebolehcapaian",
    "footer.legal.disclaimer": "Penafian halal",
    "footer.legal.certChanges": "Perubahan pensijilan",
    "footer.base.copyright": "© 2026 Humble Halal. Dibina untuk komuniti Muslim Singapura.",
    "footer.base.verify": "Sentiasa sahkan pensijilan di MUIS HalalSG.",
  },
};

export function t(lang: Lang | undefined, key: Key): string {
  return DICT[lang || "en"][key] ?? DICT.en[key];
}

export const LANG_LABEL: Record<Lang, string> = { en: "EN", ms: "BM" };
