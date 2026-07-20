import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrayerCalendar } from "@/lib/prayer-times";
import { WAKTU_MONTHS, WAKTU_YEAR, waktuMonthBySlug, sgTodayISO } from "@/lib/waktu-solat";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { Faq } from "@/components/faq";
import { WaktuTable, WaktuUnavailable } from "../timetable";

/* Monthly waktu solat pages — /waktu-solat-singapore/januari-2026 … disember-2026.
   Malay month slugs match how Singapore searches ("waktu solat januari").
   Fully static (generateStaticParams + dynamicParams=false), refreshed daily. */

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return WAKTU_MONTHS.map((m) => ({ month: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ month: string }> }): Promise<Metadata> {
  const { month } = await params;
  const m = waktuMonthBySlug(month);
  if (!m) return pageMeta({ title: "Waktu Solat Singapore", path: `/waktu-solat-singapore/${month}` });
  return pageMeta({
    title: `Waktu Solat Singapore — ${m.ms} ${WAKTU_YEAR} Prayer Timetable`,
    description: `Full ${m.ms} ${WAKTU_YEAR} (${m.en}) prayer timetable for Singapore — daily Imsak, Subuh, Syuruk, Zohor, Asar, Maghrib and Isyak times, MUIS calculation method.`,
    path: `/waktu-solat-singapore/${m.slug}`,
    absoluteTitle: true,
  });
}

export default async function Page({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const m = waktuMonthBySlug(month);
  if (!m) notFound();

  const rows = await getPrayerCalendar(WAKTU_YEAR, m.month);
  const monthLabel = `${m.ms} ${WAKTU_YEAR}`;
  const prev = WAKTU_MONTHS[m.month - 2]; // undefined for Januari
  const next = WAKTU_MONTHS[m.month];     // undefined for Disember

  // Month-specific FAQ — quotes real fetched times when available, otherwise
  // stays generic (never a fabricated time). Visible FAQ === FAQPage JSON-LD.
  const first = rows?.[0];
  const last = rows?.[rows.length - 1];
  const faq = [
    {
      q: `What time is Subuh in Singapore in ${m.ms} ${WAKTU_YEAR}?`,
      a:
        first && last
          ? `In ${m.ms} ${WAKTU_YEAR}, Subuh moves from ${first.subuh} on 1 ${m.ms} to ${last.subuh} by ${last.day} ${m.ms} — it shifts by a minute or two each day, so check the exact date in the table above.`
          : `Subuh shifts by a minute or two each day through ${m.ms}. Check the exact date in the table above once times load, or the official MUIS timetable.`,
    },
    {
      q: `What time is Maghrib (buka puasa) in ${m.ms} ${WAKTU_YEAR}?`,
      a:
        first && last
          ? `Maghrib in ${m.ms} ${WAKTU_YEAR} ranges from ${first.maghrib} at the start of the month to ${last.maghrib} at the end. If you are fasting, iftar (buka puasa) is at Maghrib on the day itself.`
          : `Maghrib is at sunset and moves slightly each day through ${m.ms}. If you are fasting, iftar (buka puasa) is at Maghrib on the day itself — check the table above for the exact date.`,
    },
    {
      q: `Are these ${m.ms} ${WAKTU_YEAR} times official MUIS times?`,
      a: "They are computed with the MUIS calculation method (Islamic Religious Council of Singapore) via the Aladhan API and typically match the official timetable. For religious observance, confirm against MUIS on muis.gov.sg or the MuslimSG app.",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Waktu Solat Singapore", path: "/waktu-solat-singapore" },
            { name: monthLabel, path: `/waktu-solat-singapore/${m.slug}` },
          ]),
          faqJsonLd(faq),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/waktu-solat-singapore">Waktu Solat Singapore</Link><span>›</span>
              <span style={{ color: "var(--ink)" }}>{monthLabel}</span>
            </nav>
            <span className="eyebrow">Monthly prayer timetable</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 760, marginTop: 8 }}>
              Waktu Solat Singapore — {monthLabel}
            </h1>
            <p className="muted" style={{ maxWidth: 700, marginTop: 12, fontSize: "1.05rem" }}>
              The full {m.ms} ({m.en}) {WAKTU_YEAR} prayer timetable for Singapore — daily Imsak, Subuh, Syuruk, Zohor,
              Asar, Maghrib and Isyak times, computed with the <strong>MUIS calculation method</strong> (Islamic Religious
              Council of Singapore) via the Aladhan API. Confirm against the official MUIS timetable for religious observance.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {rows ? (
            <WaktuTable rows={rows} monthLabel={monthLabel} todayISO={sgTodayISO()} />
          ) : (
            <WaktuUnavailable monthLabel={monthLabel} />
          )}

          {/* Prev / next month + back to the hub */}
          <nav aria-label="Other months" style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginTop: 18 }}>
            <span>
              {prev && (
                <Link className="link-inline" href={`/waktu-solat-singapore/${prev.slug}`} style={{ fontWeight: 600 }}>
                  ← {prev.ms} {WAKTU_YEAR}
                </Link>
              )}
            </span>
            <Link className="link-inline" href="/waktu-solat-singapore" style={{ fontWeight: 600 }}>
              Today&apos;s waktu solat
            </Link>
            <span>
              {next && (
                <Link className="link-inline" href={`/waktu-solat-singapore/${next.slug}`} style={{ fontWeight: 600 }}>
                  {next.ms} {WAKTU_YEAR} →
                </Link>
              )}
            </span>
          </nav>

          <p className="faint" style={{ fontSize: ".84rem", marginTop: 18, lineHeight: 1.55 }}>
            Times follow the MUIS calculation method for Singapore and typically match the official timetable to the
            minute. The authoritative source is always{" "}
            <a className="link-inline" href="https://www.muis.gov.sg/" target="_blank" rel="noopener noreferrer">MUIS</a>{" "}
            — confirm there or on the MuslimSG app before relying on a time for religious observance. See also{" "}
            <Link className="link-inline" href="/mosques">mosques in Singapore</Link>,{" "}
            <Link className="link-inline" href="/prayer-rooms">prayer rooms near you</Link> and the{" "}
            <Link className="link-inline" href="/tools/qibla">qibla finder</Link>.
          </p>
        </div>

        <Faq items={faq} title={`Waktu solat ${monthLabel} — quick answers`} />
      </div>
    </>
  );
}
