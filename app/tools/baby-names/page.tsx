import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { BabyNameFilter } from "@/components/tools/baby-name-filter";
import { BABY_NAMES } from "@/lib/tools/baby-names";

export const metadata: Metadata = pageMeta({
  title: "Muslim Baby Names — meanings for boys & girls",
  description:
    "Find meaningful Muslim baby names for boys and girls, with their meanings. Filter by gender and search by name or meaning. Free, no sign-up.",
  path: "/tools/baby-names",
});

export default async function Page({ searchParams }: { searchParams: Promise<{ gender?: string; q?: string }> }) {
  const sp = await searchParams;
  const gender = sp.gender === "boy" || sp.gender === "girl" ? sp.gender : "all";
  const q = (sp.q || "").trim();
  const ql = q.toLowerCase();

  const names = BABY_NAMES
    .filter((n) => (gender === "all" ? true : n.gender === gender))
    .filter((n) => (ql ? n.name.toLowerCase().includes(ql) || n.meaning.toLowerCase().includes(ql) : true))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ToolShell
      slug="baby-names"
      title="Muslim Baby Names"
      intro="Meaningful names for boys and girls, with their meanings. Filter by gender or search by name or meaning."
    >
      <BabyNameFilter gender={gender} q={q} />

      <p className="faint" style={{ margin: "14px 0" }}>
        {names.length} name{names.length === 1 ? "" : "s"}
        {gender !== "all" ? ` for ${gender === "boy" ? "boys" : "girls"}` : ""}
        {q ? ` matching “${q}”` : ""}
      </p>

      {names.length > 0 ? (
        <ul className="babyname-grid">
          {names.map((n) => (
            <li key={`${n.name}-${n.gender}`} className={`babyname-card card babyname-${n.gender}`}>
              <div className="babyname-top">
                <span className="babyname-name">{n.name}</span>
                <span className={`babyname-gender ${n.gender}`}>{n.gender === "boy" ? "Boy" : "Girl"}</span>
              </div>
              <p className="babyname-meaning muted">{n.meaning}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No names match your filters. Try a different search.</p>
      )}

      <p className="faint" style={{ fontSize: ".82rem", marginTop: 16 }}>
        Meanings are commonly-cited renderings — please verify a name&apos;s meaning and pronunciation before naming.
      </p>
    </ToolShell>
  );
}
