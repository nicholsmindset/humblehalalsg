"use client";

/* Humble Halal — Consumer screens: Home, Explore, Map, Detail
   (ported from screens-consumer.jsx). */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HHData, SG_CENTER } from "@/lib/data";
import { useDirectory, useCatalog } from "../directory-context";
import type { BadgeKey, LatLng, Listing, Review } from "@/lib/types";
import { haversineKm, formatKm, mapsSearchUrl, directionsUrl } from "@/lib/geo";
import { telHref, waHref, webHref, igHref } from "@/lib/contact";
import { openStatus, isOpenNow, DAY_LABELS, fmt12, sgTodayIdx } from "@/lib/hours";
import { scoreListing, scoreTone, muisUnbacked } from "@/lib/halal-score";
import { canUse, galleryMax } from "@/lib/plans";
import { HalalConfidenceBadge } from "../halal-confidence-badge";
import { halalSgVerifyUrl } from "@/lib/muis";
import { shareOrCopy } from "@/lib/share";
import { track, type LeadAction } from "@/lib/analytics";
import { useApp } from "../app-context";
import { Badge, Empty, Icon, ImagePh, ListingCard, Rating, SearchBar, SectionHead } from "../ui";
import { CategoryButton, MobileHeader } from "../ui";
import { SponsoredSlot } from "../sponsored-slot";
import { CertifiedToggle } from "../chrome";
import { EventsStrip } from "./events";
import { MapView, type MapPoint } from "../map/map-view";
import { Faq } from "../faq";
import { HomeSeoContent } from "./home-seo";
import { HOME_FAQ } from "@/lib/faq";
import { Breadcrumbs } from "../breadcrumbs";
import { Newsletter } from "../newsletter";

/* =============================================================
   HOME
============================================================= */
export function HomeScreen() {
  const { navigate, state } = useApp();
  const dir = useDirectory();
  const { categories: catCategories, areas: catAreas } = useCatalog();
  const [q, setQ] = useState("");
  const tw = state.tweaks;

  const doSearch = (val: string) => navigate("explore", { q: val });

  // Popular areas, derived from the LIVE directory so the counts are real — the
  // static catalog ships `count: 0`, which is why every tile used to read
  // "0 places". We group the actual listings by their area name, keep the
  // busiest areas, and borrow tone/image metadata from the catalog when the area
  // is a known one. Falls back to the catalog list (with any real counts filled
  // in) if the directory is empty (e.g. static/preview data) so the section is
  // never blank.
  const popularAreas = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of dir.listings) {
      const name = (l.area || "").trim();
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
    const meta = new Map(catAreas.map((a) => [a.name, a] as const));
    const ranked = [...counts.entries()]
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const m = meta.get(name);
        return { id: m?.id ?? name.toLowerCase(), name, count, tone: m?.tone ?? "cream", image: m?.image };
      });
    if (ranked.length >= 4) return ranked.slice(0, 8);
    return catAreas.map((a) => ({ ...a, count: counts.get(a.name) ?? a.count }));
  }, [dir.listings, catAreas]);

  return (
    <div className="screen-in hh-page">
      {/* PRE-LAUNCH NOTICE — set env NEXT_PUBLIC_PRELAUNCH="0" (Vercel → Settings → Env)
          and redeploy to hide this at launch. Content stays public + indexed; this only
          sets visitor expectations. */}
      {process.env.NEXT_PUBLIC_PRELAUNCH !== "0" && (
        <div style={{ background: "var(--emerald)", color: "#fff" }}>
          <div
            className="hh-wrap"
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              padding: "9px 16px",
              textAlign: "center",
              fontSize: ".9rem",
              lineHeight: 1.45,
            }}
          >
            <strong style={{ fontWeight: 800 }}>🌙 Early preview</strong>
            <span style={{ opacity: 0.92 }}>
              Humble Halal is launching soon — we&apos;re still adding listings &amp; features. Have a
              look around, and subscribe below for launch updates.
            </span>
          </div>
        </div>
      )}

      {/* HERO */}
      <Hero variant={tw.hero} q={q} setQ={setQ} doSearch={doSearch} navigate={navigate} />

      {/* NEWSLETTER — low-friction weekly-guide capture, below the hero search */}
      <section className="hh-wrap" style={{ marginTop: 22 }}>
        <div className="home-nl-band">
          <div className="home-nl-copy">
            <strong>🌙 Get the weekly halal guide</strong>
            <span className="muted">New MUIS-verified spots, mosque events &amp; deals — free, every week.</span>
          </div>
          <Newsletter source="hero" cta="Subscribe" />
        </div>
      </section>

      {/* CATEGORIES — top 8 + view all */}
      <section className="hh-wrap home-cats" style={{ marginTop: 30 }}>
        <SectionHead title="Browse by category" action="View all" onAction={() => navigate("explore")} />
        <div className="cat-grid">
          {catCategories.slice(0, 8).map((c) => (
            <CategoryButton key={c.id} cat={c}
              onClick={() => c.id === "mosques" ? navigate("map") : navigate("explore", { cat: c.id })} />
          ))}
        </div>
      </section>

      {/* DISCOVER — one tabbed rail (replaces Featured + New) */}
      <div className="home-band-white">
        <div className="hh-wrap hh-section">
          <DiscoverRail dir={dir} certifiedOnly={!!state.prefs?.certifiedOnly} navigate={navigate} />
        </div>
      </div>

      {/* SPONSORED — renders only when the team has an active homepage campaign */}
      <div className="hh-wrap" style={{ marginTop: 8 }}>
        <SponsoredSlot placement="homepage_hero" />
      </div>

      {/* POPULAR AREAS */}
      <section className="hh-wrap hh-section">
        <SectionHead title="Popular areas in Singapore" action="Browse all areas" onAction={() => navigate("explore")} />
        <div className="area-grid">
          {popularAreas.map((a) => (
            <button key={a.id} className="area-card card card-hover" onClick={() => navigate("explore", { area: a.name })}>
              <ImagePh label={a.name.toLowerCase() + " street"} tone={a.tone} src={a.image} style={{ position: "absolute", inset: 0 }} icon="building" />
              <div className="area-ov">
                <span className="area-name">{a.name}</span>
                {a.count > 0 && <span className="area-count">{a.count} {a.count === 1 ? "place" : "places"}</span>}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* HALAL TRAVEL BAND (emerald) */}
      <section className="home-band-emerald hh-pattern">
        <div className="hh-wrap home-travel-band">
          <div className="htb-text">
            <span className="eyebrow" style={{ color: "#cfe0da" }}>Halal travel</span>
            <h2>Plan your whole trip — hotels &amp; flights</h2>
            <p>Muslim-friendly stays and flights for Umrah, Hajj and everyday travel: prayer rooms, halal dining nearby, alcohol-free options, Muslim-meal flags, prayer-aware layovers and qibla — all in one place.</p>
          </div>
          <div className="htb-cta">
            <button className="btn btn-gold btn-lg" onClick={() => navigate("travel")}>Find a hotel</button>
            <button className="btn btn-lg htb-ghost" onClick={() => navigate("travel-flights")}>Search flights</button>
          </div>
        </div>
      </section>

      {/* SLIM TRUST STRIP */}
      <section className="hh-wrap home-trust-slim">
        <div className="hts-row">
          <span className="hts-label"><Icon name="shield-check" size={16} /> Know what each badge means:</span>
          <span className="hts-badges"><Badge type="muis" /><Badge type="admin" /><Badge type="owned" /><Badge type="friendly" /></span>
          <button className="hts-link" onClick={() => navigate("verify")}>How we verify <Icon name="chevron" size={13} /></button>
        </div>
      </section>

      {/* EVENTS STRIP */}
      <EventsStrip />

      {/* WHY HUMBLE HALAL — value pillars (white band) */}
      <div className="home-band-white">
        <section className="hh-wrap hh-section home-why">
          <h2 style={{ fontSize: "1.6rem", marginBottom: 4 }}>Why Humble Halal</h2>
          <p className="muted" style={{ maxWidth: 640, marginBottom: 20 }}>One trusted home for halal living and Muslim-first travel — built on facts and human verification, never AI guesswork.</p>
          <div className="flt-benefit-grid">
            {[
              ["search", "A directory you can trust", "Find MUIS-certified, Muslim-owned and Muslim-friendly places with clear badges — so you always know what's verified and what's self-declared."],
              ["plane", "Halal travel, worldwide", "Search Muslim-friendly hotels and flights for Umrah, Hajj and everyday travel — prayer rooms, halal dining nearby, alcohol-free stays, Muslim-meal flags and qibla."],
              ["shield-check", "Transparency over hype", "We're a discovery platform, not a certifier. MUIS HalalSG stays the authority; we simply make the facts easy to find and confirm."],
              ["heart", "Built with the community", "Your suggestions, reports and reviews keep it accurate — for the Singapore Muslim community, and Muslims travelling the world."],
            ].map(([ic, h, b]) => (
              <div key={h} className="flt-benefit"><span className="fi-ico"><Icon name={ic} size={20} /></span><h3>{h}</h3><p className="muted">{b}</p></div>
            ))}
          </div>
        </section>
      </div>

      {/* BUSINESS CTA */}
      <section className="hh-wrap" style={{ paddingBottom: 48 }}>
        <div className="biz-cta hh-pattern-gold">
          <div className="biz-cta-in">
            <div>
              <span className="eyebrow" style={{ color: "var(--gold)" }}>For business owners</span>
              <h2 style={{ color: "#fff", fontSize: "1.9rem", marginTop: 10, maxWidth: 520 }}>List your business on Humble Halal</h2>
              <p style={{ color: "#DDEAE4", marginTop: 10, maxWidth: 480 }}>
                Get discovered by Singapore’s Muslim community, earn trust with clear halal labels, and turn searches into visits.
              </p>
              <div className="flex g10 wrap" style={{ marginTop: 18 }}>
                <button className="btn btn-gold btn-lg" onClick={() => navigate("add-listing")}>List your business</button>
                <button className="btn btn-lg" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }} onClick={() => navigate("for-business")}>Learn more</button>
              </div>
            </div>
            <div className="biz-cta-stats">
              {([["Free", "to list & manage"], ["Verified", "trust badges"], ["Muslim", "community reach"]] as [string, string][]).map(([v, l]) => (
                <div key={l} className="biz-stat"><div className="bv">{v}</div><div className="bl">{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Long-form SEO content (collapsible) — targets the halal-food head cluster */}
      <HomeSeoContent />

      {/* FAQ — visible + FAQPage schema (emitted at the page level) */}
      <Faq items={HOME_FAQ} title="Halal in Singapore — your questions, answered" />
    </div>
  );
}

/* ---- Discover rail: one tabbed rail replacing the two near-identical rails ---- */
function DiscoverRail({ dir, certifiedOnly, navigate }: { dir: ReturnType<typeof useDirectory>; certifiedOnly: boolean; navigate: (s: string, p?: Record<string, unknown>) => void }) {
  const [tab, setTab] = useState<"featured" | "newest" | "top">("featured");
  const featured = useMemo(() => dir.listings.filter((l) => l.featured && (!certifiedOnly || l.certified)).slice(0, 8), [dir.listings, certifiedOnly]);
  const newest = useMemo(() => dir.listings.slice(-12).reverse().filter((l) => !certifiedOnly || l.certified).slice(0, 8), [dir.listings, certifiedOnly]);
  const top = useMemo(() => [...dir.listings].filter((l) => !certifiedOnly || l.certified).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8), [dir.listings, certifiedOnly]);
  const picked = tab === "newest" ? newest : tab === "top" ? top : featured;
  // Never render a bare heading over an empty grid: if the selected tab is empty
  // (e.g. no listings carry the `featured` flag), fall back to real listings.
  const items = picked.length ? picked : dir.listings.filter((l) => !certifiedOnly || l.certified).slice(0, 8);
  const sort = tab === "newest" ? "newest" : tab === "top" ? "rating" : "featured";
  const tabs: [typeof tab, string][] = [["featured", "Featured"], ["newest", "Newest"], ["top", "Top rated"]];
  return (
    <>
      <div className="discover-head">
        <h2>Discover halal places</h2>
        <div className="discover-tabs" role="tablist">
          {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <button className="discover-all" onClick={() => navigate("explore", { sort })}>See all <Icon name="chevron" size={13} /></button>
      </div>
      {items.length > 0 ? (
        <div className="grid-cards">{items.map((l) => <ListingCard key={l.id} item={l} />)}</div>
      ) : (
        <Empty icon="search" title="Listings coming soon" body="We’re still adding places — explore the full directory." />
      )}
    </>
  );
}

/* ---- HERO variants ---- */
export function Hero({ variant, q, setQ, doSearch, navigate }: {
  variant: string;
  q: string;
  setQ: (v: string) => void;
  doSearch: (v: string) => void;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}) {
  const { t } = useApp();
  const dir = useDirectory();
  const quickChips = (
    <div className="pillbar" style={{ marginTop: 16, justifyContent: variant === "classic" ? "center" : "flex-start" }}>
      <button className="chip" onClick={() => navigate("map")}><Icon name="near" size={16} /> {t("chip.nearMe")}</button>
      <button className="chip" onClick={() => navigate("explore", { open: true })}>{t("chip.openNow")}</button>
      <button className="chip" onClick={() => navigate("explore", { prayer: true })}><Icon name="mosque" size={15} /> {t("chip.prayer")}</button>
      <button className="chip" onClick={() => navigate("travel")}><Icon name="globe" size={15} /> Halal-friendly hotels</button>
      <button className="chip" onClick={() => navigate("mosques")}><Icon name="crescent" size={15} /> Mosques</button>
    </div>
  );

  if (variant === "immersive") {
    return (
      <section className="hero hero--immersive hh-pattern">
        <div className="hh-wrap hero-inner">
          <span className="eyebrow" style={{ color: "var(--gold)" }}>Singapore’s halal directory</span>
          <h1 className="hero-h1" style={{ color: "#fff" }}>Find halal food and Muslim-friendly businesses in Singapore</h1>
          <p className="hero-sub" style={{ color: "#CFE0DA" }}>Certified, Muslim-owned, and community-trusted — all in one humble place.</p>
          <div style={{ maxWidth: 640, margin: "18px auto 0" }}>
            <SearchBar value={q} onChange={setQ} onSubmit={doSearch} suggest />
          </div>
          {quickChips}
        </div>
      </section>
    );
  }

  if (variant === "split") {
    const placeCount = dir.listings.length;
    return (
      <section className="hero hero--split">
        <div className="hh-wrap hero-split-grid">
          <div className="hero-split-text">
            <span className="eyebrow">{t("hero.eyebrow")}</span>
            <h1 className="hero-h1">{t("hero.h1")}</h1>
            <p className="hero-sub">{t("hero.sub")}</p>
            <div className="hero-search"><SearchBar value={q} onChange={setQ} onSubmit={doSearch} suggest placeholder={t("hero.search")} /></div>
            <p className="hero-trust">
              <Icon name="shield-check" size={15} />
              <span><b>MUIS-certified</b> · team-verified · community-trusted</span>
              <span className="hero-trust-stat">{placeCount}+ places</span>
            </p>
            {quickChips}
          </div>
          <div className="hero-collage" aria-hidden="true">
            <ImagePh label="nasi padang" tone="gold" src={HHData.collage[0]} style={{ gridArea: "a" }} icon="utensils" sizes="(max-width: 520px) 50vw, (max-width: 880px) 60vw, 300px" />
            <ImagePh label="kopi café" tone="emerald" src={HHData.collage[1]} style={{ gridArea: "b" }} icon="coffee" sizes="(max-width: 520px) 50vw, 220px" />
            <ImagePh label="halal travel" tone="cream" src={HHData.collage[2]} style={{ gridArea: "c" }} icon="globe" sizes="220px" />
            <span className="hero-collage-stat"><b>{placeCount}+</b> places</span>
          </div>
        </div>
      </section>
    );
  }

  // classic centered
  return (
    <section className="hero hero--classic">
      <div className="hh-wrap hero-inner" style={{ textAlign: "center" }}>
        <span className="eyebrow">Singapore’s most trusted halal directory</span>
        <h1 className="hero-h1" style={{ margin: "14px auto 0", maxWidth: 760 }}>Find halal food and Muslim-friendly businesses in Singapore</h1>
        <p className="hero-sub" style={{ margin: "12px auto 0", maxWidth: 560 }}>Certified, Muslim-owned and community-trusted places — all in one humble guide.</p>
        <div style={{ maxWidth: 640, margin: "20px auto 0" }}>
          <SearchBar value={q} onChange={setQ} onSubmit={doSearch} suggest />
        </div>
        {quickChips}
      </div>
    </section>
  );
}

/* ---- Trust strip ---- */
export function TrustStrip({ navigate }: { navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const rows: { type: BadgeKey; desc: string }[] = [
    { type: "muis", desc: "Officially halal-certified by MUIS. We link to the HalalSG verification." },
    { type: "admin", desc: "Documents checked and verified by the Humble Halal team." },
    { type: "owned", desc: "Confirmed Muslim-owned business." },
    { type: "friendly", desc: "Self-declared halal-friendly — not certified." },
    { type: "nopork", desc: "Self-declared no pork, no lard — not certified." },
    { type: "pending", desc: "Verification documents under review." },
  ];
  return (
    <section className="trust-strip">
      <div className="hh-wrap">
        <div className="flex between center wrap g12" style={{ marginBottom: 18 }}>
          <div>
            <span className="eyebrow">Know what you’re looking at</span>
            <h2 style={{ fontSize: "1.6rem", marginTop: 8 }}>Our trust badges, explained</h2>
          </div>
          <button className="btn btn-outline" onClick={() => navigate("verify")}><Icon name="shield" size={18} /> How we verify</button>
        </div>
        <div className="trust-grid">
          {rows.map((r) => (
            <div key={r.type} className="trust-item">
              <Badge type={r.type} lg />
              <p className="muted" style={{ fontSize: ".86rem", marginTop: 8 }}>{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="faint" style={{ fontSize: ".82rem", marginTop: 16 }}>
          Humble Halal is a discovery platform, not a certifier. Always confirm certification on the official
          <span style={{ color: "var(--emerald)", fontWeight: 600 }} onClick={() => navigate("verify")}> MUIS HalalSG</span> register.
        </p>
      </div>
    </section>
  );
}

/* =============================================================
   EXPLORE / SEARCH
============================================================= */
interface ExploreFilters {
  cat: string;
  area: string;
  price: string;
  halal: string;
  owned: boolean;
  prayer: boolean;
  family: boolean;
  delivery: boolean;
  open: boolean;
}
export function ExploreScreen() {
  const { navigate, params, state } = useApp();
  const dir = useDirectory();
  const { categories: catCategories } = useCatalog();
  const router = useRouter();
  const [q, setQ] = useState((params.q as string) || "");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("list");
  const [sort, setSort] = useState((params.sort as string) || "featured");
  const [filters, setFilters] = useState<ExploreFilters>({
    cat: (params.cat as string) || "", area: (params.area as string) || "", price: (params.price as string) || "", halal: (params.halal as string) || "", owned: !!params.owned,
    prayer: !!params.prayer, family: !!params.family, delivery: !!params.delivery, open: !!params.open,
  });

  const setF = <K extends keyof ExploreFilters>(k: K, v: ExploreFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));
  // After mount, "Open now" uses real SG-time computation (avoids SSR mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [visible, setVisible] = useState(12); // pagination: how many cards shown
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  // Real geolocation for the "Nearest" sort on the list view.
  useEffect(() => {
    if (sort === "nearest" && !userLoc && typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // Hydrate filters FROM the URL whenever the query params change — covers a
  // direct/bookmarked load (the SearchParamsBridge populates `params` after
  // mount) AND browser back/forward (audit #4 + #5). `setFilters` returns the
  // same reference when nothing changed, so this never loops with the write
  // effect below.
  const paramsKey = JSON.stringify(params);
  useEffect(() => {
    const wantQ = (params.q as string) || "";
    const wantSort = (params.sort as string) || "featured";
    const wantF: ExploreFilters = {
      cat: (params.cat as string) || "", area: (params.area as string) || "", price: (params.price as string) || "", halal: (params.halal as string) || "", owned: !!params.owned,
      prayer: !!params.prayer, family: !!params.family, delivery: !!params.delivery, open: !!params.open,
    };
    setQ((cur) => (cur === wantQ ? cur : wantQ));
    setSort((cur) => (cur === wantSort ? cur : wantSort));
    const wantView = params.view === "map" ? "map" : "list";
    setView((cur) => (cur === wantView ? cur : wantView));
    setFilters((cur) => {
      const same = cur.cat === wantF.cat && cur.area === wantF.area && cur.price === wantF.price && cur.halal === wantF.halal
        && cur.owned === wantF.owned && cur.prayer === wantF.prayer && cur.family === wantF.family && cur.delivery === wantF.delivery && cur.open === wantF.open;
      return same ? cur : wantF;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  // Keep the URL in sync so searches/filters are shareable, bookmarkable and
  // crawlable. Skip the FIRST run (mount) so it never strips the params we're
  // still hydrating from above.
  const firstUrlSync = useRef(true);
  useEffect(() => {
    if (firstUrlSync.current) { firstUrlSync.current = false; return; }
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (sort && sort !== "featured") sp.set("sort", sort);
    (["cat", "area", "price", "halal"] as const).forEach((k) => {
      if (filters[k]) sp.set(k, String(filters[k]));
    });
    (["owned", "prayer", "family", "delivery", "open"] as const).forEach((k) => {
      if (filters[k]) sp.set(k, "1");
    });
    if (view === "map") sp.set("view", "map"); // shareable/back-restorable map view
    const qs = sp.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  }, [q, sort, filters, view, router]);

  const results = useMemo(() => {
    let r = dir.listings.slice();
    if (state.prefs && state.prefs.certifiedOnly) r = r.filter((l) => l.certified);
    if (q) {
      const s = q.toLowerCase();
      // Match the category label too (audit #8: searching "restaurant"/"cafe"
      // should surface that category, not just name/cuisine/area/blurb matches).
      r = r.filter((l) => {
        const catLabel = catCategories.find((c) => c.id === l.catId)?.label || "";
        return (l.name + " " + l.cuisine + " " + l.area + " " + l.blurb + " " + catLabel + " " + l.catId).toLowerCase().includes(s);
      });
    }
    if (filters.cat) r = r.filter((l) => l.catId === filters.cat);
    if (filters.area) r = r.filter((l) => l.area.toLowerCase().includes(filters.area.toLowerCase()));
    if (filters.price) r = r.filter((l) => l.price === filters.price);
    if (filters.halal === "certified") r = r.filter((l) => l.badges.some((b) => ["muis", "admin"].includes(b)));
    if (filters.halal === "muis") r = r.filter((l) => l.badges.includes("muis"));
    if (filters.owned) r = r.filter((l) => l.badges.includes("owned"));
    if (filters.prayer) r = r.filter((l) => l.prayer);
    if (filters.family) r = r.filter((l) => l.badges.includes("family"));
    if (filters.delivery) r = r.filter((l) => l.delivery);
    if (filters.open) r = r.filter((l) => (mounted ? isOpenNow(l.hoursWeek) : l.open));
    if (sort === "rating") r.sort((a, b) => b.rating - a.rating);
    if (sort === "newest") r.reverse();
    if (sort === "nearest") {
      if (userLoc) r.sort((a, b) => (a.coords ? haversineKm(userLoc, a.coords) : 99) - (b.coords ? haversineKm(userLoc, b.coords) : 99));
      else r.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }
    if (sort === "featured") r.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return r;
  }, [q, filters, sort, state.prefs, mounted, userLoc, dir.listings]);

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "").length;
  useEffect(() => setVisible(12), [q, filters, sort]); // reset paging on filter change

  // Analytics: record the search query once the user stops typing (debounced).
  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const id = setTimeout(() => track.search(term), 700);
    return () => clearTimeout(id);
  }, [q]);

  // Analytics: record an impression once per listing per session as it surfaces
  // in the visible result set.
  const seenImpressions = useRef<Set<string>>(new Set());
  useEffect(() => {
    results.slice(0, visible).forEach((l) => {
      const slug = l.slug || l.id;
      if (seenImpressions.current.has(slug)) return;
      seenImpressions.current.add(slug);
      track.impression(slug, l.catId);
    });
  }, [results, visible]);

  return (
    <div className="screen-in hh-page">
      <div className="explore-top">
        <div className="hh-wrap" style={{ paddingTop: 16, paddingBottom: 14 }}>
          <h1 className="sr-only">Explore halal food &amp; Muslim-owned businesses in Singapore</h1>
          <SearchBar value={q} onChange={setQ} onSubmit={setQ} placeholder="Search restaurants, cafés, services…" suggest />
          <div className="flex between center explore-toolbar" style={{ marginTop: 12, gap: 10 }}>
            <div className="flex g8 center">
              <button className={`chip ${showFilters ? "active" : ""}`} onClick={() => setShowFilters((s) => !s)}>
                <Icon name="filter" size={16} /> Filters {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
              </button>
              <div className="sortwrap">
                <Icon name="sort" size={16} style={{ color: "var(--ink-soft)" }} />
                <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="rating">Top rated</option>
                  <option value="nearest">Nearest</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <CertifiedToggle compact />
            </div>
            <div className="viewtoggle">
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><Icon name="list" size={16} /> List</button>
              <button className={view === "map" ? "active" : ""} onClick={() => { setView("map"); }}><Icon name="map" size={16} /> Map</button>
            </div>
          </div>
        </div>
      </div>

      <div className="hh-wrap explore-body">
        {/* Filter panel (desktop sidebar / mobile drawer) */}
        {showFilters && <FilterPanel filters={filters} setF={setF} onClose={() => setShowFilters(false)} onClear={() => setFilters({ cat: "", area: "", price: "", halal: "", owned: false, prayer: false, family: false, delivery: false, open: false })} />}

        <div className="explore-results">
          <div className="flex between center" style={{ marginBottom: 16 }}>
            <p className="muted" style={{ fontWeight: 600 }}>
              <span style={{ color: "var(--ink)" }}>{results.length}</span> place{results.length !== 1 ? "s" : ""}
              {filters.cat && <span> in {catCategories.find((c) => c.id === filters.cat)?.label}</span>}
              {state.prefs && state.prefs.certifiedOnly && <span className="cert-active-note"><Icon name="shield-check" size={13} /> certified only</span>}
            </p>
          </div>

          {/* SPONSORED — Category Sponsorship; renders only when a campaign is active */}
          <SponsoredSlot placement="category_featured" />

          {view === "map" ? (
            <MapPreview
              results={results}
              navigate={navigate}
              mapParams={{
                ...(q ? { q } : {}),
                ...(filters.cat ? { cat: filters.cat } : {}),
                ...(filters.area ? { area: filters.area } : {}),
                ...(filters.halal ? { halal: filters.halal } : {}),
              }}
            />
          ) : results.length === 0 ? (
            <Empty icon="search" title="No places match your search"
              body="Try removing a filter or searching a different area. You can also suggest a place we’re missing."
              action="Suggest a business" onAction={() => navigate("suggest")} />
          ) : (
            <>
              <div className="grid-cards">
                {results.slice(0, visible).map((l, i) => (
                  <Fragment key={l.id}>
                    <ListingCard item={l} />
                    {i === 5 && <SponsoredSlot placement="directory_inline" />}
                  </Fragment>
                ))}
              </div>
              {results.length > visible && (
                <div className="flex center" style={{ justifyContent: "center", marginTop: 22 }}>
                  <button className="btn btn-outline" onClick={() => setVisible((v) => v + 12)}>
                    Load more ({results.length - visible} more)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function FilterPanel({ filters, setF, onClose, onClear }: {
  filters: ExploreFilters;
  setF: <K extends keyof ExploreFilters>(k: K, v: ExploreFilters[K]) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const { categories: catCategories, areas: catAreas } = useCatalog();
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="fp-section"><div className="fp-title">{title}</div>{children}</div>
  );
  const Opt = ({ k, v, label }: { k: "cat" | "area" | "price" | "halal"; v: string; label: string }) => (
    <button className={`fp-opt ${filters[k] === v ? "on" : ""}`} onClick={() => setF(k, filters[k] === v ? "" : v)}>{label}</button>
  );
  const Toggle = ({ k, label, icon }: { k: "owned" | "prayer" | "family" | "delivery" | "open"; label: string; icon: string }) => (
    <button className={`fp-toggle ${filters[k] ? "on" : ""}`} onClick={() => setF(k, !filters[k])}>
      <span className="flex g8 center"><Icon name={icon} size={17} /> {label}</span>
      <span className="switch" />
    </button>
  );
  return (
    <aside className="filter-panel">
      <div className="flex between center" style={{ marginBottom: 4 }}>
        <h3 style={{ fontSize: "1.15rem" }}>Filters</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClear}>Clear all</button>
      </div>
      <Section title="Category">
        <div className="fp-opts">
          {catCategories.slice(0, 6).map((c) => <Opt key={c.id} k="cat" v={c.id} label={c.label} />)}
        </div>
      </Section>
      <Section title="Area">
        <div className="fp-opts">
          {catAreas.map((a) => <Opt key={a.id} k="area" v={a.name.toLowerCase()} label={a.name} />)}
        </div>
      </Section>
      <Section title="Price">
        <div className="fp-opts">{["$", "$$", "$$$"].map((p) => <Opt key={p} k="price" v={p} label={p} />)}</div>
      </Section>
      <Section title="Halal status">
        <div className="fp-opts">
          <Opt k="halal" v="certified" label="Certified only" />
          <Opt k="halal" v="muis" label="MUIS certified" />
        </div>
        <p className="faint" style={{ fontSize: ".76rem", marginTop: 8 }}>Self-declared listings are clearly labelled “not certified”.</p>
      </Section>
      <Section title="Features">
        <div className="stack g8">
          <Toggle k="owned" label="Muslim-owned" icon="crescent" />
          <Toggle k="prayer" label="Prayer space" icon="mosque" />
          <Toggle k="family" label="Family friendly" icon="family" />
          <Toggle k="delivery" label="Delivery" icon="directions" />
          <Toggle k="open" label="Open now" icon="clock" />
        </div>
      </Section>
      <button className="btn btn-primary btn-block fp-apply" onClick={onClose}>Show results</button>
    </aside>
  );
}

/* ---- Map preview (inside explore) ---- */
const MAP_RAIL_MAX = 30; // don't mount hundreds of row cards under the preview

export function MapPreview({ results, navigate, mapParams }: {
  results: Listing[];
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  /** Active explore query/filters — carried into the full map so "Open full
   *  map" doesn't silently reset the user's search. */
  mapParams?: Record<string, string>;
}) {
  const pts = results
    .filter((l) => l.coords)
    .map((l) => ({ id: l.id, name: l.name, coords: l.coords as LatLng, kind: "listing" as const }));
  const unmapped = results.length - pts.length;
  const railItems = results.slice(0, MAP_RAIL_MAX);
  return (
    <div className="map-preview card">
      <div className="map-canvas">
        {pts.length > 0 ? (
          <MapView center={pts[0].coords} zoom={12} points={pts} fit onView={(id) => navigate("detail", { id })} />
        ) : (
          <div className="hh-pattern" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <span className="muted">No mappable results — try widening your filters.</span>
          </div>
        )}
        <button className="btn btn-primary btn-sm map-this" style={{ zIndex: 1000 }} onClick={() => navigate("map", mapParams)}><Icon name="map" size={15} /> Open full map</button>
      </div>
      {unmapped > 0 && (
        <p className="faint" style={{ fontSize: ".78rem", padding: "6px 12px 0" }}>
          {unmapped} of {results.length} places don&apos;t have a map location yet — they&apos;re still in the list view.
        </p>
      )}
      <div className="map-cardrail">
        {railItems.map((l) => <div key={l.id} className="map-railcard"><ListingCard item={l} variant="row" /></div>)}
        {results.length > MAP_RAIL_MAX && (
          <button className="btn btn-outline btn-sm" style={{ margin: "6px auto" }} onClick={() => navigate("map", mapParams)}>
            +{results.length - MAP_RAIL_MAX} more — open full map
          </button>
        )}
      </div>
    </div>
  );
}

/* =============================================================
   FULL MAP VIEW
============================================================= */
export function MapScreen() {
  const { navigate, toast, state, params } = useApp();
  const dir = useDirectory();
  const { categories: catCategories, areas: catAreas } = useCatalog();
  const wantMosques = params.show === "mosques";
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMosque, setActiveMosque] = useState<string | null>(null);
  const [chips, setChips] = useState({ open: false, prayer: false, family: false, mosque: !!wantMosques });
  const [q, setQ] = useState((params.q as string) || "");
  const [cat, setCat] = useState((params.cat as string) || "");
  const [area, setArea] = useState((params.area as string) || "");
  const [halal, setHalal] = useState((params.halal as string) || "");
  // Search params hydrate AFTER mount — without this sync, "Open full map"
  // from explore dropped the user's active query/filters on the floor.
  const pq = (params.q as string) || "", pcat = (params.cat as string) || "", parea = (params.area as string) || "", phalal = (params.halal as string) || "";
  useEffect(() => {
    if (pq) setQ((cur) => cur || pq);
    if (pcat) setCat((cur) => cur || pcat);
    if (parea) setArea((cur) => cur || parea);
    if (phalal) setHalal((cur) => cur || phalal);
  }, [pq, pcat, parea, phalal]);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapMounted, setMapMounted] = useState(false);
  useEffect(() => setMapMounted(true), []);
  const tog = (k: keyof typeof chips) => setChips((c) => ({ ...c, [k]: !c[k] }));
  const clearAll = () => { setCat(""); setArea(""); setHalal(""); setQ(""); setChips((c) => ({ ...c, open: false, prayer: false, family: false })); };
  const hasFilters = !!(cat || area || halal || q || chips.open || chips.prayer || chips.family);
  // Keep the left list in sync when a map pin is selected (GMB-style).
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedId = activeMosque || activeId;
  useEffect(() => {
    if (!selectedId || !resultsRef.current) return;
    const el = resultsRef.current.querySelector(`[data-id="${selectedId}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);
  const nextPrayer = HHData.prayerTimes.times[HHData.prayerTimes.nextIndex];

  const nearMe = () => {
    if (!("geolocation" in navigator)) {
      toast("Location isn't available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast(wantMosques ? "Showing mosques near you" : "Showing places near you");
      },
      () => {
        setLocating(false);
        toast("Couldn't get your location — showing all of Singapore");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Arrived via "Mosques near me" → turn the mosque layer on and ask for
  // location once. Keyed on wantMosques (NOT mount): search params hydrate
  // after mount, so ?show=mosques used to be false on first render and the
  // mosque pins/geolocation never activated on a direct load.
  const askedNear = useRef(false);
  useEffect(() => {
    if (!wantMosques || askedNear.current) return;
    askedNear.current = true;
    setChips((c) => (c.mosque ? c : { ...c, mosque: true }));
    nearMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantMosques]);

  const list = useMemo(() => {
    let r = dir.listings.filter((l) => l.coords);
    if (q.trim()) { const s = q.trim().toLowerCase(); r = r.filter((l) => (l.name + " " + (l.cuisine || "") + " " + (l.area || "")).toLowerCase().includes(s)); }
    if (state.prefs?.certifiedOnly) r = r.filter((l) => l.certified);
    if (chips.open) r = r.filter((l) => (mapMounted ? isOpenNow(l.hoursWeek) : l.open));
    if (chips.prayer) r = r.filter((l) => l.prayer);
    if (chips.family) r = r.filter((l) => l.badges.includes("family"));
    if (cat) r = r.filter((l) => l.catId === cat);
    if (area) r = r.filter((l) => l.area.toLowerCase().includes(area.toLowerCase()));
    if (halal === "certified") r = r.filter((l) => l.badges.some((b) => ["muis", "admin"].includes(b)));
    if (halal === "muis") r = r.filter((l) => l.badges.includes("muis"));
    if (userLoc) {
      r = r
        .map((l) => ({ ...l, distanceKm: l.coords ? haversineKm(userLoc, l.coords) : undefined }))
        .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    }
    return r;
  }, [chips, q, cat, area, halal, userLoc, state.prefs?.certifiedOnly, mapMounted, dir.listings]);

  const mosqueList = useMemo(() => {
    let m = HHData.mosques.map((mq) => ({ ...mq, distanceKm: userLoc ? haversineKm(userLoc, mq.coords) : undefined }));
    if (userLoc) m = m.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    return m;
  }, [userLoc]);

  const center: LatLng =
    (activeMosque ? mosqueList.find((m) => m.id === activeMosque)?.coords : undefined) ||
    userLoc ||
    list.find((l) => l.id === activeId)?.coords ||
    list[0]?.coords ||
    SG_CENTER;

  const points: MapPoint[] = [
    ...list.map((l) => ({
      id: l.id,
      name: l.name,
      coords: l.coords as LatLng,
      active: l.id === activeId,
      kind: "listing" as const,
    })),
    ...(chips.mosque
      ? mosqueList.map((m) => ({ id: m.id, name: m.name, coords: m.coords, active: m.id === activeMosque, kind: "mosque" as const }))
      : []),
    ...(userLoc ? [{ id: "user", name: "You are here", coords: userLoc, kind: "user" as const }] : []),
  ];

  const onSelect = (id: string) => {
    if (id === "user") return;
    if (mosqueList.some((m) => m.id === id)) {
      setActiveMosque(id);
      setActiveId(null);
      return;
    }
    setActiveMosque(null);
    setActiveId(id);
  };

  const resultCount = chips.mosque ? mosqueList.length : list.length;

  return (
    <div className="map-split">
      {/* LEFT — results list (Google-Maps / GMB style) */}
      <aside className="map-split-list">
        <div className="map-split-head">
          <div className="flex g8 center">
            <div className="searchbar" style={{ flex: 1 }}>
              <Icon name="search" className="lead" />
              <input placeholder="Search this area" aria-label="Search this area" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="map-iconbtn" aria-label="View as full list" onClick={() => navigate("explore")} title="Explore as list">
              <Icon name="list" size={20} />
            </button>
          </div>
          <div className="pillbar map-split-chips">
            <button className={`chip ${userLoc ? "active" : ""}`} onClick={nearMe} aria-pressed={!!userLoc}>
              <Icon name="near" size={15} /> {locating ? "Locating…" : "Near me"}
            </button>
            <button className={`chip ${chips.mosque ? "active" : ""}`} onClick={() => tog("mosque")} aria-pressed={chips.mosque}>
              <Icon name="mosque" size={15} /> Mosques
            </button>
            <button className={`chip ${chips.open ? "active" : ""}`} onClick={() => tog("open")} aria-pressed={chips.open}>Open now</button>
            <button className={`chip ${chips.prayer ? "active" : ""}`} onClick={() => tog("prayer")} aria-pressed={chips.prayer}>Prayer space</button>
            <button className={`chip ${chips.family ? "active" : ""}`} onClick={() => tog("family")} aria-pressed={chips.family}>Family friendly</button>
          </div>
          {!chips.mosque && (
            <div className="flex g8 wrap" style={{ marginTop: 8 }}>
              <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" style={{ flex: "1 1 30%", minWidth: 116, fontSize: ".85rem", padding: "7px 10px" }}>
                <option value="">All categories</option>
                {catCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select className="select" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area" style={{ flex: "1 1 30%", minWidth: 110, fontSize: ".85rem", padding: "7px 10px" }}>
                <option value="">All areas</option>
                {catAreas.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
              <select className="select" value={halal} onChange={(e) => setHalal(e.target.value)} aria-label="Halal status" style={{ flex: "1 1 30%", minWidth: 120, fontSize: ".85rem", padding: "7px 10px" }}>
                <option value="">Any halal status</option>
                <option value="certified">Certified / verified</option>
                <option value="muis">MUIS certified</option>
              </select>
            </div>
          )}
          <div className="map-split-count flex between center">
            <span><strong>{resultCount}</strong> {chips.mosque ? "mosque" : "place"}{resultCount === 1 ? "" : "s"}{userLoc ? " · nearest first" : ""}</span>
            {hasFilters && <button className="link-inline" onClick={clearAll} style={{ fontSize: ".82rem" }}>Clear all</button>}
          </div>
        </div>

        <div className="map-split-results" ref={resultsRef}>
          {chips.mosque ? (
            mosqueList.map((m) => (
              <div
                key={m.id}
                data-id={m.id}
                className={`map-cc mosque-cc ${m.id === activeMosque ? "on" : ""}`}
                onClick={() => setActiveMosque(m.id)}
              >
                <div className="mosque-cc-top">
                  <span className="mosque-cc-ico"><Icon name="mosque" size={20} /></span>
                  <div className="f1" style={{ minWidth: 0 }}>
                    <div className="mosque-cc-name">{m.name}</div>
                    <div className="lc-meta">{m.area}{m.distanceKm != null ? ` · ${formatKm(m.distanceKm)} away` : ""}</div>
                  </div>
                </div>
                <div className="mosque-cc-foot">
                  <span className="mosque-cc-next"><Icon name="clock" size={13} /> {nextPrayer.name} {nextPrayer.time}</span>
                  <a className="btn btn-soft btn-sm" href={mapsSearchUrl(`${m.name} Singapore`)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Icon name="directions" size={15} /> Directions
                  </a>
                </div>
              </div>
            ))
          ) : list.length === 0 ? (
            <Empty icon="search" title="No places match" body="Try removing a filter or searching a different area." />
          ) : (
            list.map((l) => (
              <div
                key={l.id}
                data-id={l.id}
                className={`map-cc ${l.id === activeId ? "on" : ""}`}
                onClick={() => (l.id === activeId ? navigate("detail", { id: l.id }) : setActiveId(l.id))}
              >
                <ListingCard item={l} variant="row" />
                {l.id === activeId && (
                  <button className="btn btn-primary btn-sm btn-block mt8" onClick={(e) => { e.stopPropagation(); navigate("detail", { id: l.id }); }}>
                    View details <Icon name="arrow" size={15} />
                  </button>
                )}
                {l.distanceKm != null && (
                  <span className="map-cc-dist"><Icon name="near" size={12} /> {formatKm(l.distanceKm)} away</span>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* RIGHT — live map */}
      <div className="map-split-map">
        <div className="map-live">
          <MapView center={center} zoom={userLoc ? 14 : 12} points={points} onSelect={onSelect} onView={(id) => navigate("detail", { id })} fit={!activeId && !activeMosque && !userLoc} />
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   BUSINESS DETAIL
============================================================= */
export function DetailScreen() {
  const { navigate, params, state, toggleSave, toast } = useApp();
  const dir = useDirectory();
  // Strict slug/id resolution — the old `|| dir.listings[0]` fallback silently
  // rendered the FIRST listing for any bad/stale slug instead of a not-found
  // state (same bug class fixed on the events screens).
  const item = dir.get(String(params.slug || params.id || ""));
  const saved = item ? state.saved.includes(item.id) : false;
  const [tab, setTab] = useState("overview");
  const [outletIdx, setOutletIdx] = useState(0);
  const outlet = item?.franchise && item.outlets ? item.outlets[outletIdx] : null;
  const tabs = item?.franchise ? ["overview", "locations", "reviews", "info"] : ["overview", "reviews", "info"];

  // Live "open now" — computed client-side (SG time) after mount to avoid SSR
  // hydration mismatch; refreshes each minute.
  const [live, setLive] = useState<{ open: boolean; label: string } | null>(null);
  const hoursWeek = item?.hoursWeek;
  useEffect(() => {
    if (!hoursWeek) return;
    const update = () => setLive(openStatus(hoursWeek));
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [hoursWeek]);
  const openNow = live ? live.open : item?.open ?? false;
  const hoursLabel = live ? live.label : item?.hours ?? "";

  // Analytics: this listing's stable key + a record that it was viewed.
  const slug = item ? item.slug || item.id : "";
  const catId = item?.catId;
  useEffect(() => {
    if (slug && catId) track.listingView(slug, catId);
  }, [slug, catId]);
  const logLead = (type: LeadAction) => { if (item) track.leadAction(type, slug, item.catId); };

  // Photo lightbox — capped at the business's plan gallery limit (lib/plans).
  // Lower tiers show fewer photos; premium/featured are unaffected (high caps).
  const galleryImgs = item ? ([item.image, ...HHData.gallery].filter(Boolean) as string[]).slice(0, galleryMax(item)) : [];

  // Verified+ unlocks the rich contact buttons (WhatsApp & directions). Free
  // listings still keep their core contact (phone / website) — never hidden.
  const richContact = item ? canUse(item, "contact_buttons") : false;
  const [lb, setLb] = useState<number | null>(null);
  useEffect(() => {
    if (lb === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLb(null);
      else if (e.key === "ArrowLeft") setLb((i) => (i === null ? 0 : (i + galleryImgs.length - 1) % galleryImgs.length));
      else if (e.key === "ArrowRight") setLb((i) => (i === null ? 0 : (i + 1) % galleryImgs.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lb, galleryImgs.length]);

  // All hooks above run unconditionally; bail to a real not-found state here.
  if (!item) return (
    <div className="hh-wrap" style={{ padding: "48px 0", textAlign: "center" }}>
      <Empty icon="store" title="Listing not found" body="This place isn't in the directory (it may have been removed). Browse or search instead." />
      <button className="btn btn-primary mt12" onClick={() => navigate("explore")}>Explore places</button>
    </div>
  );

  // High-ticket service verticals get a "Request a quote" lead CTA (preselects the vertical).
  const QUOTE_VERTICAL: Record<string, string> = {
    weddings: "Wedding & bridal (MUA, deco, hantaran)",
    travel: "Umrah & Hajj travel",
    services: "Home services (renovation, cleaning, aircon)",
    automotive: "Automotive (servicing, detailing)",
    professional: "Professional services (legal, accounting, marketing)",
    education: "Quran & tuition / education",
  };
  const quoteVertical = QUOTE_VERTICAL[item.catId];

  const dirHref = item.coords
    ? directionsUrl(item.coords)
    : mapsSearchUrl(`${item.name} ${item.area} Singapore`);
  const contacts = [
    item.phone && { icon: "phone", label: "Call", href: telHref(item.phone), external: false, action: "call" as LeadAction },
    // WhatsApp & directions are Verified+ (contact_buttons). Free listings keep
    // phone/website so a business is never left without a way to be reached.
    richContact && item.wa && { icon: "whatsapp", label: "WhatsApp", href: waHref(item.wa, `Hi ${item.name}, I found you on Humble Halal`), external: true, action: "whatsapp" as LeadAction },
    richContact && { icon: "directions", label: "Directions", href: dirHref, external: true, action: "directions" as LeadAction },
    item.web && { icon: "globe", label: "Website", href: webHref(item.web), external: true, action: "website" as LeadAction },
    item.ig && { icon: "instagram", label: "Instagram", href: igHref(item.ig), external: true },
  ].filter(Boolean) as { icon: string; label: string; href: string; external: boolean; action?: LeadAction }[];

  return (
    <div className="screen-in detail-screen hh-page">
      <MobileHeader title="" onBack={() => navigate("explore")}
        right={<button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => { if (!saved) logLead("shortlist"); toggleSave(item.id); }}>
          <Icon name="heart" size={22} style={{ fill: saved ? "var(--danger)" : "none", color: saved ? "var(--danger)" : "var(--ink-soft)" }} /></button>} />

      {/* cover */}
      <div className="detail-cover">
        <ImagePh label={item.img} tone={item.tone} src={item.image} style={{ position: "absolute", inset: 0 }} icon="camera" priority sizes="100vw" />
        <div className="detail-gallery">
          {["interior", "dish detail", "storefront"].map((g, gi) => (
            <button key={g} className="gallery-thumb" onClick={() => setLb(gi + 1)} aria-label={`View ${g} photo`}>
              <ImagePh label={g} tone="cream" src={HHData.gallery[gi]} style={{ width: 64, height: 48, borderRadius: 8 }} />
            </button>
          ))}
          <button className="gallery-more" onClick={() => setLb(0)} aria-label="View all photos">+{Math.max(1, galleryImgs.length - 3)}</button>
        </div>
      </div>

      <div className="hh-wrap" style={{ paddingTop: 14 }}>
        <Breadcrumbs
          items={[
            { name: "Home", screen: "home", href: "/" },
            { name: "Explore", screen: "explore", href: "/explore" },
            {
              name: item.area,
              screen: "seo",
              params: { slug: `halal-food-in-${item.area.toLowerCase().split(" ")[0]}` },
              href: `/halal/halal-food-in-${item.area.toLowerCase().split(" ")[0]}`,
            },
            { name: item.name },
          ]}
        />
      </div>
      <div className="hh-wrap detail-body">
        <div className="detail-main">
          {/* header */}
          <div className="flex between" style={{ gap: 16, alignItems: "flex-start" }}>
            <div>
              <div className="flex g8 center wrap" style={{ marginBottom: 8 }}>
                <span className="tag">{item.cat}</span>
                <span className="faint">·</span>
                <span className="muted" style={{ fontWeight: 600, fontSize: ".86rem" }}>{item.cuisine}</span>
                <span className="faint">·</span>
                <span className="muted" style={{ fontWeight: 600, fontSize: ".86rem" }}>{item.price}</span>
              </div>
              <h1 style={{ fontSize: "2rem" }}>{item.name}</h1>
              {item.franchise && (
                <button className="franchise-tag" onClick={() => setTab("locations")}>
                  <Icon name="building" size={14} /> Franchise · {item.outletCount} locations across Singapore
                </button>
              )}
            </div>
            <div className="flex g8 detail-headbtns">
              <button className="btn btn-outline btn-sm" onClick={() => { if (!saved) logLead("shortlist"); toggleSave(item.id); }}>
                <Icon name="heart" size={17} style={{ fill: saved ? "var(--danger)" : "none", color: saved ? "var(--danger)" : undefined }} /> {saved ? "Saved" : "Save"}</button>
            </div>
          </div>

          <div className="flex g14 center wrap" style={{ marginTop: 12 }}>
            <Rating value={item.rating} count={item.reviews} />
            <span className="faint">·</span>
            <span className={openNow ? "status-open" : "status-closed"} style={{ fontSize: ".88rem" }}>
              <span className={`status-dot ${openNow ? "open" : "closed"}`}></span>{hoursLabel}</span>
          </div>

          {/* badge row — halal status (muis/admin) is shown once in the confidence
              card below, so keep only the non-status badges here (owned/family). */}
          <div className="lc-badges" style={{ marginTop: 16, gap: 8 }}>
            {item.badges.filter((b) => b !== "muis" && b !== "admin").map((b) => <Badge key={b} type={b} lg />)}
            {item.prayer && <Badge type="prayer" lg />}
          </div>

          {/* Halal Confidence pill — only when the richer verification card (below)
              isn't shown, so the score+tier never appear twice. */}
          {!(item.certified && !muisUnbacked(item)) && <HalalConfidenceBadge item={item} />}

          {/* Verification provenance + community confirmation */}
          <VerificationCard item={item} navigate={navigate} toast={toast} />

          {/* contact buttons — real intents (tel:, wa.me, maps, web, ig) */}
          <div className="contact-grid">
            {contacts.map((c) => (
              <a
                key={c.label}
                className="contact-btn"
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                aria-label={`${c.label} ${item.name}`}
                onClick={() => { if (c.action) logLead(c.action); }}
              >
                <Icon name={c.icon} size={20} /><span>{c.label}</span>
              </a>
            ))}
          </div>

          {/* Claim prompt — the cold-outreach hook on unclaimed listings */}
          {!item.claimed && (
            <div className="card" style={{ padding: 16, marginTop: 14, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", background: "var(--emerald-50)", border: "1px solid var(--emerald-200, var(--line))" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                <span className="attn-ico"><Icon name="building" size={20} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>Is this your business?</div>
                  <div className="muted" style={{ fontSize: ".9rem" }}>Claim your free listing to manage details, reply to reviews and add photos.</div>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("claim", { id: item.slug || item.id })}><Icon name="shield-check" size={15} /> Claim this listing</button>
            </div>
          )}

          {/* tabs */}
          <div className="detail-tabs">
            {tabs.map((t) => (
              <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                {t === "locations" ? `Locations (${item.outletCount})` : t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "overview" && <DetailOverview item={item} />}
          {tab === "locations" && <LocationsPanel item={item} outletIdx={outletIdx} setOutletIdx={setOutletIdx} toast={toast} />}
          {tab === "reviews" && <DetailReviews item={item} />}
          {tab === "info" && <DetailInfo item={item} navigate={navigate} />}

          {/* footer actions */}
          <div className="detail-footactions">
            <button
              className="btn btn-ghost"
              onClick={async () => {
                const r = await shareOrCopy({ title: item.name, text: item.blurb, path: `/business/${item.slug}` });
                toast(r === "shared" ? "Shared" : r === "copied" ? "Link copied to clipboard" : "Couldn't share");
              }}
            >
              <Icon name="share" size={17} /> Share
            </button>
            {quoteVertical && (
              <button className="btn btn-gold" onClick={() => { logLead("enquiry_form"); navigate("request-quote", { category: quoteVertical }); }}><Icon name="doc" size={17} /> Request a quote</button>
            )}
            <button className="btn btn-ghost" onClick={() => navigate("report", { id: item.id })}><Icon name="flag" size={17} /> Report incorrect info</button>
            {!item.claimed && <button className="btn btn-outline" onClick={() => navigate("claim", { id: item.slug || item.id })}><Icon name="building" size={17} /> Claim this business</button>}
          </div>

          {/* internal linking: related places + landing pages */}
          {(() => {
            const related = dir.listings
              .filter((l) => l.id !== item.id && (l.area === item.area || l.catId === item.catId))
              .slice(0, 3);
            const areaSlug = item.area.toLowerCase().split(" ")[0];
            return (
              <div className="related-places">
                {related.length > 0 && (
                  <>
                    <SectionHead title={`More halal places in ${item.area}`} />
                    <div className="related-grid">
                      {related.map((l) => (
                        <ListingCard key={l.id} item={l} />
                      ))}
                    </div>
                  </>
                )}
                <div className="area-links">
                  <a className="chip" href={`/halal/halal-food-in-${areaSlug}`} onClick={(e) => { e.preventDefault(); navigate("seo", { slug: `halal-food-in-${areaSlug}` }); }}>
                    Halal Food in {item.area} <Icon name="arrow" size={14} />
                  </a>
                  <a className="chip" href={`/halal/halal-${item.catId}-in-${areaSlug}`} onClick={(e) => { e.preventDefault(); navigate("seo", { slug: `halal-${item.catId}-in-${areaSlug}` }); }}>
                    Halal {item.cat} in {item.area} <Icon name="arrow" size={14} />
                  </a>
                </div>
              </div>
            );
          })()}

          {/* Intent-matched capture: reader is looking at a specific halal place,
              so offer the weekly new-spots newsletter (source "listing" → foodie). */}
          <section className="newsletter-card" style={{ marginTop: 28 }}>
            <span className="eyebrow">🌙 HumbleHalal newsletter</span>
            <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Love halal finds like this?</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              We send the best new halal spots around {item.area} and across Singapore every week. Be first to know.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="listing" cta="Get weekly finds" />
            </div>
          </section>
        </div>

        {/* sidebar (desktop) */}
        <aside className="detail-side">
          {item.franchise && item.outlets && outlet ? (
            <div className="card" style={{ padding: 18 }}>
              <div className="flex between center"><h3 style={{ fontSize: "1.05rem" }}>Choose an outlet</h3>
                <span className={outlet.open ? "status-open" : "status-closed"} style={{ fontSize: ".82rem" }}>{outlet.open ? "Open now" : "Closed"}</span></div>
              <div className="outlet-select">
                {item.outlets.map((o, i) => (
                  <button key={o.id} className={`outlet-opt ${i === outletIdx ? "on" : ""}`} onClick={() => setOutletIdx(i)}>
                    <span className="oo-dot" />
                    <span className="f1" style={{ textAlign: "left" }}>
                      <span className="oo-name">{o.name}{o.flagship && <span className="oo-flag">Flagship</span>}</span>
                      <span className="oo-dist">{o.distance} away · {o.open ? "Open" : "Closed"}</span>
                    </span>
                    {i === outletIdx && <Icon name="check" size={16} style={{ color: "var(--emerald)" }} />}
                  </button>
                ))}
              </div>
              <hr className="divider" style={{ margin: "14px 0" }} />
              <div className="flex g8" style={{ alignItems: "flex-start" }}>
                <Icon name="pin" size={18} style={{ color: "var(--emerald)", marginTop: 2, flex: "none" }} />
                <span className="muted" style={{ fontSize: ".88rem" }}>{outlet.address}</span>
              </div>
              <div className="flex g8 center" style={{ marginTop: 8 }}>
                <Icon name="clock" size={18} style={{ color: "var(--emerald)", flex: "none" }} />
                <span className="muted" style={{ fontSize: ".88rem" }}>{outlet.hours}</span>
              </div>
              <div className="flex g8 center" style={{ marginTop: 8 }}>
                <Icon name="shield-check" size={18} style={{ color: "var(--emerald)", flex: "none" }} />
                <span className="muted" style={{ fontSize: ".84rem" }}>MUIS · <span className="kbd-mono" style={{ fontWeight: 700 }}>{outlet.certNo}</span></span>
              </div>
              <ImagePh label={`${outlet.area} map`} tone="emerald" style={{ height: 120, borderRadius: 12, marginTop: 12 }} icon="map" />
              <a className="btn btn-primary btn-block mt12" href={mapsSearchUrl(`${item.name} ${outlet.area} Singapore`)} target="_blank" rel="noopener noreferrer"><Icon name="directions" size={18} /> Directions to this outlet</a>
            </div>
          ) : (
          <div className="card" style={{ padding: 18 }}>
            <div className="flex between center"><h3 style={{ fontSize: "1.05rem" }}>Hours &amp; location</h3>
              <span className={openNow ? "status-open" : "status-closed"} style={{ fontSize: ".82rem" }}>{openNow ? "Open now" : "Closed"}</span></div>
            <div className="hours-list">
              {(item.hoursWeek || []).map((r, i) => (
                <div key={i} className={`hours-row ${live && i === sgTodayIdx() ? "today" : ""}`}>
                  <span>{DAY_LABELS[i]}</span>
                  <span className="muted">{r ? `${fmt12(r.open)} – ${fmt12(r.close)}` : "Closed"}</span>
                </div>
              ))}
            </div>
            <hr className="divider" style={{ margin: "14px 0" }} />
            <div className="flex g8" style={{ alignItems: "flex-start" }}>
              <Icon name="pin" size={18} style={{ color: "var(--emerald)", marginTop: 2, flex: "none" }} />
              <span className="muted" style={{ fontSize: ".88rem" }}>{item.address}{item.postal ? `, Singapore ${item.postal}` : ""}</span>
            </div>
            {item.coords ? (
              <div style={{ height: 200, borderRadius: 12, marginTop: 12, overflow: "hidden", position: "relative" }}>
                <MapView center={item.coords} zoom={16} points={[{ id: item.id, name: item.name, coords: item.coords as LatLng, kind: "listing" as const }]} />
              </div>
            ) : (
              <ImagePh label="map location" tone="emerald" style={{ height: 120, borderRadius: 12, marginTop: 12 }} icon="map" />
            )}
            <a className="btn btn-primary btn-block mt12" href={dirHref} target="_blank" rel="noopener noreferrer"><Icon name="directions" size={18} /> Get directions</a>
          </div>
          )}
        </aside>
      </div>

      {/* sticky mobile contact bar — real intents. WhatsApp & directions are
          Verified+ (contact_buttons); free listings keep Call / Website so the
          bar is never empty. */}
      <div className="detail-stickybar">
        {item.phone && <a className="btn btn-outline btn-sm" href={telHref(item.phone)}><Icon name="phone" size={17} /> Call</a>}
        {richContact && item.wa && <a className="btn btn-soft btn-sm" href={waHref(item.wa, `Hi ${item.name}, I found you on Humble Halal`)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={17} /> WhatsApp</a>}
        {richContact ? (
          <a className="btn btn-primary btn-sm" href={dirHref} target="_blank" rel="noopener noreferrer"><Icon name="directions" size={17} /> Directions</a>
        ) : item.web ? (
          <a className="btn btn-primary btn-sm" href={webHref(item.web)} target="_blank" rel="noopener noreferrer"><Icon name="globe" size={17} /> Website</a>
        ) : (
          <a className="btn btn-primary btn-sm" href={dirHref} target="_blank" rel="noopener noreferrer"><Icon name="directions" size={17} /> Directions</a>
        )}
      </div>

      {/* photo lightbox */}
      {lb !== null && galleryImgs[lb] && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={() => setLb(null)}>
          <button className="lightbox-close" onClick={() => setLb(null)} aria-label="Close"><Icon name="x" size={26} /></button>
          {galleryImgs.length > 1 && (
            <button className="lightbox-nav prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setLb((i) => (i === null ? 0 : (i + galleryImgs.length - 1) % galleryImgs.length)); }}><Icon name="chevron" size={30} style={{ transform: "rotate(90deg)" }} /></button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lightbox-img" src={galleryImgs[lb]} alt={`${item.name} photo ${lb + 1}`} onClick={(e) => e.stopPropagation()} />
          {galleryImgs.length > 1 && (
            <button className="lightbox-nav next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setLb((i) => (i === null ? 0 : (i + 1) % galleryImgs.length)); }}><Icon name="chevron" size={30} style={{ transform: "rotate(-90deg)" }} /></button>
          )}
          <div className="lightbox-count">{lb + 1} / {galleryImgs.length}</div>
        </div>
      )}
    </div>
  );
}

export function SavedScreen() {
  const { navigate, state } = useApp();
  const dir = useDirectory();
  const saved = state.saved.map((id) => dir.get(id)).filter(Boolean) as Listing[];
  const recent = (state.recent || []).map((id) => dir.get(id)).filter(Boolean).slice(0, 6) as Listing[];
  return (
    <div className="screen-in hh-page">
      <section className="seo-hero hh-pattern">
        <div className="hh-wrap">
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>Your saved places</h1>
          <p className="muted" style={{ marginTop: 8, fontSize: "1.05rem" }}>Tap the heart on any listing to keep it here — saved on this device.</p>
        </div>
      </section>
      <div className="hh-wrap hh-section">
        {saved.length ? (
          <>
            <p className="muted" style={{ fontWeight: 600, marginBottom: 14 }}><span style={{ color: "var(--ink)" }}>{saved.length}</span> saved place{saved.length !== 1 ? "s" : ""}</p>
            <div className="grid-cards">{saved.map((l) => <ListingCard key={l.id} item={l} />)}</div>
          </>
        ) : (
          <Empty icon="heart" title="No saved places yet" body="Browse the directory and tap the heart to save places you love. They'll appear here." action="Explore halal places" onAction={() => navigate("explore")} />
        )}
        {recent.length > 0 && (
          <div style={{ marginTop: 34 }}>
            <SectionHead title="Recently viewed" />
            <div className="grid-cards">{recent.map((l) => <ListingCard key={l.id} item={l} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HalalScoreBar({ item }: { item: Listing }) {
  const hs = scoreListing(item);
  return (
    <div className="halal-score" title={hs.reasons.join(" ")}>
      <span className="hs-ring" style={{ "--tone": scoreTone(hs.tier), "--pct": String(hs.score) } as React.CSSProperties}>
        <strong>{hs.score}</strong>
      </span>
      <div>
        <div className="hs-tier">{hs.label}</div>
        <div className="faint" style={{ fontSize: ".74rem", fontWeight: 600 }}>Halal confidence score</div>
      </div>
    </div>
  );
}

export function VerificationCard({ item, navigate, toast }: {
  item: Listing;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  toast: (msg: string) => void;
}) {
  const v = item.verify || ({} as Partial<NonNullable<Listing["verify"]>>);
  const [confirmed, setConfirmed] = useState(false);
  const confirms = (v.confirms || 0) + (confirmed ? 1 : 0);

  // A MUIS claim with no certificate number on file is NOT presented as
  // officially certified — it falls through to the downgraded card below, in
  // step with the halal-score tier gate (lib/halal-score muisUnbacked).
  if (item.certified && !muisUnbacked(item)) {
    const isMuis = item.badges.includes("muis");
    return (
      <div className="verif-card certified" style={{ marginTop: 16 }}>
        <HalalScoreBar item={item} />
        <div className="verif-card-main">
          <div className="verif-seal"><Icon name="shield-check" size={24} /></div>
          <div className="f1">
            <div className="flex g8 center wrap">
              {v.renewed && <span className="verif-fresh"><Icon name="check" size={12} /> Renewed {v.verified}</span>}
              {v.expiringSoon && <span className="verif-expiring"><Icon name="clock" size={12} /> Renews soon</span>}
            </div>
            <div className="verif-meta">
              {v.certNo && <span className="verif-metaitem"><span className="faint">Cert no.</span> <span className="kbd-mono" style={{ fontWeight: 700 }}>{v.certNo}</span></span>}
              {v.expires && <span className="verif-metaitem"><span className="faint">Valid to</span> <strong>{v.expires}</strong></span>}
              {v.verified && <span className="verif-metaitem"><span className="faint">Last verified</span> <strong>{v.verified}</strong></span>}
              <span className="verif-metaitem"><span className="faint">Verified by</span> <strong>{item.certBody}</strong></span>
            </div>
          </div>
        </div>
        <div className="verif-card-foot">
          {isMuis
            ? <a className="btn btn-soft btn-sm" href={halalSgVerifyUrl(v.certNo, item.name)} target="_blank" rel="noopener noreferrer"><Icon name="external" size={15} /> Verify on HalalSG</a>
            : <button className="btn btn-soft btn-sm" onClick={() => navigate("verify")}><Icon name="doc" size={15} /> View verification</button>}
          <span className="verif-confirm-count"><Icon name="crescent" size={14} /> <strong>{confirms}</strong> Muslims confirmed halal here</span>
        </div>
      </div>
    );
  }

  // Self-declared / pending — and the MUIS-claimed-but-unbacked case (a business
  // that lists itself as MUIS-certified but has no certificate number on file).
  const pending = item.badges.includes("pending");
  const muisClaim = item.badges.includes("muis"); // only reaches here when unbacked
  const heading = muisClaim
    ? "MUIS certificate not yet on file"
    : pending
      ? "Verification under review"
      : "Self-declared — not certified";
  const body = muisClaim
    ? "This business lists itself as MUIS-certified, but we haven’t recorded its certificate number yet — so we don’t show a verified badge. We only display official certification once the certificate is on file. Please confirm on the official HalalSG register."
    : pending
      ? "This business has submitted documents. We haven’t confirmed its halal status yet."
      : "This place describes itself as halal-friendly. We have not verified this — please confirm with the business directly.";
  return (
    <div className={`verif-card ${pending ? "pending" : "declared"}`} style={{ marginTop: 16 }}>
      <HalalScoreBar item={item} />
      <div className="verif-card-main">
        <div className="verif-seal warn"><Icon name={pending ? "clock" : "info"} size={22} /></div>
        <div className="f1">
          <div style={{ fontWeight: 700 }}>{heading}</div>
          <p className="muted" style={{ fontSize: ".88rem", marginTop: 4, lineHeight: 1.5 }}>
            {body}
            <span className="link-inline" onClick={() => navigate("verify")}> How we verify →</span>
          </p>
          {item.statusChanged && <div className="verif-changed"><Icon name="warning" size={13} /> Halal status recently changed — verify before visiting</div>}
        </div>
      </div>
      <div className="verif-card-foot">
        {muisClaim && (
          <a className="btn btn-soft btn-sm" href={halalSgVerifyUrl(undefined, item.name)} target="_blank" rel="noopener noreferrer"><Icon name="external" size={15} /> Check HalalSG register</a>
        )}
        <button className={`btn btn-sm ${confirmed ? "btn-primary" : "btn-outline"}`} onClick={async () => {
          if (confirmed) return;
          setConfirmed(true); // optimistic
          try {
            const res = await fetch("/api/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: item.id }) });
            if (!res.ok) throw new Error("failed");
            toast("Thanks — your confirmation helps the community");
          } catch {
            setConfirmed(false); // revert — don't claim success on failure
            toast("Couldn’t record that — please try again");
          }
        }}>
          <Icon name="crescent" size={15} /> {confirmed ? "You confirmed" : "Confirm it’s halal"}
        </button>
        <span className="verif-confirm-count"><strong>{confirms}</strong> community confirmations</span>
      </div>
    </div>
  );
}

export function PrayerSpaceCard({ item }: { item: Listing }) {
  const p = item.prayerInfo;
  if (!p || !p.has) return null;
  return (
    <div className="prayer-card">
      <div className="prayer-card-head"><span className="attn-ico"><Icon name="mosque" size={18} /></span><h3 style={{ fontSize: "1.1rem" }}>Prayer space available</h3></div>
      <div className="prayer-card-grid">
        <div className="pcg-item"><Icon name="user" size={15} /><div><span className="faint">Arrangement</span><div style={{ fontWeight: 600 }}>{p.gender}</div></div></div>
        <div className="pcg-item"><Icon name="check" size={15} /><div><span className="faint">Wudhu area</span><div style={{ fontWeight: 600 }}>{p.wudhu ? "Available" : "Not available"}</div></div></div>
        <div className="pcg-item"><Icon name="family" size={15} /><div><span className="faint">Capacity</span><div style={{ fontWeight: 600 }}>{p.capacity}</div></div></div>
        <div className="pcg-item"><Icon name="info" size={15} /><div><span className="faint">Note</span><div style={{ fontWeight: 600 }}>{p.note}</div></div></div>
      </div>
    </div>
  );
}

export function LocationsPanel({ item, outletIdx, setOutletIdx, toast }: {
  item: Listing;
  outletIdx: number;
  setOutletIdx: (i: number) => void;
  toast: (msg: string) => void;
}) {
  const outlets = item.outlets || [];
  return (
    <div className="detail-pane">
      <div className="flex between center wrap g10">
        <div>
          <h3 style={{ fontSize: "1.2rem" }}>{item.outletCount} outlets across Singapore</h3>
          <p className="muted" style={{ fontSize: ".9rem", marginTop: 4 }}>Every outlet is individually MUIS-certified. Pick one to see its hours and directions.</p>
        </div>
        <span className="tag"><Icon name="shield-check" size={13} /> All outlets certified</span>
      </div>

      {/* mini-map with outlet pins */}
      <div className="outlet-map hh-pattern">
        {outlets.map((o, i) => (
          <button key={o.id} className={`map-pin ${i === outletIdx ? "active" : ""}`}
            style={{ left: `${15 + (i * 23) % 70}%`, top: `${24 + (i * 29) % 52}%` }} onClick={() => setOutletIdx(i)}>
            <span className="pin-dot"><Icon name="shield-check" size={13} /></span>
          </button>
        ))}
      </div>

      <div className="outlet-list">
        {outlets.map((o, i) => (
          <div key={o.id} className={`outlet-card ${i === outletIdx ? "on" : ""}`} onClick={() => setOutletIdx(i)}>
            <div className="oc-top">
              <div className="flex g8 center">
                <span className="oo-name" style={{ fontSize: "1rem" }}>{o.name}</span>
                {o.flagship && <span className="oo-flag">Flagship</span>}
              </div>
              <span className={o.open ? "status-open" : "status-closed"} style={{ fontSize: ".8rem" }}>
                <span className={`status-dot ${o.open ? "open" : "closed"}`}></span>{o.open ? "Open" : "Closed"}
              </span>
            </div>
            <div className="oc-row"><Icon name="pin" size={15} /> {o.address}</div>
            <div className="oc-row"><Icon name="clock" size={15} /> {o.hours} · {o.distance} away</div>
            <div className="oc-foot">
              <span className="oc-cert"><Icon name="shield-check" size={13} /> MUIS · <span className="kbd-mono">{o.certNo}</span></span>
              <div className="flex g8">
                <a className="btn btn-soft btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.name} ${o.address}`)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}><Icon name="directions" size={15} /> Directions</a>
                {item.phone && <a className="btn btn-ghost btn-sm" href={telHref(item.phone)} aria-label={`Call ${o.name}`} onClick={(e) => e.stopPropagation()}><Icon name="phone" size={15} /></a>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailOverview({ item }: { item: Listing }) {
  return (
    <div className="detail-pane">
      <p style={{ fontSize: "1.02rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>{item.blurb}{item.area ? ` A neighbourhood favourite in ${item.area}, known for warm service${item.cuisine ? ` and consistent quality across ${item.cuisine.toLowerCase()}` : ""}.` : ""}</p>
      {/* Offers & promotions — Premium-only (offers_block). Hidden for lower tiers. */}
      {canUse(item, "offers_block") && (
        <div className="offers-block">
          <div className="offers-head"><Icon name="trophy" size={16} /> <span>Offers &amp; promotions</span></div>
          <p className="offers-body">Show your Humble Halal save to staff for current deals from {item.name}. Promotions are managed by the business from their dashboard.</p>
        </div>
      )}
      <PrayerSpaceCard item={item} />
      <div className="amenity-row">
        {item.tags.map((t) => {
          const s = t.toLowerCase();
          const href = s.includes("prayer") ? "/explore?prayer=1"
            : s.includes("family") ? "/explore?family=1"
            : s.includes("delivery") ? "/explore?delivery=1"
            : s.includes("certified") ? "/explore?halal=certified"
            : s.includes("owned") ? "/explore?owned=1"
            : null;
          return href
            ? <a key={t} className="tag tag-link" href={href}><Icon name="check" size={13} /> {t}</a>
            : <span key={t} className="tag"><Icon name="check" size={13} /> {t}</span>;
        })}
      </div>
      <h3 style={{ marginTop: 24, fontSize: "1.2rem" }}>Gallery</h3>
      <div className="gallery-grid mt12">
        {["signature dish", "interior", "counter", "dessert", "team", "exterior"].map((g, gi) => (
          <ImagePh key={g} label={g} tone={gi % 2 ? "gold" : "cream"} src={HHData.gallery[gi]} ratio="1" />
        ))}
      </div>
    </div>
  );
}

export function DetailReviews({ item }: { item: Listing }) {
  const { toast } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sort, setSort] = useState<"recent" | "helpful" | "rating">("recent");
  const [helped, setHelped] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);

  const slug = item.slug || item.id;

  // Replace the mock seed with real published reviews (by slug) via our own API
  // route. Reading server-side keeps the browser console clean when the backend
  // isn't fully provisioned — an empty result simply keeps the seeded examples.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const json = (await res.json()) as {
          reviews?: { id: string; rating: number; text: string; helpful: number | null; created_at: string }[];
        };
        const data = json.reviews;
        if (!alive || !data || data.length === 0) return;
        const rel = (iso: string) => {
          const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
          return d <= 0 ? "Today" : d === 1 ? "Yesterday" : d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`;
        };
        setReviews(
          data.map((r) => ({
            id: r.id,
            name: "Verified diner",
            avatar: "✓",
            rating: r.rating,
            date: rel(r.created_at),
            text: r.text,
            helpful: r.helpful ?? 0,
          })),
        );
      } catch {
        /* keep seeded reviews */
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  const addedCount = reviews.filter((r) => r.id.startsWith("new-")).length;
  const totalReviews = item.reviews + addedCount;

  // Rating distribution (5★ … 1★) computed from the loaded reviews, not hardcoded.
  const dist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r) => { const i = 5 - Math.round(r.rating); if (i >= 0 && i < 5) counts[i]++; });
    const total = reviews.length || 1;
    return counts.map((c) => Math.round((c / total) * 100));
  }, [reviews]);

  const sorted = useMemo(() => {
    const r = reviews.slice();
    if (sort === "helpful") r.sort((a, b) => b.helpful - a.helpful);
    else if (sort === "rating") r.sort((a, b) => b.rating - a.rating);
    return r; // "recent" keeps insertion order (new reviews are prepended)
  }, [reviews, sort]);

  const initials = (n: string) =>
    n.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "G";

  const submit = async () => {
    if (rating < 1) return toast("Pick a star rating");
    if (text.trim().length < 4) return toast("Add a few words to your review");
    setBusy(true);
    const optimistic = {
      id: `new-${Date.now()}`,
      name: name.trim() || "Guest",
      avatar: initials(name || "Guest"),
      rating,
      date: "Just now",
      text: text.trim(),
      helpful: 0,
    };
    setReviews((rs) => [optimistic, ...rs]);
    setShowForm(false);
    const payload = { businessSlug: slug, rating, name: optimistic.name, text: optimistic.text, website: hp };
    setRating(0); setName(""); setText("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      toast(data.pending ? "Review submitted for moderation" : "Thanks — your review is posted");
    } catch {
      toast("Saved — we’ll post it once you’re back online");
    } finally {
      setBusy(false);
    }
  };

  const markHelpful = (id: string) => {
    if (helped[id]) return;
    setHelped((h) => ({ ...h, [id]: true }));
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r)));
  };

  return (
    <div className="detail-pane">
      <div className="review-summary">
        <div className="rs-big">
          {totalReviews > 0 ? (
            <>
              <div className="rs-num">{item.rating.toFixed(1)}</div>
              <div className="rs-stars">{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="starf" size={16} style={{ color: i <= Math.round(item.rating) ? "var(--gold)" : "var(--line-strong)" }} />)}</div>
              <div className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>{totalReviews} reviews</div>
            </>
          ) : (
            <>
              <div className="rs-num" style={{ fontSize: "1.4rem" }}>New</div>
              <div className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>No reviews yet — be the first</div>
            </>
          )}
        </div>
        <div className="rs-bars">
          {dist.map((p, i) => (
            <div key={i} className="rs-bar"><span className="rs-lbl">{5 - i}</span><div className="rs-track"><div className="rs-fill" style={{ width: p + "%" }} /></div></div>
          ))}
        </div>
      </div>

      <div className="flex between center wrap g10 mt16">
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}><Icon name="edit" size={17} /> Write a review</button>
        <label className="flex g8 center faint" style={{ fontSize: ".84rem" }}>
          Sort
          <select className="select" style={{ width: "auto", padding: "7px 10px" }} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="recent">Most recent</option>
            <option value="helpful">Most helpful</option>
            <option value="rating">Highest rated</option>
          </select>
        </label>
      </div>

      {showForm && (
        <div className="review-form card mt12" style={{ padding: 16 }}>
          <div className="flex g8 center" style={{ marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: ".9rem" }}>Your rating</span>
            <div className="star-pick" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" aria-label={`${i} star${i > 1 ? "s" : ""}`} className="star-btn"
                  onMouseEnter={() => setHover(i)} onClick={() => setRating(i)}>
                  <Icon name="starf" size={26} style={{ color: i <= (hover || rating) ? "var(--gold)" : "var(--line-strong)" }} />
                </button>
              ))}
            </div>
          </div>
          <input className="input" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 8 }} />
          <textarea className="textarea" placeholder="What was your experience? Was it MUIS-certified, was there prayer space?" value={text} onChange={(e) => setText(e.target.value)} />
          {/* honeypot (hidden from users) */}
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
          <div className="flex g8" style={{ marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>{busy ? "Posting…" : "Post review"}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
          <p className="faint" style={{ fontSize: ".76rem", marginTop: 8 }}>Reviews are moderated. Be honest and respectful — confirm halal status on MUIS HalalSG.</p>
        </div>
      )}

      <div className="review-list mt16">
        {sorted.map((r) => (
          <div key={r.id} className="review-card">
            <div className="flex g10 center">
              <span className="avatar">{r.avatar}</span>
              <div><div style={{ fontWeight: 700 }}>{r.name}</div>
                <div className="flex g6 center"><span className="rs-stars">{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="starf" size={12} style={{ color: i <= r.rating ? "var(--gold)" : "var(--line-strong)" }} />)}</span><span className="faint" style={{ fontSize: ".78rem" }}>{r.date}</span></div></div>
            </div>
            <p className="muted" style={{ marginTop: 10, fontSize: ".92rem", lineHeight: 1.5 }}>{r.text}</p>
            <button className={`btn btn-ghost btn-sm ${helped[r.id] ? "voted" : ""}`} style={{ marginTop: 8, paddingLeft: 0 }} onClick={() => markHelpful(r.id)} disabled={helped[r.id]}>
              <Icon name="heart" size={15} /> Helpful ({r.helpful})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailInfo({ item, navigate }: {
  item: Listing;
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}) {
  return (
    <div className="detail-pane">
      <div className="info-row"><Icon name="pin" size={18} /><div><div style={{ fontWeight: 700 }}>Address</div><span className="muted">{item.address}</span></div></div>
      <div className="info-row"><Icon name="clock" size={18} /><div><div style={{ fontWeight: 700 }}>Hours</div><span className="muted">{item.hours}</span></div></div>
      <div className="info-row"><Icon name="phone" size={18} /><div><div style={{ fontWeight: 700 }}>Phone</div><span className="muted">{item.phone || "—"}</span></div></div>
      <div className="info-row"><Icon name="shield-check" size={18} /><div><div style={{ fontWeight: 700 }}>Halal status</div>
        <span className="muted">{item.badges.includes("muis") && !muisUnbacked(item) ? "MUIS certified — verify on HalalSG" : item.badges.includes("admin") ? "Admin verified by Humble Halal" : item.badges.includes("muis") ? "MUIS certificate not yet on file" : "Self-declared — not certified"}</span>
        <div className="link-inline" style={{ marginTop: 4 }} onClick={() => navigate("verify")}>Learn how we verify →</div></div></div>
    </div>
  );
}
