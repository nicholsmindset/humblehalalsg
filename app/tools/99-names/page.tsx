import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { NAMES_OF_ALLAH } from "@/lib/tools/names-of-allah";

export const metadata: Metadata = pageMeta({
  title: "99 Names of Allah — Al-Asma ul-Husna with meanings",
  description:
    "The 99 Names of Allah (Al-Asma ul-Husna) with Arabic, transliteration and English meaning. Read and learn the beautiful names.",
  path: "/tools/99-names",
});

export default function Page() {
  return (
    <ToolShell
      slug="99-names"
      title="99 Names of Allah"
      intro="Al-Asma ul-Husna — the beautiful names of Allah, with Arabic, transliteration and a widely-accepted English meaning for each."
    >
      <ol className="names-grid">
        {NAMES_OF_ALLAH.map((name) => (
          <li key={name.n} className="name-card">
            <span className="name-num">{name.n}</span>
            <span className="name-arabic" lang="ar" dir="rtl">{name.arabic}</span>
            <span className="name-translit">{name.translit}</span>
            <span className="name-meaning faint">{name.meaning}</span>
          </li>
        ))}
      </ol>
    </ToolShell>
  );
}
