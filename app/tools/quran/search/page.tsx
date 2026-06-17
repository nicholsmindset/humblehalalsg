import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { searchQuran, QURAN_ATTRIBUTION } from "@/lib/tools/quran";
import { QuranSearchBox } from "@/components/tools/quran-search-box";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

// Results depend on the query, so keep search pages out of the index.
export const metadata: Metadata = pageMeta({
  title: "Search the Quran",
  description: "Search the Quran for any word and read matching ayahs with their English translation.",
  path: "/tools/quran/search",
  index: false,
});

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q || "").trim();
  const result = q ? await searchQuran(q) : null;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "Quran", path: "/tools/quran" },
            { name: "Search", path: "/tools/quran/search" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <div className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/tools/quran">Quran</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Search</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.4rem)" }}>Search the Quran</h1>
            <div style={{ marginTop: 14, maxWidth: 560 }}>
              <QuranSearchBox initial={q} />
            </div>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="tool-stage">
            {!q && <p className="muted">Type a word above (English translation) to find matching ayahs.</p>}

            {q && result === null && (
              <p className="muted">Search is temporarily unavailable. Please try again shortly.</p>
            )}

            {q && result && (
              <>
                <p className="faint" style={{ marginBottom: 14 }}>
                  {result.count > 0
                    ? `${result.count} ayah${result.count === 1 ? "" : "s"} match “${q}”${result.matches.length < result.count ? ` (showing first ${result.matches.length})` : ""}`
                    : `No ayahs found for “${q}”.`}
                </p>
                <div className="stack g10">
                  {result.matches.map((m) => (
                    <Link key={`${m.surah}:${m.ayah}`} href={`/tools/quran/${m.surah}#ayah-${m.ayah}`} className="card card-hover quran-result">
                      <span className="quran-result-ref">{m.surahName} · {m.surah}:{m.ayah}</span>
                      <p className="quran-result-text">{m.text}</p>
                    </Link>
                  ))}
                </div>
                {result.count > 0 && (
                  <p className="faint" style={{ fontSize: ".82rem", marginTop: 16 }}>{QURAN_ATTRIBUTION}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
