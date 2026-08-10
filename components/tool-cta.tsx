/* End-of-tool newsletter CTA. Server component — renders the (client) Newsletter
   with a slug-matched lead-magnet hook and per-tool `source` attribution.
   Mounted once in ToolShell so every /tools/* page gets it automatically. */
import { Newsletter } from "./newsletter";

// Slug-matched copy. Falls back to the generic weekly-guide pitch.
const HOOKS: Record<string, { title: string; blurb: string; cta: string }> = {
  zakat: {
    title: "Get the Zakat calculation checklist",
    blurb: "A practical four-step checklist, plus the calculator and our weekly halal guide for Singapore.",
    cta: "Email me the checklist",
  },
  inheritance: {
    title: "Get the plain-English Faraid guide",
    blurb: "A simplified inheritance walkthrough, plus our weekly halal newsletter for the Singapore Muslim community.",
    cta: "Email me the guide",
  },
  "halal-stocks": {
    title: "Get the halal stock-screening checklist",
    blurb: "Four practical screening checks, plus our weekly halal-living guide for Singapore.",
    cta: "Send me the checklist",
  },
  ramadan: {
    title: "Get the Ramadan 2026 Planner",
    blurb: "A 30-day fasting tracker, iftar spots and prayer times — plus weekly halal finds across Singapore.",
    cta: "Send me the planner",
  },
  "prayer-times": {
    title: "Keep Singapore prayer times close",
    blurb: "Get the live prayer-times guide, plus weekly mosque, event and halal-food updates.",
    cta: "Email me the guide",
  },
  "ingredient-checker": {
    title: "Shop halal with confidence",
    blurb: "Get our weekly halal guide for Singapore — new MUIS-verified finds, label tips and deals. We add new ingredients to this checker regularly.",
    cta: "Get the weekly guide",
  },
};

const DEFAULT = {
  title: "Get the weekly halal guide",
  blurb: "MUIS-verified food finds, mosque events and deals across Singapore — free, every week.",
  cta: "Subscribe",
};

export function ToolCta({ slug }: { slug: string }) {
  const copy = HOOKS[slug] ?? DEFAULT;
  return (
    <section className="tool-cta newsletter-card" style={{ marginTop: 28, maxWidth: 640 }}>
      <span className="eyebrow">🌙 HumbleHalal newsletter</span>
      <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>{copy.title}</h2>
      <p className="muted" style={{ marginTop: 8 }}>{copy.blurb}</p>
      <div style={{ marginTop: 14 }}>
        <Newsletter source={`tool:${slug}`} cta={copy.cta} />
      </div>
    </section>
  );
}
