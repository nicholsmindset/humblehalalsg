"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { CATEGORY_ORDER, toolHref, toolMatches, type Tool, type ToolCategory } from "@/lib/tools";
import { PrayerWidget } from "./prayer-widget";
import { QuranContinue } from "./quran-continue";

const FEATURED = ["prayer-times", "quran", "qibla", "zakat"];

/* "Build your daily rhythm" collections — slugs validated against the live
   registry at render time so an unknown slug can never ship a dead link. */
const RHYTHM: { title: string; sub: string; slugs: string[] }[] = [
  { title: "Daily worship", sub: "Strengthen your connection every day.", slugs: ["prayer-times", "duas", "tasbih"] },
  { title: "Track your practice", sub: "Stay consistent, stay mindful.", slugs: ["salah-tracker", "ramadan", "khatam"] },
  { title: "Plan with confidence", sub: "Stay ahead of zakat and key dates.", slugs: ["zakat", "date-converter", "islamic-calendar"] },
];

/* Intent cards — set the category filter (real behavior, no new routes). */
const INTENTS: { label: string; sub: string; icon: string; category: ToolCategory }[] = [
  { label: "I want to worship", sub: "Prayer times, Quran, duas and dhikr.", icon: "crescent", category: "Worship" },
  { label: "I want to calculate", sub: "Zakat, faraid and key Islamic dates.", icon: "chart", category: "Calculators" },
  { label: "I want to learn", sub: "Meanings, hadith and halal checks.", icon: "doc", category: "Knowledge" },
];

const CATEGORY_COPY: Record<ToolCategory, string> = {
  Worship: "Pray, read, remember, and orient your day around salah.",
  Trackers: "Private habit logs that stay in this browser.",
  Calculators: "Fast calculators for dates, zakat, faraid, stocks, and more.",
  Knowledge: "Learn meanings, duas, hadith, names, and halal ingredients.",
  Finders: "Move from tools into the live directory and prayer-space guides.",
};

const QUICK_PROMPTS = [
  "Prayer times",
  "Quran",
  "Zakat",
  "Qibla",
  "Duas",
  "Halal food",
];

function toolScore(t: Tool) {
  const i = FEATURED.indexOf(t.slug);
  return i === -1 ? 99 : i;
}

export function ToolsHub({ tools }: { tools: Tool[] }) {
  const live = useMemo(() => tools.filter((t) => t.live), [tools]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategory | "All">("All");

  const filtered = useMemo(() => {
    return live.filter((t) => {
      const categoryOk = category === "All" || t.category === category;
      if (!categoryOk) return false;
      return toolMatches(t, query);
    });
  }, [category, live, query]);

  const grouped = CATEGORY_ORDER
    .map((cat) => ({ category: cat, items: filtered.filter((t) => t.category === cat) }))
    .filter((g) => g.items.length);

  const featured = [...live].sort((a, b) => toolScore(a) - toolScore(b)).slice(0, 4);
  const localCount = live.filter((t) => t.privateLocal).length;

  return (
    <div className="tools-hub">
      <section className="tools-hero hh-pattern">
        <div className="hh-wrap tools-hero-grid">
          <div className="tools-hero-copy">
            <nav className="flex g6 center faint tools-crumb" aria-label="Breadcrumb">
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Tools</span>
            </nav>
            <span className="eyebrow">Deen tools</span>
            <h1>Free Islamic tools for everyday worship and planning</h1>
            <p>
              Prayer times, Quran, qibla, duas, zakat, trackers, and halal finders in one private,
              no-sign-up hub.
            </p>
            <div className="tools-hero-actions">
              <Link href="/tools/prayer-times" className="btn btn-primary">
                Check prayer times
              </Link>
              <Link href="/tools/quran" className="btn btn-soft">
                Read Quran
              </Link>
            </div>
            <div className="tools-trust-row">
              <span><Icon name="shield-check" size={14} /> No sign-up</span>
              <span><Icon name="eye" size={14} /> {localCount} on-device tools</span>
              <span><Icon name="crescent" size={14} /> Free forever</span>
            </div>
          </div>

          <div className="tools-hero-side">
            <PrayerWidget />
            <QuranContinue />
          </div>
        </div>
      </section>

      <section className="hh-wrap tools-command" aria-label="Find an Islamic tool">
        <h2 className="tools-command-title">What do you need today?</h2>
        <div className="tools-search">
          <Icon name="search" size={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Quran, zakat, prayer times, qibla, ingredients..."
            aria-label="Search tools"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <Icon name="x" size={16} />
            </button>
          )}
        </div>
        <div className="tools-category-pills" role="tablist" aria-label="Tool categories">
          <button type="button" role="tab" aria-selected={category === "All"} className={category === "All" ? "on" : ""} onClick={() => setCategory("All")}>
            All <span>{live.length}</span>
          </button>
          {CATEGORY_ORDER.map((cat) => (
            <button key={cat} type="button" role="tab" aria-selected={category === cat} className={category === cat ? "on" : ""} onClick={() => setCategory(cat)}>
              {cat} <span>{live.filter((t) => t.category === cat).length}</span>
            </button>
          ))}
        </div>
        <div className="tools-quick-row" aria-label="Popular tool searches">
          {QUICK_PROMPTS.map((q) => (
            <button key={q} type="button" onClick={() => setQuery(q)}>
              {q}
            </button>
          ))}
        </div>
      </section>

      <section className="hh-wrap tools-featured-section">
        <div className="tools-section-head">
          <div>
            <span className="eyebrow">Popular tools</span>
            <h2>Useful from the first tap</h2>
          </div>
          <p>Fast, lightweight tools for the actions people repeat every day.</p>
        </div>
        <div className="tools-featured-grid">
          {featured.map((t, i) => (
            <Link key={t.slug} href={toolHref(t)} className={`tools-feature-card ${i === 0 ? "primary" : ""}`}>
              <span className="tool-card-ico"><Icon name={t.icon} size={23} /></span>
              <span className="tools-feature-meta">{t.category}</span>
              <strong>{t.title}</strong>
              <p>{t.blurb}</p>
              <span className="tools-card-cta">Open tool <Icon name="arrow" size={15} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="hh-wrap tools-rhythm" aria-label="Build your daily rhythm">
        <div className="tools-section-head compact">
          <div>
            <span className="eyebrow">Daily rhythm</span>
            <h2>Build your daily rhythm</h2>
          </div>
        </div>
        <div className="tools-rhythm-grid">
          {RHYTHM.map((col) => {
            const items = col.slugs
              .map((s) => live.find((t) => t.slug === s))
              .filter((t): t is Tool => !!t);
            if (!items.length) return null;
            return (
              <div key={col.title} className="tools-rhythm-col">
                <h3>{col.title}</h3>
                <p>{col.sub}</p>
                <div className="tools-feature-list">
                  {items.map((t) => (
                    <Link key={t.slug} href={toolHref(t)} className="tools-feature-row">
                      <span><Icon name={t.icon} size={16} /></span>
                      <strong>{t.title}</strong>
                      <Icon name="arrow" size={15} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="tools-rhythm-col tools-privacy-col">
            <span className="tool-card-ico"><Icon name="shield-check" size={22} /></span>
            <h3>Your data stays on this device</h3>
            <p>
              {localCount} of these tools store everything in this browser only. Private by default. Always.
            </p>
          </div>
        </div>
      </section>

      <section className="hh-wrap hh-section tools-catalog">
        <div className="tools-section-head compact">
          <div>
            <span className="eyebrow">Tool library</span>
            <h2>{category === "All" ? "Browse all Islamic tools" : category}</h2>
          </div>
          <p>{filtered.length} tool{filtered.length === 1 ? "" : "s"} shown</p>
        </div>

        {grouped.length ? (
          grouped.map((g) => (
            <section key={g.category} className="tools-cat">
              <div className="tools-cat-title">
                <div>
                  <h3>{g.category}</h3>
                  <p>{CATEGORY_COPY[g.category]}</p>
                </div>
                <span>{g.items.length}</span>
              </div>
              <div className="tools-grid">
                {g.items.map((t) => (
                  <ToolCard key={t.slug} tool={t} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="tools-empty">
            <Icon name="search" size={26} />
            <h3>No tool found</h3>
            <p>Try “Quran”, “zakat”, “qibla”, “prayer”, or browse all tools.</p>
            <button type="button" className="btn btn-soft" onClick={() => { setQuery(""); setCategory("All"); }}>
              Reset filters
            </button>
          </div>
        )}

        <div className="tools-note">
          <Icon name="shield-check" size={18} />
          <p>
            Tools marked “On-device” keep your data in this browser only. Nothing is uploaded unless a tool clearly says it uses an online lookup.
          </p>
        </div>

        <div className="tools-section-head compact" style={{ marginTop: 34 }}>
          <div>
            <span className="eyebrow">Quick start</span>
            <h2>Not sure where to begin?</h2>
          </div>
        </div>
        <div className="tools-intent-grid">
          {INTENTS.map((it) => (
            <button
              key={it.category}
              type="button"
              className="tools-intent-card"
              onClick={() => {
                setQuery("");
                setCategory(it.category);
                document.querySelector(".tools-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span className="tool-card-ico"><Icon name={it.icon} size={20} /></span>
              <span>
                <strong>{it.label}</strong>
                <em>{it.sub}</em>
              </span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
        </div>
        <p className="tools-suggest-line">
          <Icon name="edit" size={14} /> Missing something useful?{" "}
          <Link className="link-inline" href="/suggest">Suggest an Islamic tool →</Link>
        </p>
      </section>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={toolHref(tool)} className="tool-card">
      <span className="tool-card-ico">
        <Icon name={tool.icon} size={21} />
      </span>
      <span className="tool-card-body">
        <span className="tool-card-topline">
          <span>{tool.category}</span>
          {tool.privateLocal && <em><Icon name="eye" size={11} /> On-device</em>}
        </span>
        <strong className="tool-card-name">{tool.title}</strong>
        <span className="tool-card-blurb">{tool.blurb}</span>
      </span>
      <Icon name="arrow" size={18} className="tool-card-arrow" />
    </Link>
  );
}
