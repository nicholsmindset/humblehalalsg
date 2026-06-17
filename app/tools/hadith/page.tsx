import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { HadithOfDay } from "@/components/tools/hadith-of-day";
import { HADITHS } from "@/lib/tools/hadith";

export const metadata: Metadata = pageMeta({
  title: "Hadith of the Day — authentic sayings of the Prophet ﷺ",
  description:
    "A daily authentic hadith with its source, plus a collection of well-known sayings of the Prophet Muhammad ﷺ from Bukhari, Muslim and beyond. Free, no sign-up.",
  path: "/tools/hadith",
});

export default function Page() {
  return (
    <ToolShell
      slug="hadith"
      title="Hadith of the Day"
      intro="A daily saying of the Prophet ﷺ with its source — plus a small collection of well-known authentic hadiths to read any time."
    >
      <HadithOfDay />

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: 14 }}>More hadiths</h2>
        <div className="stack g12">
          {HADITHS.map((h, i) => (
            <article key={i} className="card hadith-card">
              {h.arabic && <p className="hadith-arabic" lang="ar" dir="rtl">{h.arabic}</p>}
              <p className="hadith-text">&ldquo;{h.text}&rdquo;</p>
              <span className="tag">{h.source}</span>
            </article>
          ))}
        </div>
        <p className="faint" style={{ fontSize: ".82rem", marginTop: 16 }}>
          A conservative selection given as widely-accepted English renderings. Verify the exact wording and
          grading in the original collections.
        </p>
      </section>
    </ToolShell>
  );
}
