import type { Metadata } from "next";
import Link from "next/link";
import { getPrayerCalendar, getPrayerTimes } from "@/lib/prayer-times";
import { WAKTU_MONTHS, WAKTU_YEAR, sgTodayISO } from "@/lib/waktu-solat";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { Faq } from "@/components/faq";
import { Newsletter } from "@/components/newsletter";
import { WaktuTable, WaktuUnavailable } from "./timetable";

/* Waktu Solat hub — "waktu solat singapore" (9,000/mo, KD 0 per
   docs/seo/content-calendar-final.md). Competitors serve JS widgets; this page
   is fully server-rendered HTML: today's times, the whole month's table and
   12 monthly pages, all crawlable. Times: Aladhan API, MUIS method (11). */

export const revalidate = 3600; // hourly — "today" flips at SGT midnight

export const metadata: Metadata = pageMeta({
  title: "Waktu Solat Singapore — Today's Prayer Times & 2026 Timetable",
  description:
    "Waktu solat Singapore hari ini — today's Subuh, Zohor, Asar, Maghrib and Isyak times plus Imsak and Syuruk, the full monthly timetable, and every month of 2026. MUIS calculation method.",
  path: "/waktu-solat-singapore",
  absoluteTitle: true,
});

export default async function Page() {
  const todayISO = sgTodayISO(); // "YYYY-MM-DD" in SGT
  const [yy, mm] = todayISO.split("-").map(Number);
  const [rows, live] = await Promise.all([getPrayerCalendar(yy, mm), getPrayerTimes()]);

  // Today's row from the month table; getPrayerTimes() is the fallback so the
  // hero still shows the five prayers (minus Imsak) if the calendar call fails.
  const today = rows?.find((r) => r.dateISO === todayISO) ?? null;
  const fallback = !today && live ? live : null;

  // Malay month names are year-independent, so this stays correct past 2026.
  const monthMeta = WAKTU_MONTHS[mm - 1];
  const monthLabel = `${monthMeta.ms} ${yy}`;
  const todayHuman = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore", weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  // Visible FAQ === FAQPage JSON-LD (never schema-only answers). The Subuh
  // answer only quotes a time when we actually fetched one — honesty rule.
  const faq = [
    {
      q: "What time is Subuh in Singapore today?",
      a: `${today ? `Subuh today (${todayHuman}) is at ${today.subuh}, and its window ends at Syuruk (sunrise) at ${today.syuruk}. ` : ""}Subuh shifts by a minute or two each day with the sun, so always check today's row in the timetable above rather than relying on yesterday's time.`,
    },
    {
      q: "Are these prayer times MUIS-approved?",
      a: "The times on this page are computed with the MUIS (Majlis Ugama Islam Singapura) calculation method for Singapore, served via the Aladhan API. MUIS is the official authority — for religious observance, confirm against the official MUIS timetable on muis.gov.sg or the MuslimSG app.",
    },
    {
      q: "What is the difference between Imsak and Subuh?",
      a: "Imsak is a precautionary marker about 10 minutes before Subuh — during Ramadan it signals when to stop eating suhoor. Subuh (Fajr) is the actual start of the dawn prayer and, in the majority view, the true cut-off for fasting. Imsak is a buffer, not a separate prayer.",
    },
    {
      q: "Why do prayer times change every day?",
      a: "Each prayer time is set by the sun's position over Singapore — dawn, midday, afternoon shadow length, sunset and twilight. As the Earth's tilt and orbit shift these moments slightly through the year, every prayer time moves by a minute or two each day.",
    },
    {
      q: "What does Syuruk mean?",
      a: "Syuruk is sunrise. It is not one of the five daily prayers — it appears on Singapore timetables because it marks the end of the Subuh window: once the sun rises, the time for Subuh is over.",
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Waktu Solat Singapore", path: "/waktu-solat-singapore" },
          ]),
          faqJsonLd(faq),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span><span style={{ color: "var(--ink)" }}>Waktu Solat Singapore</span>
            </nav>
            <span className="eyebrow">Prayer times · {todayHuman}</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 760, marginTop: 8 }}>
              Waktu Solat Singapore — Today&apos;s Prayer Times
            </h1>
            <p className="muted" style={{ maxWidth: 700, marginTop: 12, fontSize: "1.05rem" }}>
              Today&apos;s Subuh, Zohor, Asar, Maghrib and Isyak times for Singapore — plus Imsak, Syuruk and the full{" "}
              {monthLabel} timetable below, all on one fast page.
              {(today || fallback) && (today?.hijri || fallback?.hijri) ? (
                <> Today is <strong>{today?.hijri || fallback?.hijri}</strong> in the Hijri calendar.</>
              ) : null}
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {/* Today's times — seven tiles, server-rendered */}
          <section style={{ marginBottom: 30 }} aria-labelledby="today-heading">
            <h2 id="today-heading" style={{ fontSize: "1.35rem", marginBottom: 12 }}>Today&apos;s waktu solat</h2>
            {today ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                {[
                  ["Imsak", today.imsak],
                  ["Subuh", today.subuh],
                  ["Syuruk", today.syuruk],
                  ["Zohor", today.zohor],
                  ["Asar", today.asar],
                  ["Maghrib", today.maghrib],
                  ["Isyak", today.isyak],
                ].map(([name, time]) => (
                  <div key={name} className="stat">
                    <div className="v" style={{ fontSize: "1.4rem" }}>{time}</div>
                    <div className="l">{name}</div>
                  </div>
                ))}
              </div>
            ) : fallback ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                {fallback.times.map((t) => (
                  <div key={t.name} className="stat">
                    <div className="v" style={{ fontSize: "1.4rem" }}>{t.time}</div>
                    <div className="l">{t.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <WaktuUnavailable monthLabel="today" />
            )}
            <p className="faint" style={{ fontSize: ".84rem", marginTop: 12, lineHeight: 1.55 }}>
              Times follow the <strong>MUIS calculation method (Islamic Religious Council of Singapore)</strong>, via the
              Aladhan API. For religious observance, confirm against the official MUIS timetable on{" "}
              <a className="link-inline" href="https://www.muis.gov.sg/" target="_blank" rel="noopener noreferrer">muis.gov.sg</a>{" "}
              or the MuslimSG app — published times can occasionally differ by a minute.
            </p>
          </section>

          {/* This month, in full */}
          <section style={{ marginBottom: 30 }} aria-labelledby="month-heading">
            <h2 id="month-heading" style={{ fontSize: "1.35rem", marginBottom: 12 }}>
              {monthLabel} prayer timetable
            </h2>
            {rows ? (
              <WaktuTable rows={rows} monthLabel={monthLabel} todayISO={todayISO} />
            ) : (
              <WaktuUnavailable monthLabel={monthLabel} />
            )}
          </section>

          {/* Monthly pages — every month of 2026 */}
          <section style={{ marginBottom: 30 }} aria-labelledby="months-heading">
            <h2 id="months-heading" style={{ fontSize: "1.35rem", marginBottom: 12 }}>Waktu solat by month ({WAKTU_YEAR})</h2>
            <div className="hub-grid">
              {WAKTU_MONTHS.map((m) => (
                <Link key={m.slug} href={`/waktu-solat-singapore/${m.slug}`} className="hub-link">
                  <span>{m.ms} {WAKTU_YEAR}</span>
                  <span className="hub-link-arr" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Short bilingual explainer */}
          <section style={{ marginBottom: 30, maxWidth: 760 }} aria-labelledby="about-heading">
            <h2 id="about-heading" style={{ fontSize: "1.35rem", marginBottom: 12 }}>About waktu solat in Singapore</h2>
            <div className="muted" style={{ lineHeight: 1.7, display: "grid", gap: 12 }}>
              <p>
                Waktu solat is the Malay term for the five daily prayer times — <strong>Subuh</strong> (dawn),{" "}
                <strong>Zohor</strong> (midday), <strong>Asar</strong> (afternoon), <strong>Maghrib</strong> (sunset) and{" "}
                <strong>Isyak</strong> (night). In Singapore the official timetable is set by MUIS, and because each time
                follows the sun&apos;s position, it shifts by a minute or two daily. On Fridays, the congregational Jumaat
                prayer at the mosque replaces Zohor.
              </p>
              <div lang="ms">
                <p>
                  Waktu solat di Singapura ditetapkan oleh MUIS (Majlis Ugama Islam Singapura) dan berubah sedikit setiap
                  hari mengikut kedudukan matahari. Imsak ialah waktu berhenti makan sahur, kira-kira sepuluh minit sebelum
                  Subuh; Syuruk pula menandakan matahari terbit dan tamatnya waktu Subuh. Sila rujuk jadual rasmi MUIS
                  untuk pengesahan.
                </p>
              </div>
            </div>
          </section>

          {/* Related — mosques, prayer spaces, deen tools */}
          <section style={{ marginBottom: 10 }} aria-labelledby="related-heading">
            <h2 id="related-heading" style={{ fontSize: "1.35rem", marginBottom: 12 }}>Plan your prayers</h2>
            <div className="hub-grid">
              <Link href="/mosques" className="hub-link"><span>Mosques in Singapore — profiles &amp; Jumaat info</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
              <Link href="/prayer-rooms" className="hub-link"><span>Prayer rooms (musollah) near you</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
              <Link href="/tools/qibla" className="hub-link"><span>Qibla direction finder</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
              <Link href="/tools/imsak-timetable" className="hub-link"><span>Imsak &amp; iftar times (Ramadan)</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
              <Link href="/tools/prayer-times" className="hub-link"><span>Prayer times for your exact location</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
              <Link href="/blog/waktu-solat-singapore" className="hub-link"><span>Guide: how Singapore prayer times work</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            </div>
          </section>
        </div>

        <Faq items={faq} title="Waktu solat Singapore — your questions" />

        <div className="hh-wrap" style={{ paddingBottom: 40 }}>
          <section className="newsletter-card">
            <span className="eyebrow">The weekly halal guide</span>
            <h2 style={{ fontSize: "1.25rem", margin: "6px 0 10px" }}>Ramadan dates, prayer guides &amp; halal finds</h2>
            <p className="muted" style={{ marginBottom: 12 }}>One useful email a week for Muslim Singapore — no spam.</p>
            <Newsletter source="waktu-solat-hub" cta="Subscribe" />
          </section>
        </div>
      </div>
    </>
  );
}
