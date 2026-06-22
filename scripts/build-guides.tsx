/* Lead-magnet PDF generator.
   Renders the three Tier-1 guides from the site's own in-repo data into
   public/guides/*.pdf. Run with:  npm run guides
   Deliberately NOT part of `npm run build` — it calls the Aladhan API and is a
   dev-only step. Re-run when directory / brand data changes; commit the output.

   Data sources (all pure, build-time importable):
   - lib/data.ts        → listings + areas        (Guide 1)
   - lib/halal-status.ts → brands + STATUS_META    (Guide 3)
   - lib/hijri.ts       → formatHijri              (Guide 2)
   - Aladhan API        → Ramadan 2026 prayer times (Guide 2)
*/
import React from "react";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToFile,
} from "@react-pdf/renderer";

import { listings, areas } from "../lib/data";
import { brands, STATUS_META, type HalalStatus } from "../lib/halal-status";
import type { BadgeKey, Listing } from "../lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.humblehalal.com";
const OUT_DIR = join(process.cwd(), "public", "guides");
const TODAY_LABEL = "June 2026";

// ---- palette (brand) ----
const EMERALD = "#0f6f63";
const GOLD = "#b8860b";
const INK = "#1f2933";
const SOFT = "#52606d";
const LINE = "#e4e0d6";
const CREAM = "#fbf7ee";
const YES = "#0f6f63";
const WARN = "#b26a00";
const NO = "#b23b3b";

const styles = StyleSheet.create({
  page: { paddingTop: 54, paddingBottom: 56, paddingHorizontal: 46, fontSize: 10, color: INK, fontFamily: "Helvetica", lineHeight: 1.45 },
  eyebrow: { fontSize: 9, letterSpacing: 1.5, color: GOLD, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  h1: { fontSize: 26, fontFamily: "Helvetica-Bold", color: INK, marginTop: 10 },
  lede: { fontSize: 11, color: SOFT, marginTop: 10, maxWidth: 420 },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", color: EMERALD, marginTop: 18, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${LINE}` },
  // cover
  coverWrap: { flexGrow: 1, justifyContent: "center" },
  coverBrand: { fontSize: 12, fontFamily: "Helvetica-Bold", color: EMERALD, letterSpacing: 1 },
  coverTitle: { fontSize: 34, fontFamily: "Helvetica-Bold", color: INK, marginTop: 18, lineHeight: 1.15 },
  coverSub: { fontSize: 13, color: SOFT, marginTop: 14, maxWidth: 380 },
  coverMeta: { fontSize: 9, color: SOFT, marginTop: 28 },
  // listing row
  card: { borderBottom: `1px solid ${LINE}`, paddingVertical: 7 },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 11, fontFamily: "Helvetica-Bold", color: INK },
  meta: { fontSize: 9, color: SOFT, marginTop: 2 },
  addr: { fontSize: 8.5, color: SOFT, marginTop: 2 },
  pill: { fontSize: 7.5, fontFamily: "Helvetica-Bold", paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8, color: "#fff" },
  // table
  trHead: { flexDirection: "row", backgroundColor: CREAM, borderBottom: `1px solid ${LINE}`, paddingVertical: 5, paddingHorizontal: 4 },
  tr: { flexDirection: "row", borderBottom: `1px solid ${LINE}`, paddingVertical: 5, paddingHorizontal: 4 },
  th: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: SOFT, textTransform: "uppercase", letterSpacing: 0.5 },
  td: { fontSize: 9.5, color: INK },
  box: { backgroundColor: CREAM, border: `1px solid ${LINE}`, borderRadius: 6, padding: 12, marginTop: 12 },
  note: { fontSize: 8.5, color: SOFT, marginTop: 14, fontStyle: "italic" },
  footer: { position: "absolute", bottom: 26, left: 46, right: 46, flexDirection: "row", justifyContent: "space-between", borderTop: `1px solid ${LINE}`, paddingTop: 8, fontSize: 8, color: SOFT },
});

function toneColor(tone: string): string {
  if (tone === "yes" || tone === "verified") return YES;
  if (tone === "no") return NO;
  return WARN;
}

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text>HumbleHalal · {SITE_URL.replace(/^https?:\/\//, "")}</Text>
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

function Cover({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <View style={styles.coverWrap}>
      <Text style={styles.coverBrand}>🌙 HUMBLEHALAL</Text>
      <Text style={styles.coverTitle}>{title}</Text>
      <Text style={styles.coverSub}>{sub}</Text>
      <Text style={styles.coverMeta}>{kicker} · Updated {TODAY_LABEL} · {SITE_URL.replace(/^https?:\/\//, "")}</Text>
    </View>
  );
}

/* ============================ GUIDE 1 — Food by MRT ============================ */

// Singapore halal-status policy: ONLY "muis" badge maps to MUIS certification.
function halalTag(badges: BadgeKey[]): { text: string; color: string } {
  if (badges.includes("muis")) return { text: "MUIS Certified", color: YES };
  if (badges.includes("admin")) return { text: "HumbleHalal Verified", color: YES };
  if (badges.includes("owned")) return { text: "Muslim-Owned", color: GOLD };
  if (badges.includes("nopork")) return { text: "No Pork/Lard · self-declared", color: WARN };
  if (badges.includes("friendly")) return { text: "Halal-Friendly · self-declared", color: WARN };
  if (badges.includes("pending")) return { text: "Pending Verification", color: SOFT };
  return { text: "Unconfirmed", color: SOFT };
}

// Nearest MRT label for each seed area.
const AREA_MRT: Record<string, string> = {
  Tampines: "Tampines MRT (EW2 / DT32)",
  Bugis: "Bugis MRT (EW12 / DT14)",
  Bedok: "Bedok MRT (EW5)",
  "Geylang Serai": "Paya Lebar / Eunos MRT",
  Jurong: "Jurong East MRT (EW24 / NS1)",
  "Paya Lebar": "Paya Lebar MRT (EW8 / CC9)",
};

function FoodGuide() {
  const byArea = new Map<string, Listing[]>();
  for (const l of listings) {
    const arr = byArea.get(l.area) || [];
    arr.push(l);
    byArea.set(l.area, arr);
  }
  // Order by the curated `areas` list, then any extras.
  const ordered = [
    ...areas.map((a) => a.name).filter((n) => byArea.has(n)),
    ...[...byArea.keys()].filter((n) => !areas.some((a) => a.name === n)),
  ];

  return (
    <Document title="Ultimate Halal Food Guide by MRT Station — HumbleHalal" author="HumbleHalal">
      <Page size="A4" style={styles.page}>
        <Cover
          kicker="Singapore halal directory"
          title={"Ultimate Halal\nFood Guide\nby MRT Station"}
          sub="Verified halal & Muslim-owned spots across Singapore, grouped by the nearest MRT — so you always know what's halal near you."
        />
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>How to read this guide</Text>
        <Text style={styles.h1}>What the labels mean</Text>
        <View style={styles.box}>
          <Text style={{ marginBottom: 4 }}><Text style={{ color: YES, fontFamily: "Helvetica-Bold" }}>MUIS Certified</Text> — listed on the MUIS HalalSG register. The gold standard.</Text>
          <Text style={{ marginBottom: 4 }}><Text style={{ color: YES, fontFamily: "Helvetica-Bold" }}>HumbleHalal Verified</Text> — our team checked supporting evidence.</Text>
          <Text style={{ marginBottom: 4 }}><Text style={{ color: GOLD, fontFamily: "Helvetica-Bold" }}>Muslim-Owned</Text> — owner-declared Muslim-owned business.</Text>
          <Text><Text style={{ color: WARN, fontFamily: "Helvetica-Bold" }}>Self-declared</Text> — "no pork/lard" or "halal-friendly" is the owner's claim, not MUIS certification. Always verify before eating.</Text>
        </View>
        <Text style={styles.note}>
          Halal status changes. Always confirm certification on the official MUIS HalalSG register before you dine.
          This guide reflects information as of {TODAY_LABEL}.
        </Text>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        {ordered.map((area) => {
          const items = (byArea.get(area) || []).slice().sort((a, b) => {
            const rank = (l: Listing) => (l.badges.includes("muis") ? 0 : l.badges.includes("admin") ? 1 : l.badges.includes("owned") ? 2 : 3);
            return rank(a) - rank(b);
          });
          return (
            <View key={area}>
              <Text style={styles.h2} wrap={false}>{area} · {AREA_MRT[area] || `${area} MRT`}</Text>
              {items.map((l) => {
                const tag = halalTag(l.badges);
                return (
                  <View key={l.id} style={styles.card} wrap={false}>
                    <View style={styles.cardTop}>
                      <Text style={styles.name}>{l.name}</Text>
                      <Text style={[styles.pill, { backgroundColor: tag.color }]}>{tag.text}</Text>
                    </View>
                    <Text style={styles.meta}>{l.cuisine} · {l.price} · {l.cat}</Text>
                    <Text style={styles.addr}>{l.address}</Text>
                  </View>
                );
              })}
            </View>
          );
        })}
        <Text style={styles.note}>
          Discover hundreds more, search by cuisine and check live MUIS status at {SITE_URL.replace(/^https?:\/\//, "")}.
        </Text>
        <Footer />
      </Page>
    </Document>
  );
}

/* ============================ GUIDE 2 — Ramadan 2026 ============================ */

type RamadanDay = { iso: string; greg: string; hijri: string; imsak: string; fajr: string; maghrib: string };

type AladhanDay = {
  timings: { Imsak: string; Fajr: string; Maghrib: string };
  date: {
    gregorian: { date: string; month: { en: string } };
    hijri: { day: string; month: { number: number } };
  };
};

function cleanTime(t: string): string {
  // Aladhan returns e.g. "05:42 (+08)" → "05:42"
  return (t || "").split(" ")[0];
}

async function fetchRamadanDays(): Promise<RamadanDay[]> {
  const LAT = 1.3521, LNG = 103.8198, METHOD = 11; // Singapore / MUIS
  const months = [
    { y: 2026, m: 2 },
    { y: 2026, m: 3 },
  ];
  const out: RamadanDay[] = [];
  for (const { y, m } of months) {
    const url = `https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${LAT}&longitude=${LNG}&method=${METHOD}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Aladhan ${y}/${m} → ${res.status}`);
    const json = (await res.json()) as { data: AladhanDay[] };
    for (const day of json.data) {
      // gregorian.date is "DD-MM-YYYY"
      const [dd, mm, yyyy] = String(day.date.gregorian.date).split("-");
      const iso = `${yyyy}-${mm}-${dd}`;
      const isRamadan = day.date.hijri?.month?.number === 9; // 9 = Ramadan
      if (!isRamadan) continue;
      out.push({
        iso,
        greg: `${dd} ${day.date.gregorian.month.en.slice(0, 3)}`,
        hijri: `${day.date.hijri.day} Ramadan`,
        imsak: cleanTime(day.timings.Imsak),
        fajr: cleanTime(day.timings.Fajr),
        maghrib: cleanTime(day.timings.Maghrib),
      });
    }
  }
  return out;
}

function RamadanPlanner({ days }: { days: RamadanDay[] }) {
  const col = { day: "16%", date: "16%", hijri: "20%", sahur: "16%", iftar: "16%", tick: "16%" };
  return (
    <Document title="Ramadan 2026 Planner — HumbleHalal" author="HumbleHalal">
      <Page size="A4" style={styles.page}>
        <Cover
          kicker="Singapore · MUIS times"
          title={"Ramadan 2026\nPlanner"}
          sub="Your day-by-day fasting companion — sahur & iftar times for Singapore, a tracker, and your zakat reference. Ramadan 1447 AH."
        />
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Sahur & iftar · Singapore (MUIS, method 11)</Text>
        <Text style={styles.h1}>Daily fasting times</Text>
        <Text style={styles.lede}>Times are for Singapore. Sahur ends at Imsak; break your fast at Maghrib. Subject to the official MUIS moon sighting.</Text>

        <View style={[styles.trHead, { marginTop: 14 }]}>
          <Text style={[styles.th, { width: col.day }]}>Fast day</Text>
          <Text style={[styles.th, { width: col.date }]}>Date</Text>
          <Text style={[styles.th, { width: col.hijri }]}>Hijri</Text>
          <Text style={[styles.th, { width: col.sahur }]}>Sahur ends</Text>
          <Text style={[styles.th, { width: col.iftar }]}>Iftar</Text>
          <Text style={[styles.th, { width: col.tick }]}>Done</Text>
        </View>
        {days.map((d, i) => (
          <View key={d.iso} style={styles.tr} wrap={false}>
            <Text style={[styles.td, { width: col.day }]}>Day {i + 1}</Text>
            <Text style={[styles.td, { width: col.date }]}>{d.greg}</Text>
            <Text style={[styles.td, { width: col.hijri, color: SOFT }]}>{d.hijri}</Text>
            <Text style={[styles.td, { width: col.sahur, fontFamily: "Helvetica-Bold" }]}>{d.imsak}</Text>
            <Text style={[styles.td, { width: col.iftar, fontFamily: "Helvetica-Bold", color: EMERALD }]}>{d.maghrib}</Text>
            <Text style={[styles.td, { width: col.tick, color: LINE }]}>☐</Text>
          </View>
        ))}
        <Text style={styles.note}>
          Generated from the Aladhan API (MUIS calculation method). Hijri dates are approximate — the start of
          Ramadan and Hari Raya follow the official MUIS moon sighting.
        </Text>
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Zakat reference</Text>
        <View style={styles.box}>
          <Text style={{ marginBottom: 4 }}>Zakat is <Text style={{ fontFamily: "Helvetica-Bold" }}>2.5%</Text> of zakatable wealth held above the nisab for one lunar year.</Text>
          <Text style={{ marginBottom: 4 }}>Nisab (gold basis): <Text style={{ fontFamily: "Helvetica-Bold" }}>87.48 g</Text> of gold.</Text>
          <Text>Nisab (silver basis): <Text style={{ fontFamily: "Helvetica-Bold" }}>612.36 g</Text> of silver.</Text>
          <Text style={{ marginTop: 6, color: SOFT, fontSize: 9 }}>Work out your exact zakat at {SITE_URL.replace(/^https?:\/\//, "")}/tools/zakat</Text>
        </View>

        <Text style={styles.h2}>Make the most of Ramadan</Text>
        <View>
          {[
            "Plan sahur the night before — prep overnight oats or dates + water.",
            "Pray Tarawih at your local mosque — find the nearest at /mosques.",
            "Set a daily Quran goal and track your khatam at /tools/khatam.",
            "Give your zakat early in the month and log sadaqah at /tools/sadaqah.",
            "Book iftar buffets and catering before they fill up — see /halal/halal-buffet-singapore.",
          ].map((tip) => (
            <Text key={tip} style={{ marginBottom: 5 }}>•  {tip}</Text>
          ))}
        </View>
        <Text style={styles.note}>Ramadan 2026 (1447 AH) is expected to begin around 18 February 2026; Hari Raya Aidilfitri around 20 March 2026 — subject to MUIS.</Text>
        <Footer />
      </Page>
    </Document>
  );
}

/* ============================ GUIDE 3 — Brand cheat-sheet ============================ */

function BrandCheatSheet() {
  const byCat = new Map<string, typeof brands>();
  for (const b of brands) {
    const arr = byCat.get(b.category) || [];
    arr.push(b);
    byCat.set(b.category, arr);
  }
  const cats = [...byCat.keys()].sort();
  const col = { brand: "30%", verdict: "16%", status: "54%" };

  const verdictColor = (s: HalalStatus) => toneColor(STATUS_META[s].tone);

  return (
    <Document title="Halal Brand Status Cheat-Sheet — HumbleHalal" author="HumbleHalal">
      <Page size="A4" style={styles.page}>
        <Cover
          kicker="Is it halal?"
          title={"Halal Brand\nStatus\nCheat-Sheet"}
          sub="Quick verdicts for popular Singapore food brands — checked against the MUIS HalalSG register. Know before you go."
        />
        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>{brands.length} brands · checked {TODAY_LABEL}</Text>
        <Text style={styles.h1}>Is it halal?</Text>
        <Text style={styles.lede}>
          "Yes" means MUIS halal-certified. "No" / "Not certified" means not on the HalalSG register — including
          brands that say "no pork", which is self-declared, not certification.
        </Text>

        {cats.map((cat) => (
          <View key={cat} wrap={false}>
            <Text style={styles.h2}>{cat}</Text>
            <View style={styles.trHead}>
              <Text style={[styles.th, { width: col.brand }]}>Brand</Text>
              <Text style={[styles.th, { width: col.verdict }]}>Halal?</Text>
              <Text style={[styles.th, { width: col.status }]}>Status</Text>
            </View>
            {byCat.get(cat)!.map((b) => (
              <View key={b.slug} style={styles.tr} wrap={false}>
                <Text style={[styles.td, { width: col.brand, fontFamily: "Helvetica-Bold" }]}>{b.brand}</Text>
                <Text style={[styles.td, { width: col.verdict, fontFamily: "Helvetica-Bold", color: verdictColor(b.status) }]}>{STATUS_META[b.status].verdict}</Text>
                <Text style={[styles.td, { width: col.status, color: SOFT }]}>{STATUS_META[b.status].label}</Text>
              </View>
            ))}
          </View>
        ))}
        <Text style={styles.note}>
          Statuses change — always confirm on the official MUIS HalalSG register. Source: MUIS HalalSG register +
          publicly available information. Check any brand at {SITE_URL.replace(/^https?:\/\//, "")}/is-halal.
        </Text>
        <Footer />
      </Page>
    </Document>
  );
}

/* ============================ main ============================ */

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("→ Ultimate Halal Food Guide by MRT…");
  await renderToFile(<FoodGuide />, join(OUT_DIR, "ultimate-halal-food-guide-mrt.pdf"));

  console.log("→ Ramadan 2026 Planner (fetching MUIS times)…");
  const days = await fetchRamadanDays();
  if (days.length < 25) throw new Error(`Expected ~29-30 Ramadan days, got ${days.length} — aborting (won't ship an empty planner)`);
  await renderToFile(<RamadanPlanner days={days} />, join(OUT_DIR, "ramadan-2026-planner.pdf"));

  console.log("→ Halal Brand Status Cheat-Sheet…");
  await renderToFile(<BrandCheatSheet />, join(OUT_DIR, "halal-brand-cheat-sheet.pdf"));

  console.log(`✓ Wrote 3 guides to ${OUT_DIR} (${days.length} Ramadan days)`);
}

main().catch((err) => {
  console.error("✗ Guide build failed:", err);
  process.exit(1);
});
