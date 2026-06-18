import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { DUA_GROUPS } from "@/lib/tools/duas";

export const metadata: Metadata = pageMeta({
  title: "Dua Library — authentic everyday duas with sources",
  description:
    "A library of authentic everyday duas by occasion — waking, sleeping, eating, travel, entering the masjid and more — with Arabic, transliteration, translation and source.",
  path: "/tools/duas",
});

export default function Page() {
  return (
    <ToolShell
      slug="duas"
      title="Dua Library"
      intro="Authentic everyday supplications, grouped by occasion. Each dua shows Arabic, transliteration, an English translation, and its source."
    >
      <div className="duas">
        {DUA_GROUPS.map((group) => (
          <section key={group.occasion} className="dua-group">
            <h2 className="dua-group-h">{group.occasion}</h2>
            <div className="stack g12">
              {group.items.map((d) => (
                <article key={d.title} className="card dua-card">
                  <div className="dua-title">{d.title}</div>
                  <p className="dua-arabic" lang="ar" dir="rtl">{d.arabic}</p>
                  <p className="dua-translit">{d.translit}</p>
                  <p className="dua-translation muted">&ldquo;{d.translation}&rdquo;</p>
                  <span className="tag dua-source">{d.source}</span>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="faint" style={{ fontSize: ".82rem", marginTop: 16 }}>
        A conservative starter set of well-attested supplications. Learn correct pronunciation from a qualified
        teacher, and verify references in their original collections.
      </p>
    </ToolShell>
  );
}
