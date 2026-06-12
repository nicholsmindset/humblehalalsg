"use client";

/* Humble Halal — Consumer screens: Home, Explore, Map, Detail
   (ported from screens-consumer.jsx). */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HHData, SG_CENTER, getListing } from "@/lib/data";
import type { BadgeKey, LatLng, Listing } from "@/lib/types";
import { haversineKm, formatKm, mapsSearchUrl } from "@/lib/geo";
import { scoreListing, scoreTone } from "@/lib/halal-score";
import { halalSgSearchUrl } from "@/lib/muis";
import { shareOrCopy } from "@/lib/share";
import { useApp } from "../app-context";
import { Badge, Empty, Icon, ImagePh, ListingCard, Rating, SearchBar, SectionHead } from "../ui";
import { CategoryButton, MobileHeader } from "../ui";
import { CertifiedToggle } from "../chrome";
import { EventsStrip } from "./events";
import { MapView, type MapPoint } from "../map/map-view";
import { Faq } from "../faq";
import { HOME_FAQ } from "@/lib/faq";
import { Breadcrumbs } from "../breadcrumbs";

/* =============================================================
   HOME
============================================================= */
export function HomeScreen() {
  const { navigate, state } = useApp();
  const [q, setQ] = useState("");
  const tw = state.tweaks;
  const featured = HHData.listings.filter((l) => l.featured && (!state.prefs || !state.prefs.certifiedOnly || l.certified)).slice(0, 6);

  const doSearch = (val: string) => navigate("explore", { q: val });

  return (
    <div className="screen-in hh-page">
      {/* HERO */}
      <Hero variant={tw.hero} q={q} setQ={setQ} doSearch={doSearch} navigate={navigate} />

      {/* CATEGORIES */}
      <section className="hh-wrap" style={{ marginTop: 30 }}>
        <div className="cat-grid">
          {HHData.categories.map((c) => (
            <CategoryButton key={c.id} cat={c}
              onClick={() => c.id === "mosques" ? navigate("map") : navigate("explore", { cat: c.id })} />
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="hh-wrap hh-section">
        <SectionHead title="Featured this week" action="See all" onAction={() => navigate("explore", { sort: "featured" })} />
        <div className="grid-cards">
          {featured.map((l) => <ListingCard key={l.id} item={l} />)}
        </div>
      </section>

      {/* POPULAR AREAS */}
      <section className="hh-wrap hh-section" style={{ paddingTop: 0 }}>
        <SectionHead title="Popular areas in Singapore" action="Browse all areas" onAction={() => navigate("explore")} />
        <div className="area-grid">
          {HHData.areas.map((a) => (
            <button key={a.id} className="area-card card card-hover" onClick={() => navigate("seo", { area: a.id })}>
              <ImagePh label={a.name.toLowerCase() + " street"} tone={a.tone} src={a.image} style={{ position: "absolute", inset: 0 }} icon="building" />
              <div className="area-ov">
                <span className="area-name">{a.name}</span>
                <span className="area-count">{a.count} places</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <TrustStrip navigate={navigate} />

      {/* EVENTS STRIP */}
      <EventsStrip />

      {/* BUSINESS CTA */}
      <section className="hh-wrap" style={{ paddingBottom: 48 }}>
        <div className="biz-cta hh-pattern-gold">
          <div className="biz-cta-in">
            <div>
              <span className="eyebrow" style={{ color: "var(--gold)" }}>For business owners</span>
              <h2 style={{ color: "#fff", fontSize: "1.9rem", marginTop: 10, maxWidth: 520 }}>List your business on Humble Halal</h2>
              <p style={{ color: "#DDEAE4", marginTop: 10, maxWidth: 480 }}>
                Get discovered by Singapore’s Muslim community, earn trust with verified halal labels, and turn searches into visits.
              </p>
              <div className="flex g10 wrap" style={{ marginTop: 18 }}>
                <button className="btn btn-gold btn-lg" onClick={() => navigate("add-listing")}>List your business</button>
                <button className="btn btn-lg" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }} onClick={() => navigate("for-business")}>Learn more</button>
              </div>
            </div>
            <div className="biz-cta-stats">
              {([["12,400+", "Listings"], ["480K", "Monthly searches"], ["96%", "Trust rating"]] as [string, string][]).map(([v, l]) => (
                <div key={l} className="biz-stat"><div className="bv">{v}</div><div className="bl">{l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — visible + FAQPage schema (emitted at the page level) */}
      <Faq items={HOME_FAQ} title="Halal in Singapore — your questions, answered" />
    </div>
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
  const quickChips = (
    <div className="pillbar" style={{ marginTop: 16, justifyContent: variant === "classic" ? "center" : "flex-start" }}>
      <button className="chip" onClick={() => navigate("map")}><Icon name="near" size={16} /> {t("chip.nearMe")}</button>
      <button className="chip" onClick={() => navigate("explore", { open: true })}>{t("chip.openNow")}</button>
      <button className="chip" onClick={() => navigate("explore", { prayer: true })}>{t("chip.prayer")}</button>
      <button className="chip" onClick={() => navigate("explore", { cat: "restaurants" })}>Restaurants</button>
      <button className="chip" onClick={() => navigate("events")}><Icon name="calendar" size={15} /> {t("nav.events")}</button>
      <button className="chip" onClick={() => navigate("explore", { family: true })}>{t("chip.family")}</button>
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
    return (
      <section className="hero hero--split">
        <div className="hh-wrap hero-split-grid">
          <div className="hero-split-text">
            <span className="eyebrow">{t("hero.eyebrow")}</span>
            <h1 className="hero-h1">{t("hero.h1")}</h1>
            <p className="hero-sub">{t("hero.sub")}</p>
            <div style={{ marginTop: 18 }}><SearchBar value={q} onChange={setQ} onSubmit={doSearch} suggest placeholder={t("hero.search")} /></div>
            {quickChips}
          </div>
          <div className="hero-collage">
            <ImagePh label="nasi padang" tone="gold" src={HHData.collage[0]} style={{ gridArea: "a" }} icon="utensils" priority sizes="(max-width: 768px) 60vw, 360px" />
            <ImagePh label="kopi café" tone="emerald" src={HHData.collage[1]} style={{ gridArea: "b" }} icon="coffee" sizes="(max-width: 768px) 40vw, 220px" />
            <ImagePh label="SG shophouse" tone="cream" src={HHData.collage[2]} style={{ gridArea: "c" }} icon="building" />
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

  // Keep the URL in sync so searches/filters are shareable, bookmarkable and crawlable.
  useEffect(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (sort && sort !== "featured") sp.set("sort", sort);
    (["cat", "area", "price", "halal"] as const).forEach((k) => {
      if (filters[k]) sp.set(k, String(filters[k]));
    });
    (["owned", "prayer", "family", "delivery", "open"] as const).forEach((k) => {
      if (filters[k]) sp.set(k, "1");
    });
    const qs = sp.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  }, [q, sort, filters, router]);

  const results = useMemo(() => {
    let r = HHData.listings.slice();
    if (state.prefs && state.prefs.certifiedOnly) r = r.filter((l) => l.certified);
    if (q) { const s = q.toLowerCase(); r = r.filter((l) => (l.name + l.cuisine + l.area + l.blurb).toLowerCase().includes(s)); }
    if (filters.cat) r = r.filter((l) => l.catId === filters.cat);
    if (filters.area) r = r.filter((l) => l.area.toLowerCase().includes(filters.area));
    if (filters.price) r = r.filter((l) => l.price === filters.price);
    if (filters.halal === "certified") r = r.filter((l) => l.badges.some((b) => ["muis", "admin"].includes(b)));
    if (filters.halal === "muis") r = r.filter((l) => l.badges.includes("muis"));
    if (filters.owned) r = r.filter((l) => l.badges.includes("owned"));
    if (filters.prayer) r = r.filter((l) => l.prayer);
    if (filters.family) r = r.filter((l) => l.badges.includes("family"));
    if (filters.delivery) r = r.filter((l) => l.delivery);
    if (filters.open) r = r.filter((l) => l.open);
    if (sort === "rating") r.sort((a, b) => b.rating - a.rating);
    if (sort === "newest") r.reverse();
    if (sort === "nearest") r.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    if (sort === "featured") r.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return r;
  }, [q, filters, sort, state.prefs]);

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "").length;

  return (
    <div className="screen-in hh-page">
      <div className="explore-top">
        <div className="hh-wrap" style={{ paddingTop: 16, paddingBottom: 14 }}>
          <SearchBar value={q} onChange={setQ} onSubmit={setQ} placeholder="Search restaurants, cafés, services…" suggest />
          <div className="flex between center" style={{ marginTop: 12, gap: 10 }}>
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
              {filters.cat && <span> in {HHData.categories.find((c) => c.id === filters.cat)?.label}</span>}
              {state.prefs && state.prefs.certifiedOnly && <span className="cert-active-note"><Icon name="shield-check" size={13} /> certified only</span>}
            </p>
          </div>

          {view === "map" ? (
            <MapPreview results={results} navigate={navigate} />
          ) : results.length === 0 ? (
            <Empty icon="search" title="No places match your search"
              body="Try removing a filter or searching a different area. You can also suggest a place we’re missing."
              action="Suggest a business" onAction={() => navigate("suggest")} />
          ) : (
            <div className="grid-cards">
              {results.map((l) => <ListingCard key={l.id} item={l} />)}
            </div>
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
          {HHData.categories.slice(0, 6).map((c) => <Opt key={c.id} k="cat" v={c.id} label={c.label} />)}
        </div>
      </Section>
      <Section title="Area">
        <div className="fp-opts">
          {HHData.areas.map((a) => <Opt key={a.id} k="area" v={a.name.toLowerCase()} label={a.name} />)}
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
export function MapPreview({ results, navigate }: {
  results: Listing[];
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}) {
  return (
    <div className="map-preview card">
      <div className="map-canvas hh-pattern">
        {results.slice(0, 8).map((l, i) => (
          <button key={l.id} className="map-pin" style={{ left: `${12 + (i * 11) % 76}%`, top: `${18 + (i * 23) % 62}%` }}
            onClick={() => navigate("detail", { id: l.id })}>
            <span className="pin-dot"><Icon name={l.badges.some((b) => ["muis", "admin"].includes(b)) ? "shield-check" : "pin"} size={14} /></span>
            <span className="pin-price">{l.price}</span>
          </button>
        ))}
        <div className="map-roads" />
        <button className="btn btn-primary btn-sm map-this" onClick={() => {}}><Icon name="refresh" size={15} /> Search this area</button>
      </div>
      <div className="map-cardrail">
        {results.map((l) => <div key={l.id} className="map-railcard"><ListingCard item={l} variant="row" /></div>)}
      </div>
    </div>
  );
}

/* =============================================================
   FULL MAP VIEW
============================================================= */
export function MapScreen() {
  const { navigate, toast, state, params } = useApp();
  const wantMosques = params.show === "mosques";
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMosque, setActiveMosque] = useState<string | null>(null);
  const [chips, setChips] = useState({ open: false, prayer: false, family: false, mosque: !!wantMosques });
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const tog = (k: keyof typeof chips) => setChips((c) => ({ ...c, [k]: !c[k] }));
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

  // Arrived via "Mosques near me" → ask for location once so we can sort by nearest.
  useEffect(() => {
    if (wantMosques) nearMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(() => {
    let r = HHData.listings.filter((l) => l.coords);
    if (state.prefs?.certifiedOnly) r = r.filter((l) => l.certified);
    if (chips.open) r = r.filter((l) => l.open);
    if (chips.prayer) r = r.filter((l) => l.prayer);
    if (chips.family) r = r.filter((l) => l.badges.includes("family"));
    if (userLoc) {
      r = r
        .map((l) => ({ ...l, distanceKm: l.coords ? haversineKm(userLoc, l.coords) : undefined }))
        .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    }
    return r;
  }, [chips, userLoc, state.prefs?.certifiedOnly]);

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

  return (
    <div className="map-screen">
      <div className="map-full">
        <div className="map-live">
          <MapView center={center} zoom={userLoc ? 14 : 12} points={points} onSelect={onSelect} />
        </div>

        {/* floating top controls */}
        <div className="map-controls">
          <div className="searchbar" style={{ flex: 1, boxShadow: "var(--sh-md)" }}>
            <Icon name="search" className="lead" />
            <input placeholder="Search this area" aria-label="Search this area" />
          </div>
          <button className="map-iconbtn" aria-label="View as list" onClick={() => navigate("explore")}>
            <Icon name="list" size={20} />
          </button>
        </div>
        <div className="map-chiprow pillbar">
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

        {/* bottom card carousel */}
        <div className="map-carousel">
          {chips.mosque ? (
            mosqueList.map((m) => (
              <div
                key={m.id}
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
            <div className="map-cc on" style={{ display: "grid", placeItems: "center", color: "var(--ink-soft)", fontWeight: 600 }}>
              No places match these filters
            </div>
          ) : (
            list.map((l) => (
              <div
                key={l.id}
                className={`map-cc ${l.id === activeId ? "on" : ""}`}
                onClick={() => (l.id === activeId ? navigate("detail", { id: l.id }) : setActiveId(l.id))}
              >
                <ListingCard item={l} variant="row" />
                {l.distanceKm != null && (
                  <span className="map-cc-dist"><Icon name="near" size={12} /> {formatKm(l.distanceKm)} away</span>
                )}
              </div>
            ))
          )}
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
  const item = getListing(String(params.slug || params.id || "")) || HHData.listings[0];
  const saved = state.saved.includes(item.id);
  const [tab, setTab] = useState("overview");
  const [outletIdx, setOutletIdx] = useState(0);
  const outlet = item.franchise && item.outlets ? item.outlets[outletIdx] : null;
  const tabs = item.franchise ? ["overview", "locations", "menu", "reviews", "info"] : ["overview", "menu", "reviews", "info"];

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

  const contacts = [
    item.phone && { icon: "phone", label: "Call", val: item.phone },
    item.wa && { icon: "whatsapp", label: "WhatsApp", val: item.wa },
    { icon: "directions", label: "Directions", val: "Open in Maps" },
    item.web && { icon: "globe", label: "Website", val: item.web },
    item.ig && { icon: "instagram", label: "Instagram", val: item.ig },
  ].filter(Boolean) as { icon: string; label: string; val: string }[];

  return (
    <div className="screen-in detail-screen hh-page">
      <MobileHeader title="" onBack={() => navigate("explore")}
        right={<button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => toggleSave(item.id)}>
          <Icon name="heart" size={22} style={{ fill: saved ? "var(--danger)" : "none", color: saved ? "var(--danger)" : "var(--ink-soft)" }} /></button>} />

      {/* cover */}
      <div className="detail-cover">
        <ImagePh label={item.img} tone={item.tone} src={item.image} style={{ position: "absolute", inset: 0 }} icon="camera" priority sizes="100vw" />
        <div className="detail-gallery">
          {["interior", "dish detail", "storefront"].map((g, gi) => (
            <ImagePh key={g} label={g} tone="cream" src={HHData.gallery[gi]} style={{ width: 64, height: 48, borderRadius: 8 }} />
          ))}
          <button className="gallery-more">+8</button>
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
              <button className="btn btn-outline btn-sm" onClick={() => toggleSave(item.id)}>
                <Icon name="heart" size={17} style={{ fill: saved ? "var(--danger)" : "none", color: saved ? "var(--danger)" : undefined }} /> {saved ? "Saved" : "Save"}</button>
            </div>
          </div>

          <div className="flex g14 center wrap" style={{ marginTop: 12 }}>
            <Rating value={item.rating} count={item.reviews} />
            <span className="faint">·</span>
            <span className={item.open ? "status-open" : "status-closed"} style={{ fontSize: ".88rem" }}>
              <span className={`status-dot ${item.open ? "open" : "closed"}`}></span>{item.hours}</span>
          </div>

          {/* badge row */}
          <div className="lc-badges" style={{ marginTop: 16, gap: 8 }}>
            {item.badges.map((b) => <Badge key={b} type={b} lg />)}
            {item.prayer && <Badge type="prayer" lg />}
          </div>

          {/* Verification provenance + community confirmation */}
          <VerificationCard item={item} navigate={navigate} toast={toast} />

          {/* contact buttons */}
          <div className="contact-grid">
            {contacts.map((c) => (
              <button key={c.label} className="contact-btn" onClick={() => toast(`${c.label}: ${c.val}`)}>
                <Icon name={c.icon} size={20} /><span>{c.label}</span>
              </button>
            ))}
          </div>

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
          {tab === "menu" && <DetailMenu item={item} />}
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
              <button className="btn btn-gold" onClick={() => navigate("request-quote", { category: quoteVertical })}><Icon name="doc" size={17} /> Request a quote</button>
            )}
            <button className="btn btn-ghost" onClick={() => navigate("report", { id: item.id })}><Icon name="flag" size={17} /> Report incorrect info</button>
            <button className="btn btn-outline" onClick={() => navigate("claim", { id: item.id })}><Icon name="building" size={17} /> Claim this business</button>
          </div>

          {/* internal linking: related places + landing pages */}
          {(() => {
            const related = HHData.listings
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
              <button className="btn btn-primary btn-block mt12" onClick={() => toast(`Directions to ${outlet.name}…`)}><Icon name="directions" size={18} /> Directions to this outlet</button>
            </div>
          ) : (
          <div className="card" style={{ padding: 18 }}>
            <div className="flex between center"><h3 style={{ fontSize: "1.05rem" }}>Hours &amp; location</h3>
              <span className={item.open ? "status-open" : "status-closed"} style={{ fontSize: ".82rem" }}>{item.open ? "Open now" : "Closed"}</span></div>
            <div className="hours-list">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                <div key={d} className={`hours-row ${i === new Date().getDay() - 1 ? "today" : ""}`}>
                  <span>{d}</span><span className="muted">{i === 6 ? "Closed" : "9:00 AM – 9:30 PM"}</span>
                </div>
              ))}
            </div>
            <hr className="divider" style={{ margin: "14px 0" }} />
            <div className="flex g8" style={{ alignItems: "flex-start" }}>
              <Icon name="pin" size={18} style={{ color: "var(--emerald)", marginTop: 2, flex: "none" }} />
              <span className="muted" style={{ fontSize: ".88rem" }}>{item.address}</span>
            </div>
            <ImagePh label="map location" tone="emerald" style={{ height: 120, borderRadius: 12, marginTop: 12 }} icon="map" />
            <button className="btn btn-primary btn-block mt12" onClick={() => toast("Opening directions…")}><Icon name="directions" size={18} /> Get directions</button>
          </div>
          )}
        </aside>
      </div>

      {/* sticky mobile contact bar */}
      <div className="detail-stickybar">
        {item.phone && <button className="btn btn-outline btn-sm" onClick={() => toast(`Call: ${item.phone}`)}><Icon name="phone" size={17} /> Call</button>}
        {item.wa && <button className="btn btn-soft btn-sm" onClick={() => toast(`WhatsApp: ${item.wa}`)}><Icon name="whatsapp" size={17} /> WhatsApp</button>}
        <button className="btn btn-primary btn-sm" onClick={() => toast("Opening directions…")}><Icon name="directions" size={17} /> Directions</button>
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

  if (item.certified) {
    const isMuis = item.badges.includes("muis");
    return (
      <div className="verif-card certified" style={{ marginTop: 16 }}>
        <HalalScoreBar item={item} />
        <div className="verif-card-main">
          <div className="verif-seal"><Icon name="shield-check" size={24} /></div>
          <div className="f1">
            <div className="flex g8 center wrap">
              <Badge type={item.badges.find((b) => ["muis", "admin"].includes(b)) as BadgeKey} lg />
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
            ? <a className="btn btn-soft btn-sm" href={halalSgSearchUrl(item.name)} target="_blank" rel="noopener noreferrer"><Icon name="external" size={15} /> Verify on HalalSG</a>
            : <button className="btn btn-soft btn-sm" onClick={() => navigate("verify")}><Icon name="doc" size={15} /> View verification</button>}
          <span className="verif-confirm-count"><Icon name="crescent" size={14} /> <strong>{confirms}</strong> Muslims confirmed halal here</span>
        </div>
      </div>
    );
  }

  // Self-declared / pending
  const pending = item.badges.includes("pending");
  return (
    <div className={`verif-card ${pending ? "pending" : "declared"}`} style={{ marginTop: 16 }}>
      <HalalScoreBar item={item} />
      <div className="verif-card-main">
        <div className="verif-seal warn"><Icon name={pending ? "clock" : "info"} size={22} /></div>
        <div className="f1">
          <div style={{ fontWeight: 700 }}>{pending ? "Verification under review" : "Self-declared — not certified"}</div>
          <p className="muted" style={{ fontSize: ".88rem", marginTop: 4, lineHeight: 1.5 }}>
            {pending
              ? "This business has submitted documents. We haven’t confirmed its halal status yet."
              : "This place describes itself as halal-friendly. We have not verified this — please confirm with the business directly."}
            <span className="link-inline" onClick={() => navigate("verify")}> How we verify →</span>
          </p>
          {item.statusChanged && <div className="verif-changed"><Icon name="warning" size={13} /> Halal status recently changed — verify before visiting</div>}
        </div>
      </div>
      <div className="verif-card-foot">
        <button className={`btn btn-sm ${confirmed ? "btn-primary" : "btn-outline"}`} onClick={() => { if (!confirmed) { setConfirmed(true); toast("Thanks — your confirmation helps the community"); } }}>
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
                <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); toast(`Directions to ${o.name}…`); }}><Icon name="directions" size={15} /> Directions</button>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); toast(`Calling ${o.name}…`); }}><Icon name="phone" size={15} /></button>
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
      <p style={{ fontSize: "1.02rem", color: "var(--ink-soft)", lineHeight: 1.6 }}>{item.blurb} A neighbourhood favourite in {item.area}, known for warm service and consistent quality across {item.cuisine.toLowerCase()}.</p>
      <PrayerSpaceCard item={item} />
      <div className="amenity-row">
        {item.tags.map((t) => <span key={t} className="tag"><Icon name="check" size={13} /> {t}</span>)}
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

export function DetailMenu({ item }: { item: Listing }) {
  const menu = [
    { name: "Beef Rendang Set", desc: "Slow-cooked 6 hours, with rice & sayur", price: "$9.80" },
    { name: "Ayam Penyet", desc: "Smashed fried chicken, sambal & tempeh", price: "$8.50" },
    { name: "Sambal Sotong", desc: "Squid in house sambal", price: "$10.50" },
    { name: "Teh Tarik", desc: "Pulled milk tea", price: "$2.20" },
  ];
  return (
    <div className="detail-pane">
      <div className="flex between center"><h3 style={{ fontSize: "1.2rem" }}>Popular menu</h3><span className="faint" style={{ fontSize: ".82rem" }}>Prices indicative</span></div>
      <div className="menu-list mt12">
        {menu.map((m) => (
          <div key={m.name} className="menu-item">
            <ImagePh label={m.name.toLowerCase()} tone="gold" style={{ width: 72, height: 72, borderRadius: 12, flex: "none" }} />
            <div className="f1"><div className="flex between"><span style={{ fontWeight: 700 }}>{m.name}</span><span style={{ fontWeight: 700, color: "var(--emerald)" }}>{m.price}</span></div>
              <p className="muted" style={{ fontSize: ".86rem", marginTop: 4 }}>{m.desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailReviews({ item }: { item: Listing }) {
  const { toast } = useApp();
  const dist = [70, 18, 8, 3, 1];
  return (
    <div className="detail-pane">
      <div className="review-summary">
        <div className="rs-big">
          <div className="rs-num">{item.rating.toFixed(1)}</div>
          <div className="rs-stars">{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="starf" size={16} style={{ color: i <= Math.round(item.rating) ? "var(--gold)" : "var(--line-strong)" }} />)}</div>
          <div className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>{item.reviews} reviews</div>
        </div>
        <div className="rs-bars">
          {dist.map((p, i) => (
            <div key={i} className="rs-bar"><span className="rs-lbl">{5 - i}</span><div className="rs-track"><div className="rs-fill" style={{ width: p + "%" }} /></div></div>
          ))}
        </div>
      </div>
      <button className="btn btn-outline mt16" onClick={() => toast("Review form coming soon")}><Icon name="edit" size={17} /> Write a review</button>
      <div className="review-list mt16">
        {HHData.reviews.map((r) => (
          <div key={r.id} className="review-card">
            <div className="flex g10 center">
              <span className="avatar">{r.avatar}</span>
              <div><div style={{ fontWeight: 700 }}>{r.name}</div>
                <div className="flex g6 center"><span className="rs-stars">{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="starf" size={12} style={{ color: i <= r.rating ? "var(--gold)" : "var(--line-strong)" }} />)}</span><span className="faint" style={{ fontSize: ".78rem" }}>{r.date}</span></div></div>
            </div>
            <p className="muted" style={{ marginTop: 10, fontSize: ".92rem", lineHeight: 1.5 }}>{r.text}</p>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, paddingLeft: 0 }}><Icon name="heart" size={15} /> Helpful ({r.helpful})</button>
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
        <span className="muted">{item.badges.includes("muis") ? "MUIS certified — verify on HalalSG" : item.badges.includes("admin") ? "Admin verified by Humble Halal" : "Self-declared — not certified"}</span>
        <div className="link-inline" style={{ marginTop: 4 }} onClick={() => navigate("verify")}>Learn how we verify →</div></div></div>
    </div>
  );
}
