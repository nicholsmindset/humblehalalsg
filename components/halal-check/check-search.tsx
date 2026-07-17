"use client";

/* "Check another brand or ingredient" — self-contained client search (no SPA
   context; usable on server-rendered content pages). Searches the serialized
   brand list (props) AND the additives dataset (client-safe import). Brands
   navigate to /is-halal/<slug>; additives deep-link into the ingredient
   checker via ?q= (seeded on mount there). */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "../ui";
import { track } from "@/lib/analytics";
import { searchAdditives } from "@/lib/tools/ingredients";

export interface CheckBrand {
  slug: string;
  brand: string;
  tone: string; // yes | warn | no
  verdict: string; // Yes / No / Partly / Not certified / Unconfirmed
  aliases?: string[];
}

interface Suggestion {
  key: string;
  label: string;
  sub?: string;
  href: string;
  tone?: string;
  pill?: string;
}

export function CheckAnotherSearch({
  brands,
  chips,
  heading = "Check another brand or ingredient",
}: {
  brands: CheckBrand[];
  chips: { label: string; href: string }[];
  heading?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const brandHits = brands
      .filter((b) => b.brand.toLowerCase().includes(query) || b.aliases?.some((a) => a.toLowerCase().includes(query)))
      .slice(0, 5)
      .map((b) => ({
        key: `b:${b.slug}`,
        label: `Is ${b.brand} halal?`,
        href: `/is-halal/${b.slug}`,
        tone: b.tone,
        pill: b.verdict,
      }));
    const additiveHits = searchAdditives(query)
      .slice(0, 4)
      .map((a) => ({
        key: `a:${a.code || a.name}`,
        label: a.code ? `${a.code} — ${a.name}` : a.name,
        sub: "Ingredient",
        href: `/tools/ingredient-checker?q=${encodeURIComponent(a.code || a.name)}`,
      }));
    return [...brandHits, ...additiveHits];
  }, [q, brands]);

  const go = (s?: Suggestion) => {
    const target = s || suggestions[0];
    track.search(q, suggestions.length);
    router.push(target ? target.href : "/is-halal");
  };

  return (
    <section className="hcx-search hh-pattern">
      <h2 className="hcx-h2" style={{ textAlign: "center" }}>{heading}</h2>
      <div className="hcx-search-box" ref={boxRef}>
        <form
          className="searchbar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <Icon name="search" size={18} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter" && suggestions[active]) { e.preventDefault(); go(suggestions[active]); }
              else if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Try BreadTalk, gelatin, E471…"
            aria-label="Search brands and ingredients"
            aria-expanded={open && suggestions.length > 0}
            role="combobox"
            aria-controls="hcx-suggest-list"
          />
          <button className="btn btn-primary" type="submit">Check now</button>
        </form>
        {open && suggestions.length > 0 && (
          <div className="hcx-suggest" id="hcx-suggest-list" role="listbox">
            {suggestions.map((s, i) => (
              <Link
                key={s.key}
                href={s.href}
                role="option"
                aria-selected={i === active}
                className={`hcx-suggest-item ${i === active ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); go(s); }}
              >
                <span className="hcx-suggest-label">{s.label}</span>
                {s.pill ? <span className={`hs-pill hs-${s.tone}`}>{s.pill}</span> : s.sub ? <span className="hcx-suggest-sub">{s.sub}</span> : null}
              </Link>
            ))}
          </div>
        )}
      </div>
      {chips.length > 0 && (
        <div className="pillbar" style={{ justifyContent: "center", marginTop: 12 }}>
          <span className="faint" style={{ fontSize: ".82rem", alignSelf: "center" }}>Popular searches:</span>
          {chips.map((c) => (
            <Link key={c.label} href={c.href} className="chip">{c.label}</Link>
          ))}
        </div>
      )}
    </section>
  );
}
