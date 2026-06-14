"use client";

/* Humble Halal — app chrome (ported from app.jsx): TopNav, BottomNav, Footer,
   PrayerStrip, Onboarding, CertifiedToggle. */
import { useCallback, useEffect, useRef, useState } from "react";
import { HHData } from "@/lib/data";
import { SITE } from "@/lib/seo";
import { allSeoPages } from "@/lib/seo-pages";
import { useApp } from "./app-context";
import { Badge, Icon, Logo, useDialog } from "./ui";
import { Newsletter } from "./newsletter";

/* ---------------- CERTIFIED-ONLY TOGGLE ---------------- */
export function CertifiedToggle({ compact }: { compact?: boolean }) {
  const { state, toggleCertifiedOnly, t } = useApp();
  const on = state.prefs && state.prefs.certifiedOnly;
  return (
    <button
      className={`cert-toggle ${on ? "on" : ""} ${compact ? "compact" : ""}`}
      onClick={toggleCertifiedOnly}
      aria-pressed={!!on}
      title="Show only MUIS-certified & verified places"
    >
      <Icon name="shield-check" size={16} />
      {!compact && <span>{t("nav.certifiedOnly")}</span>}
      <span className="cert-switch">
        <span className="cert-knob" />
      </span>
    </button>
  );
}

/* ---------------- PRAYER TIMES + NEAREST MOSQUE STRIP ---------------- */
type PrayerRow = { name: string; time: string; mins?: number };

// Minutes-since-midnight for a row (uses the API's `mins`, else derives from the
// SG ordering: Subuh/Syuruk are AM, the rest PM).
function rowMins(t: PrayerRow, i: number): number {
  if (typeof t.mins === "number") return t.mins;
  const [h, m] = t.time.split(":").map(Number);
  return ((h % 12) + (i >= 2 ? 12 : 0)) * 60 + (m || 0);
}
function sgNowMins(): number {
  try {
    const s = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Singapore", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  } catch {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}
// Next PRAYER for "now" (skip Syuruk/sunrise at index 1; wrap to Subuh after Isyak).
function computeNextIndex(times: PrayerRow[]): number {
  const now = sgNowMins();
  const candidates = times.map((_, i) => i).filter((i) => i !== 1);
  for (const i of candidates) if (rowMins(times[i], i) > now) return i;
  return candidates[0] ?? 0;
}

export function PrayerStrip({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { state, navigate, ramadan, toggleRamadan } = useApp();
  const fallback = HHData.prayerTimes;
  const [pt, setPt] = useState<{ date: string; hijri: string; times: PrayerRow[] }>(fallback);
  const [nextIndex, setNextIndex] = useState(fallback.nextIndex);

  // Fetch today's real Singapore times (MUIS method) once on mount.
  useEffect(() => {
    let alive = true;
    fetch("/api/prayer-times")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.ok && Array.isArray(d.times) && d.times.length) setPt({ date: d.date, hijri: d.hijri, times: d.times }); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Recompute the next prayer from the current time (and refresh each minute).
  useEffect(() => {
    const update = () => setNextIndex(computeNextIndex(pt.times));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [pt]);

  const next = pt.times[nextIndex] ?? pt.times[0];
  const mosque = HHData.mosques[0];
  if (state.prefs && state.prefs.prayerHidden) return null;
  return (
    <>
    <div className={`prayer-strip ${open ? "open" : ""}`}>
      <div className="hh-wrap prayer-strip-bar">
        <button
          className="prayer-lead"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={`Prayer times. Next: ${next.name} at ${next.time}`}
        >
          <span className="prayer-ico">
            <Icon name="mosque" size={17} />
          </span>
          <span className="prayer-next">
            <strong>
              {next.name} {next.time}
            </strong>
            <span className="prayer-sub">next prayer</span>
          </span>
          <Icon name="chevdown" size={16} className={`prayer-caret ${open ? "up" : ""}`} />
        </button>
        <button className="prayer-mosque" onClick={() => navigate("map", { show: "mosques" })}>
          <Icon name="pin" size={15} />{" "}
          <span>
            <strong>{mosque.name}</strong> · {mosque.dist || mosque.area}
          </span>
        </button>
      </div>
      {open && (
        <div className="hh-wrap prayer-expand">
          <div className="prayer-times">
            {pt.times.map((t, i) => (
              <div key={t.name} className={`prayer-cell ${i === nextIndex ? "now" : ""}`}>
                <span className="pc-name">{t.name}</span>
                <span className="pc-time">{t.time}</span>
              </div>
            ))}
          </div>
          <div className="prayer-foot">
            <span className="faint">{pt.hijri} · times for Singapore</span>
            <div className="flex g8 center">
              <button className="btn btn-soft btn-sm" onClick={() => navigate("map", { show: "mosques" })}>
                <Icon name="mosque" size={15} /> Mosques near me
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Hide
              </button>
            </div>
          </div>
          <button
            className={`ramadan-toggle ${ramadan ? "on" : ""}`}
            onClick={toggleRamadan}
            aria-pressed={ramadan}
          >
            <span className="flex g8 center">
              <Icon name="crescent" size={16} /> Ramadan mode — iftar &amp; open-late spots
            </span>
            <span className="cert-switch">
              <span className="cert-knob" />
            </span>
          </button>
        </div>
      )}
    </div>
    {ramadan && (
      <div className="ramadan-bar">
        <div className="hh-wrap">
          <span className="flex g8 center">
            <Icon name="crescent" size={16} /> <strong>Ramadan mode</strong> · iftar deals, bazaars &amp; open-late spots
          </span>
          <button className="btn btn-sm" onClick={() => navigate("events", { cat: "bazaar" })}>
            Find iftar &amp; bazaars <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    )}
    </>
  );
}

/* ---------------- FIRST-RUN ONBOARDING ---------------- */
export function Onboarding() {
  const { setPref, toast } = useApp();
  const [step, setStep] = useState(0);
  const [area, setArea] = useState("");
  const [strict, setStrict] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const finish = () => {
    setPref({ onboarded: true, homeArea: area, certifiedOnly: strict === "certified" });
    toast("Welcome to Humble Halal");
  };
  const skip = () => setPref({ onboarded: true });
  useDialog(ref, skip);

  return (
    <div
      className="modal-veil"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("modal-veil")) skip();
      }}
    >
      <div className="modal onboard" ref={ref} role="dialog" aria-modal="true" aria-label="Welcome to Humble Halal">
        <div className="onboard-head">
          <div className="hh-logo">
            <div className="mark">
              <Icon name="crescent" size={18} />
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: 8 }} onClick={skip} aria-label="Skip onboarding">
            <Icon name="x" size={18} />
          </button>
        </div>

        {step === 0 && (
          <div className="screen-in">
            <span className="eyebrow">Assalamualaikum 👋</span>
            <h2 style={{ fontSize: "1.6rem", marginTop: 8 }}>Welcome to Humble Halal</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Singapore’s trusted halal &amp; Muslim lifestyle guide. Let’s set it up for you in two
              quick steps.
            </p>
            <div className="onboard-feats">
              {(
                [
                  ["shield-check", "Know what’s certified"],
                  ["mosque", "Prayer times & mosques"],
                  ["heart", "Save your favourites"],
                ] as [string, string][]
              ).map(([ic, t]) => (
                <div key={t} className="onboard-feat">
                  <span className="attn-ico">
                    <Icon name={ic} size={17} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-block btn-lg mt20" onClick={() => setStep(1)}>
              Get started <Icon name="arrow" size={17} />
            </button>
            <button className="btn btn-ghost btn-block btn-sm mt8" onClick={skip}>
              Skip for now
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="screen-in">
            <span className="eyebrow">Step 1 of 2</span>
            <h2 style={{ fontSize: "1.4rem", marginTop: 8 }}>Where are you based?</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              We’ll surface halal spots and mosques near you first.
            </p>
            <div className="onboard-areas">
              {HHData.areas.map((a) => (
                <button
                  key={a.id}
                  className={`onboard-chip ${area === a.id ? "on" : ""}`}
                  onClick={() => setArea(a.id)}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-block btn-lg mt20"
              disabled={!area}
              onClick={() => setStep(2)}
            >
              Continue <Icon name="arrow" size={17} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="screen-in">
            <span className="eyebrow">Step 2 of 2</span>
            <h2 style={{ fontSize: "1.4rem", marginTop: 8 }}>How strict should we be?</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              You can change this anytime with the “Certified only” switch.
            </p>
            <div className="stack g10 mt16">
              <button
                className={`halal-opt ${strict === "certified" ? "on" : ""}`}
                onClick={() => setStrict("certified")}
              >
                <div className="flex g12 center">
                  <Badge type="muis" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>Certified only</div>
                    <div className="faint" style={{ fontSize: ".8rem" }}>
                      Show only MUIS / verified places
                    </div>
                  </div>
                </div>
                <span className={`radio ${strict === "certified" ? "on" : ""}`} />
              </button>
              <button
                className={`halal-opt ${strict === "all" ? "on" : ""}`}
                onClick={() => setStrict("all")}
              >
                <div className="flex g12 center">
                  <Badge type="friendly" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700 }}>Show everything</div>
                    <div className="faint" style={{ fontSize: ".8rem" }}>
                      Include self-declared, clearly labelled
                    </div>
                  </div>
                </div>
                <span className={`radio ${strict === "all" ? "on" : ""}`} />
              </button>
            </div>
            <button
              className="btn btn-primary btn-block btn-lg mt20"
              disabled={!strict}
              onClick={finish}
            >
              Start exploring <Icon name="arrow" size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- TOP NAV (desktop) ---------------- */
export function TopNav() {
  const { route, navigate, state, t } = useApp();
  const user = state.user;
  const links = [
    { id: "explore", label: t("nav.explore") },
    { id: "ask", label: "Ask AI" },
    { id: "travel", label: "Travel" },
    { id: "events", label: t("nav.events") },
    { id: "for-business", label: t("nav.forBusiness") },
    { id: "pricing", label: t("nav.pricing") },
  ];
  return (
    <header className="hh-topnav">
      <div className="hh-wrap inner">
        <Logo onClick={() => navigate("home")} />
        <nav aria-label="Primary">
          {links.map((l, i) => (
            <a
              key={i}
              href={`/${l.id === "for-business" ? "for-business" : l.id}`}
              className={route.screen === l.id ? "active" : ""}
              aria-current={route.screen === l.id ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(l.id);
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="spacer" />
        <div className="flex g10 center">
          <CertifiedToggle />
          {user.loggedIn ? (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(user.role === "owner" ? "owner-dashboard" : "user-dashboard")}
              >
                <span className="avatar" style={{ width: 30, height: 30, fontSize: ".78rem" }}>
                  {(user.name || "U")[0]}
                </span>{" "}
                {user.name}
              </button>
              <button className="btn btn-gold btn-sm" onClick={() => navigate("add-listing")}>
                <Icon name="plus" size={17} /> Add listing
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("login")}>
                {t("nav.login")}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate("for-business")}>
                {t("nav.listBusiness")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------------- MOBILE TOP BAR + MENU DRAWER ---------------- */
export function MobileBar() {
  const { route, navigate, state, t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDialog(ref, close);
  const user = state.user;

  const go = (screen: string) => {
    close();
    navigate(screen);
  };

  const links: [string, string, string][] = [
    ["explore", t("nav.explore"), "search"],
    ["events", t("nav.events"), "calendar"],
    ["for-business", t("nav.forBusiness"), "store"],
    ["pricing", t("nav.pricing"), "tag"],
  ];
  const more: [string, string, string][] = [
    ["mosques", "Mosques near me", "mosque"],
    ["request-quote", "Request a quote", "doc"],
    ["advertise", "Advertise with us", "megaphone"],
    ["host-event", "Host an event", "ticket"],
    ["verify", "How we verify", "shield-check"],
    ["suggest", "Suggest a place", "plus"],
  ];

  return (
    <>
      <div className="hh-mobilebar">
        <Logo onClick={() => navigate("home")} />
        <div className="flex g8 center">
          <CertifiedToggle compact />
          <button
            className="mobilebar-burger"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Icon name="menu" size={24} />
          </button>
        </div>
      </div>

      {open && (
        <div
          className="nav-drawer-veil"
          onClick={(e) => {
            if ((e.target as HTMLElement).classList.contains("nav-drawer-veil")) setOpen(false);
          }}
        >
          <aside className="nav-drawer" ref={ref} role="dialog" aria-modal="true" aria-label="Menu">
            <div className="nav-drawer-head">
              <Logo onClick={() => go("home")} />
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: 8 }}
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <nav className="nav-drawer-links" aria-label="Primary">
              {links.map(([id, label, icon]) => (
                <button
                  key={id}
                  className={`nav-drawer-link ${route.screen === id ? "active" : ""}`}
                  aria-current={route.screen === id ? "page" : undefined}
                  onClick={() => go(id)}
                >
                  <Icon name={icon} size={20} />
                  <span>{label}</span>
                  <Icon name="arrow" size={16} className="nav-drawer-arrow" />
                </button>
              ))}
            </nav>

            <div className="nav-drawer-cta">
              {user.loggedIn ? (
                <>
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => go(user.role === "owner" ? "owner-dashboard" : "user-dashboard")}
                  >
                    <Icon name="user" size={18} /> {user.name || "Dashboard"}
                  </button>
                  <button className="btn btn-gold btn-block" onClick={() => go("add-listing")}>
                    <Icon name="plus" size={18} /> Add listing
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-block" onClick={() => go("for-business")}>
                    {t("nav.listBusiness")}
                  </button>
                  <button className="btn btn-outline btn-block" onClick={() => go("login")}>
                    {t("nav.login")}
                  </button>
                </>
              )}
            </div>

            <div className="nav-drawer-more">
              {more.map(([id, label, icon]) => (
                <button key={id} className="nav-drawer-morelink" onClick={() => go(id)}>
                  <Icon name={icon} size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ---------------- BOTTOM NAV (mobile) ---------------- */
export function BottomNav() {
  const { route, navigate, state, t } = useApp();
  const tabs = [
    { id: "home", icon: "home", label: t("tab.home") },
    { id: "explore", icon: "search", label: t("tab.search") },
    { id: "add-listing", icon: "plus", label: t("tab.add"), add: true },
    { id: "user-dashboard", icon: "heart", label: t("tab.saved") },
    {
      id: state.user.loggedIn
        ? state.user.role === "owner"
          ? "owner-dashboard"
          : "user-dashboard"
        : "login",
      icon: "user",
      label: t("tab.profile"),
    },
  ];
  return (
    <nav className="hh-tabbar" aria-label="Primary mobile">
      {tabs.map((t) =>
        t.add ? (
          <button
            key="add"
            className="hh-tab add"
            onClick={() => navigate("add-listing")}
            aria-label="Add a listing"
          >
            <span className="addbtn">
              <Icon name="plus" size={24} />
            </span>
          </button>
        ) : (
          <button
            key={t.label}
            className={`hh-tab ${route.screen === t.id ? "active" : ""}`}
            aria-current={route.screen === t.id ? "page" : undefined}
            onClick={() => navigate(t.id)}
          >
            <Icon name={t.icon} size={23} />
            <span>{t.label}</span>
          </button>
        ),
      )}
    </nav>
  );
}

/* ---------------- FOOTER ---------------- */
function LangToggle() {
  const { lang, setLang } = useApp();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button className={lang === "en" ? "on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>
        EN
      </button>
      <button className={lang === "ms" ? "on" : ""} aria-pressed={lang === "ms"} onClick={() => setLang("ms")}>
        BM
      </button>
    </div>
  );
}

export function Footer() {
  const { navigate } = useApp();
  const cols: [string, [string, string][]][] = [
    [
      "Discover",
      [
        ["Explore", "explore"],
        ["Halal travel & hotels", "travel"],
        ["Flights", "travel-flights"],
        ["My trips", "travel-trips"],
        ["Events", "events"],
        ["Map view", "map"],
        ["Saved places", "saved"],
        ["Mosques in Singapore", "mosques"],
        ["Blog & guides", "blog"],
        ["Request a quote", "request-quote"],
        ["Halal in Tampines", "seo"],
      ],
    ],
    [
      "For business",
      [
        ["List your business", "for-business"],
        ["Advertise with us", "advertise"],
        ["Host an event", "host-event"],
        ["Pricing", "pricing"],
        ["Claim a listing", "claim"],
      ],
    ],
    [
      "Trust & safety",
      [
        ["How we verify", "verify"],
        ["Is it halal? checker", "is-halal"],
        ["Halal disclaimer", "disclaimer"],
        ["Report an issue", "report"],
        ["Suggest a place", "suggest"],
      ],
    ],
    [
      "Company",
      [
        ["About us", "about"],
        ["Contact us", "contact"],
        ["FAQ", "faq"],
        ["Blog & guides", "blog"],
      ],
    ],
    [
      "Demo views",
      [
        ["User dashboard", "user-dashboard"],
        ["Owner dashboard", "owner-dashboard"],
        ["Admin console", "admin"],
        ["404 page", "404"],
      ],
    ],
  ];
  return (
    <footer className="hh-footer">
      <div className="hh-wrap hh-footer-grid">
        <div className="hh-footer-brand">
          <Logo light onClick={() => navigate("home")} />
          <p>
            Singapore’s most trusted halal &amp; Muslim-owned business directory. A discovery
            platform — not a certifier.
          </p>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Get the weekly halal guide
            </div>
            <Newsletter source="footer" />
          </div>
          <div className="flex g8 wrap" style={{ marginTop: 16 }}>
            <Badge type="muis" />
            <Badge type="owned" />
          </div>
          <address className="hh-footer-addr">
            Operated by <strong>{SITE.org.legalName}</strong>
            <br />
            {SITE.org.streetAddress}
            <br />
            {SITE.org.addressLocality} {SITE.org.postalCode}
          </address>
        </div>
        {cols.map(([title, links]) => (
          <div key={title} className="hh-footer-col">
            <div className="hh-footer-title">{title}</div>
            {links.map(([label, screen]) => (
              <a key={label} onClick={() => navigate(screen)}>
                {label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="hh-wrap hh-footer-cats">
        <span className="hh-footer-title">Browse by category</span>
        <div className="hh-footer-catlinks">
          <a onClick={() => navigate("seo", { slug: "halal-food-in-tampines" })}>Halal directory</a>
          {allSeoPages()
            .filter((p) => p.catId && !p.areaId)
            .map((p) => {
              const label = HHData.categories.find((c) => c.id === p.catId)?.label || p.catId;
              return (
                <a key={p.slug} onClick={() => navigate("seo", { slug: p.slug })}>
                  Halal {label}
                </a>
              );
            })}
        </div>
      </div>
      <nav className="hh-wrap hh-footer-legal" aria-label="Legal">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/pdpa">PDPA</a>
        <a href="/cookies">Cookies</a>
        <a href="/accessibility">Accessibility</a>
        <a href="/disclaimer">Halal disclaimer</a>
      </nav>
      <div className="hh-wrap hh-footer-base">
        <span>© 2026 Humble Halal. Built for the Singapore Muslim community.</span>
        <div className="flex g12 center">
          <span className="faint">Always verify certification on MUIS HalalSG.</span>
          <LangToggle />
        </div>
      </div>
    </footer>
  );
}
