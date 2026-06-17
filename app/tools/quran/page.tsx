import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SURAHS } from "@/lib/tools/surahs";
import { QuranSearchBox } from "@/components/tools/quran-search-box";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = pageMeta({
  title: "Read the Quran — all 114 surahs with English & recitation",
  description:
    "Read the Holy Quran online: all 114 surahs in Arabic with the Saheeh International English translation and audio recitation. Search the Quran for any word. Free, no sign-up.",
  path: "/tools/quran",
});

export default function Page() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Surahs of the Quran",
    numberOfItems: SURAHS.length,
    itemListElement: SURAHS.map((s) => ({
      "@type": "ListItem",
      position: s.n,
      name: `${s.n}. ${s.name}`,
      url: `/tools/quran/${s.n}`,
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "Quran", path: "/tools/quran" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <div className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <Link className="link-inline" href="/tools">Tools</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Quran</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.9rem,4.5vw,2.8rem)", maxWidth: 760 }}>Read the Quran</h1>
            <p className="muted" style={{ maxWidth: 640, marginTop: 10, fontSize: "1.05rem" }}>
              All 114 surahs in Arabic with the Saheeh International translation and recitation. Or search the
              Quran for any word.
            </p>
            <div style={{ marginTop: 16, maxWidth: 560 }}>
              <QuranSearchBox />
            </div>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <ol className="quran-surah-list">
            {SURAHS.map((s) => (
              <li key={s.n}>
                <Link href={`/tools/quran/${s.n}`} className="quran-surah-row card card-hover">
                  <span className="quran-surah-num">{s.n}</span>
                  <span className="quran-surah-name">
                    {s.name}
                    <span className="faint"> · {s.english}</span>
                  </span>
                  <span className="quran-surah-ar" lang="ar" dir="rtl">{s.name}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
