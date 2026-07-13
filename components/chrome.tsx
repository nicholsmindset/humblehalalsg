"use client";

/* Humble Halal — app chrome (ported from app.jsx): TopNav, BottomNav, Footer,
   PrayerStrip, Onboarding, CertifiedToggle. */
import { useCallback, useEffect, useRef, useState } from "react";
import { HHData } from "@/lib/data";
import { REGIONS, townsInRegion } from "@/lib/sg-locations";
import { haversineKm } from "@/lib/geo";
import { SITE } from "@/lib/seo";
import { allSeoPages } from "@/lib/seo-pages";
import { allCategories } from "@/lib/blog-categories";
import { screenToPath } from "@/lib/routes";
import { track } from "@/lib/analytics";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "./notification-bell";
import { useApp } from "./app-context";
import { Badge, Icon, Logo, useBodyScrollLock, useDialog } from "./ui";
import { Newsletter } from "./newsletter";
import { ScreenLink } from "./screen-link";
import Link from "next/link";

/* Clerk's account control (manage account, security/MFA, sessions, sign out) is
   only shown when Clerk is configured; demo/mock mode keeps the custom buttons. */
const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/* ---------------- CERTIFIED-ONLY TOGGLE ---------------- */
export function CertifiedToggle({ compact }: { compact?: boolean }) {
  const { state, toggleCertifiedOnly, t } = useApp();
  const on = state.prefs && state.prefs.certifiedOnly;
  return (
    <button
      className={`cert-toggle ${on ? "on" : ""} ${compact ? "compact" : ""}`}
      onClick={() => { if (!on) track.filterUse("muis_certified"); toggleCertifiedOnly(); }}
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
  const { state, navigate, ramadan, toggleRamadan, ramadanModeEnabled } = useApp();
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

  // Nearest mosque via geolocation (was hardcoded to mosques[0], so it always
  // showed Masjid Sultan). Silent when location is already permitted; otherwise
  // the button asks for it on click.
  const [nearest, setNearest] = useState<{ name: string; area: string; km: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const findNearest = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) { navigate("map", { show: "mosques" }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // Stabilise: if we computed a nearest recently and the user hasn't moved
        // far, keep it — so GPS jitter can't flip between two similarly-close
        // mosques on every reload (the "sometimes changes" issue).
        try {
          const c = JSON.parse(localStorage.getItem("hh_nearest_mosque") || "null");
          if (c && Date.now() - c.at < 6 * 3600e3 && haversineKm(me, { lat: c.lat, lng: c.lng }) < 0.15) {
            setNearest({ name: c.name, area: c.area, km: c.km }); setLocating(false); return;
          }
        } catch { /* ignore cache */ }
        let best: { name: string; area: string; km: number } | null = null;
        for (const m of HHData.mosques) {
          if (!m.coords) continue;
          const km = haversineKm(me, m.coords);
          if (!best || km < best.km) best = { name: m.name, area: m.area, km };
        }
        setNearest(best);
        try { if (best) localStorage.setItem("hh_nearest_mosque", JSON.stringify({ ...best, lat: me.lat, lng: me.lng, at: Date.now() })); } catch { /* ignore */ }
        setLocating(false);
      },
      () => { setLocating(false); navigate("map", { show: "mosques" }); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [navigate]);
  // Show the last-known nearest mosque instantly on load (stable across reloads).
  useEffect(() => {
    try { const c = JSON.parse(localStorage.getItem("hh_nearest_mosque") || "null"); if (c?.name) setNearest({ name: c.name, area: c.area, km: c.km }); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (!nav?.permissions?.query) return;
    nav.permissions.query({ name: "geolocation" as PermissionName }).then((p) => { if (p.state === "granted") findNearest(); }).catch(() => {});
  }, [findNearest]);

  const next = pt.times[nextIndex] ?? pt.times[0];
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
        <button
          className="prayer-mosque"
          onClick={() => (nearest ? navigate("map", { show: "mosques" }) : findNearest())}
          aria-label={nearest ? `Nearest mosque: ${nearest.name}, ${nearest.km.toFixed(1)} km away — open map` : "Find the nearest mosque"}
        >
          <Icon name="pin" size={15} />{" "}
          <span>
            {locating ? (
              <strong>Locating…</strong>
            ) : nearest ? (
              <><strong>{nearest.name}</strong> · {nearest.km.toFixed(1)} km</>
            ) : (
              <strong>Find masjid near you</strong>
            )}
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
          {ramadanModeEnabled && (
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
          )}
        </div>
      )}
    </div>
    {ramadanModeEnabled && ramadan && (
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
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("Central");
  const [area, setArea] = useState("");
  const [strict, setStrict] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const finish = () => {
    setPref({ onboarded: true, homeArea: area, certifiedOnly: strict === "certified" });
    toast("Welcome to Humble Halal");
  };
  const skip = () => setPref({ onboarded: true });
  useDialog(ref, skip);
  useBodyScrollLock();

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
            {/* Region → town, covering all of Singapore (lib/sg-locations) —
                the old picker offered just six hardcoded areas. */}
            <div className="onboard-regions" role="tablist" aria-label="Region">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  role="tab"
                  aria-selected={region === r}
                  className={`onboard-chip region ${region === r ? "on" : ""}`}
                  onClick={() => setRegion(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="onboard-areas">
              {townsInRegion(region).map((t) => (
                <button
                  key={t.id}
                  className={`onboard-chip ${area === t.id ? "on" : ""}`}
                  onClick={() => setArea(t.id)}
                >
                  {t.name}
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
            <button className="btn btn-ghost btn-block btn-sm mt8" onClick={() => setStep(2)}>
              Skip — I move around
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
  const { navigate, state, t, flags } = useApp();
  const user = state.user;
  const links = [
    { id: "explore", label: t("nav.explore") },
    ...(flags?.hawkerFinder ? [{ id: "hawker", label: "Hawker" }] : []),
    { id: "ask", label: "Ask AI" },
    { id: "travel", label: "Travel" },
    { id: "events", label: t("nav.events") },
    { id: "tools", label: "Tools" },
    { id: "pricing", label: t("nav.pricing") },
  ];
  return (
    <header className="hh-topnav">
      <div className="hh-wrap inner">
        <Logo onClick={() => navigate("home")} />
        <nav aria-label="Primary">
          {links.map((l, i) => (
            <ScreenLink key={i} screen={l.id} activeClassName="active">
              {l.label}
            </ScreenLink>
          ))}
        </nav>
        <div className="spacer" />
        <div className="top-actions flex g8 center">
          <LangToggle />
          {user.loggedIn ? (
            <>
              <button
                className="btn btn-soft btn-sm nav-dashboard"
                onClick={() => navigate(user.role === "owner" ? "owner-dashboard" : "user-dashboard")}
              >
                <Icon name={user.role === "owner" ? "store" : "user"} size={16} /> Dashboard
              </button>
              {clerkConfigured && <NotificationBell />}
              {clerkConfigured ? (
                <UserButton appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }}>
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="My dashboard"
                      labelIcon={<Icon name="heart" size={15} />}
                      onClick={() => navigate("user-dashboard")}
                    />
                    {user.role === "owner" && (
                      <UserButton.Action
                        label="Business dashboard"
                        labelIcon={<Icon name="store" size={15} />}
                        onClick={() => navigate("owner-dashboard")}
                      />
                    )}
                  </UserButton.MenuItems>
                </UserButton>
              ) : (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate(user.role === "owner" ? "owner-dashboard" : "user-dashboard")}
                >
                  <span className="avatar" style={{ width: 30, height: 30, fontSize: ".78rem" }}>
                    {(user.name || "U")[0]}
                  </span>{" "}
                  {user.name}
                </button>
              )}
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
  const { navigate, state, t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDialog(ref, close);
  useBodyScrollLock(open);
  const user = state.user;

  const go = (screen: string) => {
    close();
    navigate(screen);
  };

  // Mobile primary nav — keep parity with desktop TopNav (audit #2: Ask AI,
  // Travel and Tools were missing from the drawer).
  const links: [string, string, string][] = [
    ["explore", t("nav.explore"), "search"],
    ["ask", "Ask AI", "sparkles"],
    ["travel", "Travel", "globe"],
    ["events", t("nav.events"), "calendar"],
    ["tools", "Tools", "grid"],
    ["blog", "Blog", "doc"],
    ["for-business", t("nav.forBusiness"), "store"],
    ["pricing", t("nav.pricing"), "tag"],
  ];
  const more: [string, string, string][] = [
    ["mosques", "Mosques near me", "mosque"],
    ["prayer-rooms", "Prayer rooms & musollahs", "mosque"],
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
          <LangToggle />
          {user.loggedIn && clerkConfigured && <NotificationBell />}
          {user.loggedIn && clerkConfigured && (
            <UserButton appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }} />
          )}
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
                <ScreenLink
                  key={id}
                  screen={id}
                  className="nav-drawer-link"
                  activeClassName="active"
                  intent
                  onClick={close}
                >
                  <Icon name={icon} size={20} />
                  <span>{label}</span>
                  <Icon name="arrow" size={16} className="nav-drawer-arrow" />
                </ScreenLink>
              ))}
            </nav>

            {/* Real anchors (crawlable, middle-clickable — audit #167); still
                close the drawer on tap. */}
            <div className="nav-drawer-cta">
              {user.loggedIn ? (
                <>
                  <ScreenLink
                    screen={user.role === "owner" ? "owner-dashboard" : "user-dashboard"}
                    className="btn btn-primary btn-block"
                    onClick={close}
                  >
                    <Icon name="user" size={18} /> {user.name || "Dashboard"}
                  </ScreenLink>
                  <ScreenLink screen="add-listing" className="btn btn-gold btn-block" onClick={close}>
                    <Icon name="plus" size={18} /> Add listing
                  </ScreenLink>
                </>
              ) : (
                <>
                  <ScreenLink screen="for-business" className="btn btn-primary btn-block" onClick={close}>
                    {t("nav.listBusiness")}
                  </ScreenLink>
                  <ScreenLink screen="login" className="btn btn-outline btn-block" onClick={close}>
                    {t("nav.login")}
                  </ScreenLink>
                </>
              )}
            </div>

            <div className="nav-drawer-more">
              {more.map(([id, label, icon]) => (
                <ScreenLink key={id} screen={id} className="nav-drawer-morelink" intent onClick={close}>
                  <Icon name={icon} size={16} />
                  <span>{label}</span>
                </ScreenLink>
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
  const { state, t } = useApp();
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
      {tabs.map((tab) =>
        tab.add ? (
          <ScreenLink key="add" screen="add-listing" className="hh-tab add" aria-label="Add a listing">
            <span className="addbtn">
              <Icon name="plus" size={24} />
            </span>
          </ScreenLink>
        ) : (
          <ScreenLink key={tab.label} screen={tab.id} className="hh-tab" activeClassName="active">
            <Icon name={tab.icon} size={23} />
            <span>{tab.label}</span>
          </ScreenLink>
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

/** Footer link group: plain heading + list on desktop; tap-to-expand accordion
    on ≤700px so the stacked footer stays short. The heading stays an <h2> for
    screen-reader outline; the toggle button only acts on small screens (CSS
    disables it above the breakpoint, where lists are forced visible). */
function FooterSection({ title, cloud, children }: { title: string; cloud?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`${cloud ? "hh-footer-cats" : "hh-footer-col"} ${open ? "open" : ""}`}>
      <h2 className="hh-footer-title">
        <button type="button" className="hh-footer-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {title}
          <span className="ftr-chev" aria-hidden="true"><Icon name="chevdown" size={15} /></span>
        </button>
      </h2>
      <ul className={cloud ? "hh-footer-catlinks" : "hh-footer-list"}>{children}</ul>
    </section>
  );
}

export function Footer() {
  const { navigate } = useApp();
  // Five balanced columns (≤6 links each) so the footer reads short + organised.
  // "Halal disclaimer" lives in the legal row only (it was duplicated here).
  const cols: [string, [string, string][]][] = [
    [
      "Discover",
      [
        ["Explore", "explore"],
        ["Events", "events"],
        ["Map view", "map"],
        ["Halal travel & hotels", "travel"],
        ["Flights", "travel-flights"],
        ["My trips", "travel-trips"],
      ],
    ],
    [
      "Community & tools",
      [
        ["Islamic tools", "tools"],
        ["Mosques in Singapore", "mosques"],
        ["Prayer rooms (musollah)", "prayer-rooms"],
        ["Saved places", "saved"],
        ["Blog & guides", "blog"],
      ],
    ],
    [
      "For business",
      [
        ["List your business", "for-business"],
        ["Owner getting-started", "for-business-onboarding"],
        ["Advertise with us", "advertise"],
        ["Host an event", "host-event"],
        ["Pricing", "pricing"],
        ["Claim a listing", "claim"],
        ["Request a quote", "request-quote"],
      ],
    ],
    [
      "Trust & safety",
      [
        ["How we verify", "verify"],
        ["Is it halal? checker", "is-halal"],
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
      ],
    ],
  ];
  // Category cloud: top links only + "All categories" — the full list made the
  // mobile footer scroll for screens.
  const catPages = allSeoPages().filter((p) => p.catId && !p.areaId).slice(0, 12);
  return (
    <footer className="hh-footer">
      <nav aria-label="Footer">
        <div className="hh-wrap hh-footer-grid">
          <div className="hh-footer-brand">
            <div>
              <Logo light onClick={() => navigate("home")} />
              <p className="hh-footer-intro">
                Singapore’s most trusted halal &amp; Muslim-owned business directory. A discovery
                platform, not a certifier.
              </p>
            </div>
            <div className="hh-footer-newsletter">
              <h2 className="hh-footer-title">Get the weekly halal guide</h2>
              <Newsletter source="footer" />
            </div>
            <div className="hh-footer-badges" aria-label="Trust badges">
              <Badge type="muis" />
              <Badge type="owned" />
            </div>
            <address className="hh-footer-addr">
              <span>Operated by <strong>{SITE.org.legalName}</strong></span>
              <br />
              {SITE.org.streetAddress}
              <br />
              {SITE.org.addressLocality} {SITE.org.postalCode}
              <br />
              Growth services by{" "}
              <a href="https://onnifyworks.com" target="_blank" rel="noopener noreferrer">Onnifyworks</a>
            </address>
          </div>
          <div className="hh-footer-links" aria-label="Footer sections">
            {cols.map(([title, links]) => (
              <FooterSection key={title} title={title}>
                {links.map(([label, screen]) => (
                  <li key={label}>
                    <ScreenLink screen={screen}>{label}</ScreenLink>
                  </li>
                ))}
              </FooterSection>
            ))}
          </div>
        </div>
        {/* One cloud row: categories (wide) + guides (bounded) side by side —
            two stacked full-width clouds doubled the footer's height. */}
        <div className="hh-wrap hh-footer-clouds">
          <FooterSection title="Browse by category" cloud>
            <li><Link href="/halal">Halal directory</Link></li>
            {catPages.map((p) => {
              const label = HHData.categories.find((c) => c.id === p.catId)?.label || p.catId;
              return (
                <li key={p.slug}>
                  <ScreenLink screen="seo" params={{ slug: p.slug }}>Halal {label}</ScreenLink>
                </li>
              );
            })}
            <li><Link href="/halal">All categories →</Link></li>
          </FooterSection>
          <FooterSection title="Halal guides" cloud>
            {allCategories().slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/blog/category/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
            <li><Link href="/blog">All guides →</Link></li>
          </FooterSection>
        </div>
      </nav>
      <nav className="hh-wrap hh-footer-legal" aria-label="Legal">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/pdpa">PDPA</Link>
        <Link href="/cookies">Cookies</Link>
        <Link href="/accessibility">Accessibility</Link>
        <Link href="/disclaimer">Halal disclaimer</Link>
      </nav>
      <div className="hh-wrap hh-footer-base">
        <span>© 2026 Humble Halal. Built for the Singapore Muslim community.</span>
        <div className="flex g12 center">
          <span className="faint">Always verify certification on MUIS HalalSG.</span>
        </div>
      </div>
    </footer>
  );
}
