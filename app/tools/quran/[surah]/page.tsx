import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { SURAHS } from "@/lib/tools/surahs";
import { getSurah, QURAN_ATTRIBUTION } from "@/lib/tools/quran";
import { QuranAudio } from "@/components/tools/quran-audio";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

// Prerender a handful of popular surahs; the rest render on-demand and cache (ISR).
export function generateStaticParams() {
  return [1, 18, 36, 55, 67, 112, 113, 114].map((n) => ({ surah: String(n) }));
}

function parseSurah(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 114 ? n : null;
}

export async function generateMetadata({ params }: { params: Promise<{ surah: string }> }): Promise<Metadata> {
  const n = parseSurah((await params).surah);
  if (!n) return pageMeta({ title: "Surah not found", path: "/tools/quran", index: false });
  const s = SURAHS[n - 1];
  return pageMeta({
    title: `Surah ${s.name} (${s.english}) — Arabic, English & audio`,
    description: `Read Surah ${s.name} — ${s.english} (chapter ${n}) of the Quran in Arabic with the Saheeh International English translation and recitation.`,
    path: `/tools/quran/${n}`,
  });
}

export default async function Page({ params }: { params: Promise<{ surah: string }> }) {
  const n = parseSurah((await params).surah);
  if (!n) notFound();
  const meta = SURAHS[n - 1];
  const surah = await getSurah(n);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "Quran", path: "/tools/quran" },
            { name: `Surah ${meta.name}`, path: `/tools/quran/${n}` },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <div className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <Link className="link-inline" href="/tools/quran">Quran</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>{meta.name}</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.4rem)" }}>
              {n}. Surah {meta.name} <span className="faint" style={{ fontWeight: 400 }}>· {meta.english}</span>
            </h1>
            {surah && (
              <p className="muted" style={{ marginTop: 8 }}>
                {surah.revelation === "Meccan" ? "Meccan" : "Medinan"} · {surah.ayahCount} ayahs
              </p>
            )}
            {surah && surah.ayahs.some((a) => a.audio) && (
              <div style={{ marginTop: 14 }}>
                <QuranAudio urls={surah.ayahs.map((a) => a.audio)} />
              </div>
            )}
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {surah ? (
            <div className="quran-reader tool-stage">
              {surah.ayahs.map((a) => (
                <article key={a.n} id={`ayah-${a.n}`} className="quran-ayah card">
                  <div className="quran-ayah-num">{n}:{a.n}</div>
                  <p className="quran-ayah-ar" lang="ar" dir="rtl">{a.arabic}</p>
                  <p className="quran-ayah-en">{a.english}</p>
                </article>
              ))}
              <p className="faint" style={{ fontSize: ".82rem", marginTop: 12 }}>{QURAN_ATTRIBUTION}</p>
            </div>
          ) : (
            <div className="empty">
              <h3>Couldn&apos;t load this surah right now</h3>
              <p className="muted">The Quran service is temporarily unavailable. Please try again shortly.</p>
            </div>
          )}

          <nav className="quran-nav" aria-label="Surah navigation">
            {n > 1 ? (
              <Link href={`/tools/quran/${n - 1}`} className="btn btn-outline btn-sm">
                ← {SURAHS[n - 2].name}
              </Link>
            ) : <span />}
            <Link href="/tools/quran" className="btn btn-ghost btn-sm">All surahs</Link>
            {n < 114 ? (
              <Link href={`/tools/quran/${n + 1}`} className="btn btn-outline btn-sm">
                {SURAHS[n].name} →
              </Link>
            ) : <span />}
          </nav>
        </div>
      </div>
    </>
  );
}
