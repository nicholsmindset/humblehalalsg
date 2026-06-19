/* End-of-tool newsletter CTA. Server component — renders the (client) Newsletter
   with a slug-matched lead-magnet hook and per-tool `source` attribution.
   Mounted once in ToolShell so every /tools/* page gets it automatically. */
import { Newsletter } from "./newsletter";

// Slug-matched copy. Falls back to the generic weekly-guide pitch.
const HOOKS: Record<string, { title: string; blurb: string; cta: string }> = {
  zakat: {
    title: "Get the printable Zakat 2026 worksheet",
    blurb: "Plus a weekly halal guide — nisab updates, Ramadan reminders and MUIS-verified food finds across Singapore.",
    cta: "Email me the worksheet",
  },
  inheritance: {
    title: "Get the plain-English Faraid guide",
    blurb: "A simplified inheritance walkthrough, plus our weekly halal newsletter for the Singapore Muslim community.",
    cta: "Email me the guide",
  },
  "halal-stocks": {
    title: "Get the halal stock watchlist",
    blurb: "Screened tickers and a weekly halal-living digest for Singapore — food, finance, events and deals.",
    cta: "Send me the watchlist",
  },
  ramadan: {
    title: "Get the Ramadan 2026 Planner",
    blurb: "A 30-day fasting tracker, iftar spots and prayer times — plus weekly halal finds across Singapore.",
    cta: "Send me the planner",
  },
  "prayer-times": {
    title: "Get the 2026 prayer-times guide",
    blurb: "Annual salah times plus a weekly halal guide — new MUIS-verified spots, mosque events and deals.",
    cta: "Email me the guide",
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
