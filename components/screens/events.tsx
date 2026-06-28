"use client";

/* Humble Halal — Events: discovery, detail, checkout, host wizard, homepage strip
   (ported from screens-events.jsx). Owns the shared EventCard / EventPriceTag /
   EventDateChip / EventsStrip used by other screen modules. */
import { Fragment, useEffect, useMemo, useState, type MouseEvent } from "react";
import { HHData, spotsLeft } from "@/lib/data";
import { towns, REGIONS } from "@/lib/sg-locations";
import { useEvents } from "../events-context";
import type { EventItem, GenderArrangement } from "@/lib/types";
import { formatHijri, hijriSeason } from "@/lib/hijri";
import { screenToPath } from "@/lib/routes";
import { shareOrCopy } from "@/lib/share";
import { downloadIcs } from "@/lib/ics";
import { computeOrder } from "@/lib/fees";
import { useApp } from "../app-context";
import { Breadcrumbs } from "../breadcrumbs";
import { AddressAutocomplete } from "../biz/address-autocomplete";
import { Empty, Icon, ImagePh, MobileHeader, SearchBar, SectionHead } from "../ui";
import { SponsoredSlot } from "../sponsored-slot";

/* ---------- Islamic-layer helpers ---------- */
const GENDER_LABELS: Record<string, string> = {
  mixed: "Mixed / family seating",
  segregated: "Segregated seating",
  sisters: "Sisters only",
  brothers: "Brothers only",
};

/** Parse a label like "4:00 PM", "16:00" or "16:00–18:00" → minutes from midnight. */
function parseTimeToMins(s?: string): number | null {
  if (!s) return null;
  const part = s.split(/[–—-]/)[0].trim();
  const m = part.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

type PrayerRow = { name: string; time: string; mins: number };

/** Gentle banner when an event overlaps one or more prayer times. Fetches the
   day's Singapore prayer times and compares to the event window. Honest + opt-in:
   renders nothing if we can't determine an overlap. */
function PrayerAwareBanner({ ev }: { ev: EventItem }) {
  const [times, setTimes] = useState<PrayerRow[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/prayer-times")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j?.times) setTimes(j.times as PrayerRow[]); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const start = parseTimeToMins(ev.timeLabel);
  if (start == null || !times.length) return null;
  const end = parseTimeToMins(ev.endTime) ?? parseTimeToMins(ev.timeLabel.split(/[–—-]/)[1]) ?? start + 120;
  // Only the daily salah (skip Syuruk/sunrise, which isn't a prayer).
  const overlap = times.filter((t) => t.name.toLowerCase() !== "syuruk" && t.mins >= start - 10 && t.mins <= end);
  if (!overlap.length) return null;
  const names = overlap.map((t) => `${t.name} (${t.time})`).join(", ");
  return (
    <div className="notice" style={{ marginTop: 14, background: "var(--emerald-50)", borderColor: "var(--emerald-200)" }}>
      <Icon name="mosque" size={18} />
      <span>
        This event runs through <strong>{names}</strong>.{" "}
        {ev.prayerNearby
          ? "A prayer space is available at or near the venue, in shaa Allah."
          : <>Plan to pray nearby — <a href="/mosques" style={{ color: "var(--emerald)", fontWeight: 700 }}>find a mosque</a>.</>}
      </span>
    </div>
  );
}

/** Zakat / sadaqah donation panel for charity events — separate from tickets.
   Honest: shows the real running total only when the backend reports one. */
function DonatePanel({ ev }: { ev: EventItem }) {
  const { toast } = useApp();
  const [amount, setAmount] = useState(25);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const presets = [10, 25, 50, 100];
  const raised = ev.donationRaisedCents != null ? `S$${(ev.donationRaisedCents / 100).toLocaleString()}` : null;

  const donate = async () => {
    const amt = custom ? Math.round(Number(custom) * 100) : amount * 100;
    if (!(amt >= 100)) return toast("Enter an amount of at least S$1");
    setBusy(true);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: ev.id, amountCents: amt }),
      });
      const j = await res.json();
      if (j?.url) { window.location.href = j.url as string; return; }
      toast(j?.ok ? "Jazākallāhu khayran — donation recorded." : "Donations aren’t open yet — please try again later.");
    } catch { toast("Something went wrong — please try again."); }
    setBusy(false);
  };

  return (
    <div className="card" style={{ marginTop: 20, padding: 18, borderColor: "var(--emerald-200)" }}>
      <div className="flex between center">
        <h3 style={{ fontSize: "1.12rem", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="heart" size={18} /> Give zakat / sadaqah
        </h3>
        {raised && <span className="faint" style={{ fontSize: ".82rem" }}>{raised} raised</span>}
      </div>
      <p className="muted" style={{ fontSize: ".88rem", marginTop: 6 }}>
        100% supports this cause. Donations are separate from event entry.
      </p>
      <div className="pillbar" style={{ marginTop: 12, flexWrap: "wrap" }}>
        {presets.map((p) => (
          <button key={p} className={`chip ${!custom && amount === p ? "active" : ""}`} onClick={() => { setAmount(p); setCustom(""); }}>
            S${p}
          </button>
        ))}
        <input
          className="input" type="number" placeholder="Custom" style={{ maxWidth: 110 }}
          value={custom} onChange={(e) => setCustom(e.target.value)}
        />
      </div>
      <button className="btn btn-primary btn-block mt12" onClick={donate} disabled={busy}>
        {busy ? "Processing…" : "Donate"} <Icon name="heart" size={16} />
      </button>
    </div>
  );
}

/* ---------- Follow an organiser ---------- */
function FollowButton({ businessId }: { businessId: string }) {
  const { state, toast, navigate } = useApp();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/follow")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && Array.isArray(j?.following)) setFollowing(j.following.includes(businessId)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [businessId]);
  const toggle = async () => {
    if (!state.user.loggedIn) { toast("Sign in to follow organisers"); return navigate("login"); }
    setBusy(true);
    try {
      const res = await fetch("/api/follow", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, follow: !following }) });
      const j = await res.json();
      if (j?.ok) { setFollowing(j.following); setCount(j.count); }
      else if (j?.reason === "unauthenticated") { toast("Sign in to follow organisers"); navigate("login"); }
    } catch { toast("Couldn’t update — try again"); }
    setBusy(false);
  };
  return (
    <button className={`btn btn-sm ${following ? "btn-soft" : "btn-outline"}`} onClick={toggle} disabled={busy} aria-pressed={following}>
      <Icon name={following ? "check" : "plus"} size={15} /> {following ? "Following" : "Follow"}{count != null && count > 0 ? ` · ${count}` : ""}
    </button>
  );
}

/* ---------- Event ratings (honest: hidden until ≥1 published) ---------- */
type EvReview = { id: string; rating: number; text: string; author: string; createdAt: string };
function EventRatings({ ev }: { ev: EventItem }) {
  const { toast, state } = useApp();
  const [data, setData] = useState<{ avg: number | null; count: number; reviews: EvReview[] }>({ avg: null, count: 0, reviews: [] });
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const slug = ev.slug || ev.id;
  useEffect(() => {
    let alive = true;
    fetch(`/api/events/${encodeURIComponent(slug)}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j?.ok) setData({ avg: j.avg, count: j.count, reviews: j.reviews || [] }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);
  const submit = async () => {
    if (rating < 1) return toast("Pick a star rating");
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(slug)}/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text, name: state.user?.name }),
      });
      const j = await res.json();
      if (j?.ok) { setShow(false); setRating(0); setText(""); toast(j.pending ? "Jazākallāhu khayran — your rating is pending review." : "Thanks for the rating!"); }
      else toast("Couldn’t submit — try again");
    } catch { toast("Couldn’t submit — try again"); }
    setBusy(false);
  };
  return (
    <div style={{ marginTop: 24 }}>
      <div className="flex between center">
        <h3 style={{ fontSize: "1.2rem" }}>Ratings</h3>
        <button className="btn btn-soft btn-sm" onClick={() => setShow((s) => !s)}><Icon name="star" size={15} /> Rate this event</button>
      </div>
      {data.count > 0 ? (
        <div className="flex g8 center" style={{ marginTop: 8 }}>
          <Icon name="star" size={18} style={{ color: "var(--gold)" }} />
          <strong>{data.avg}</strong><span className="faint">· {data.count} rating{data.count > 1 ? "s" : ""}</span>
        </div>
      ) : (
        <p className="faint" style={{ marginTop: 8, fontSize: ".9rem" }}>No ratings yet — be the first after you attend.</p>
      )}
      {show && (
        <div className="card" style={{ marginTop: 12, padding: 14 }}>
          <div className="flex g4" style={{ marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <Icon name="star" size={26} style={{ color: (hover || rating) >= n ? "var(--gold)" : "var(--line-strong)", fill: (hover || rating) >= n ? "var(--gold)" : "none" }} />
              </button>
            ))}
          </div>
          <textarea className="textarea" placeholder="Share a little about your experience (optional)" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary btn-sm mt8" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit rating"}</button>
        </div>
      )}
      {data.reviews.length > 0 && (
        <div className="stack g10" style={{ marginTop: 12 }}>
          {data.reviews.slice(0, 5).map((r) => (
            <div key={r.id} className="card" style={{ padding: 12 }}>
              <div className="flex g6 center"><Icon name="star" size={14} style={{ color: "var(--gold)" }} /><strong>{r.rating}</strong><span className="faint" style={{ fontSize: ".82rem" }}>· {r.author}</span></div>
              {r.text && <p style={{ marginTop: 6, fontSize: ".92rem", color: "var(--ink-soft)" }}>{r.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Price / Free tag (clear distinction) ---------- */
export function EventPriceTag({ ev, lg, free }: { ev: EventItem; lg?: boolean; free?: boolean }) {
  const isFree = free ?? ev.free;
  if (isFree)
    return (
      <span className={`evt-price free ${lg ? "lg" : ""}`}>
        <Icon name="ticket" size={lg ? 15 : 13} /> Free
      </span>
    );
  return (
    <span className={`evt-price paid ${lg ? "lg" : ""}`}>
      from <strong>${ev.priceFrom}</strong>
    </span>
  );
}

/* ---------- Date block ---------- */
export function EventDateChip({ ev }: { ev: EventItem }) {
  const [, day] = ev.dateLabel.split(", ");
  const [mon, num] = (day || "").split(" ");
  return (
    <div className="evt-datechip">
      <span className="ed-mon">{mon}</span>
      <span className="ed-num">{num}</span>
    </div>
  );
}

/* Halal / Muslim-friendly attribute chips — our differentiator vs generic
   ticketing. Renders nothing for a plain mixed-seating event with no halal
   food or prayer space, so it only shows when there's something to flag. */
export function EventBadges({ ev, compact = false }: { ev: Pick<EventItem, "halalCatering" | "prayerNearby" | "genderArrangement">; compact?: boolean }) {
  const sz = compact ? 12 : 13;
  const g = ev.genderArrangement;
  return (
    <>
      {ev.halalCatering && <span className="tag halal-tag"><Icon name="utensils" size={sz} /> Halal food</span>}
      {ev.prayerNearby && <span className="tag halal-tag"><Icon name="mosque" size={sz} /> Prayer space</span>}
      {g && g !== "mixed" && <span className="tag"><Icon name="users" size={sz} /> {GENDER_LABELS[g]}</span>}
    </>
  );
}

/* ========================= EVENT CARD ========================= */
export function EventCard({ ev, variant }: { ev: EventItem; variant?: "row" }) {
  const { navigate, toggleEventSave, state, flags } = useApp();
  const saved = state.savedEvents.includes(ev.id);
  const effFree = ev.free || !flags.paidTickets;
  const left = spotsLeft(ev);
  const href = screenToPath("event-detail", { id: ev.id });
  const go = (e: MouseEvent) => {
    e.preventDefault();
    navigate("event-detail", { id: ev.id });
  };
  const cardLink = (
    <a className="card-stretch" href={href} aria-label={`${ev.title} — ${ev.dateLabel}, ${ev.area}`} onClick={go} />
  );
  const urgent = !ev.soldOut && left > 0 && left <= 10;

  if (variant === "row") {
    return (
      <div className="card card-hover evt-row">
        {cardLink}
        <ImagePh label={ev.cat.toLowerCase()} tone={ev.tone} src={ev.img} style={{ width: 96, flex: "none" }} />
        <div className="evt-row-body">
          <div className="flex between center g8">
            <span className="evt-cat">{ev.cat}</span>
            <EventPriceTag ev={ev} free={effFree} />
          </div>
          <div className="evt-name" style={{ fontSize: "1rem" }}>
            {ev.title}
          </div>
          <div className="evt-meta">
            <Icon name="calendar" size={13} /> {ev.dateLabel} · {ev.area}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover evt-card">
      {cardLink}
      <div className="evt-media">
        <ImagePh label={ev.cat.toLowerCase()} tone={ev.tone} src={ev.img} style={{ width: "100%", height: "100%" }} icon="calendar" />
        <EventDateChip ev={ev} />
        <button
          className="save-fab"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${ev.title} from saved` : `Save ${ev.title}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleEventSave(ev.id);
          }}
          style={{ position: "absolute", top: 10, right: 10, color: saved ? "var(--danger)" : "var(--ink-soft)" }}
        >
          <Icon name="heart" size={18} style={{ fill: saved ? "var(--danger)" : "none" }} />
        </button>
        <span className="evt-pricefab">
          <EventPriceTag ev={ev} free={effFree} />
        </span>
      </div>
      <div className="evt-body">
        <span className="evt-cat">{ev.cat}</span>
        <h3 className="evt-name">{ev.title}</h3>
        <div className="evt-meta">
          <Icon name="calendar" size={14} /> {ev.dateLabel} · {ev.timeLabel.split(" – ")[0]}
        </div>
        <div className="evt-meta">
          <Icon name="pin" size={14} /> {ev.venue}
        </div>
        {(() => {
          const s = ev.dateISO ? hijriSeason(ev.dateISO) : null;
          const hasMF = ev.halalCatering || ev.prayerNearby || (ev.genderArrangement && ev.genderArrangement !== "mixed");
          if (!s && !hasMF) return null;
          return (
            <div className="flex g6 wrap" style={{ marginTop: 6 }}>
              {s && <span className="tag" style={{ background: "var(--emerald-50)", color: "var(--emerald)", fontWeight: 700 }}><Icon name="moon" size={12} /> {s.label}</span>}
              <EventBadges ev={ev} compact />
            </div>
          );
        })()}
        <div className="evt-foot">
          <span className="evt-host">by {ev.organiser}</span>
          {ev.soldOut ? (
            <span className="evt-soldout">Sold out</span>
          ) : urgent ? (
            <span className="evt-left urgent">
              <Icon name="users" size={13} /> {left} spots left
            </span>
          ) : (
            <span className="evt-left">
              {/* Use ev.taken (same source as spotsLeft + the detail page) so the
                  "going" count reconciles between the list and detail (audit #11). */}
              <Icon name="users" size={13} /> {ev.taken} going{ev.capacity ? ` · ${left} left` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================= EVENTS DISCOVERY ========================= */
export function EventsScreen() {
  const { navigate, params, flags } = useApp();
  const { list: allEvents } = useEvents();
  const [cat, setCat] = useState((params.cat as string) || "");
  const [price, setPrice] = useState(""); // '', 'free', 'paid'
  const [area, setArea] = useState("");
  const [gender, setGender] = useState(""); // '', 'segregated', 'sisters', 'brothers', 'mixed'
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    let r = allEvents.slice();
    if (q) {
      const s = q.toLowerCase();
      r = r.filter((e) => (e.title + e.cat + e.venue + e.organiser + e.blurb).toLowerCase().includes(s));
    }
    if (cat) r = r.filter((e) => e.catId === cat);
    if (price === "free") r = r.filter((e) => e.free);
    if (price === "paid") r = r.filter((e) => !e.free);
    if (area) r = r.filter((e) => e.area.toLowerCase().includes(area));
    if (gender) r = r.filter((e) => e.genderArrangement === gender);
    return r;
  }, [q, cat, price, area, gender, allEvents]);

  const featured = allEvents.filter((e) => e.featured);

  return (
    <div className="screen-in hh-page">
      <section className="evt-hero hh-pattern">
        <div className="hh-wrap">
          <span className="eyebrow">Happening around Singapore</span>
          <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.7rem)", maxWidth: 680, marginTop: 10 }}>
            Halal-friendly events &amp; gatherings
          </h1>
          <p className="muted" style={{ maxWidth: 560, marginTop: 10, fontSize: "1.05rem" }}>
            Bazaars, classes, ta’lim and community days — hosted by Muslim-owned businesses and the
            community.
          </p>
          <div style={{ maxWidth: 580, marginTop: 18 }}>
            <SearchBar value={q} onChange={setQ} onSubmit={setQ} placeholder="Search events, hosts, venues…" />
          </div>
        </div>
      </section>

      <div className="hh-wrap">
        <div className="pillbar" style={{ marginTop: 20 }}>
          <button className={`chip ${!cat ? "active" : ""}`} onClick={() => setCat("")}>
            All events
          </button>
          {HHData.eventCats.map((c) => (
            <button
              key={c.id}
              className={`chip ${cat === c.id ? "active" : ""}`}
              onClick={() => setCat(cat === c.id ? "" : c.id)}
            >
              <Icon name={c.icon} size={15} /> {c.label}
            </button>
          ))}
        </div>

        <div className="flex between center wrap g10" style={{ marginTop: 14 }}>
          <div className="flex g8 center wrap">
            {flags.paidTickets && (
              <div className="evt-segment">
                <button className={!price ? "on" : ""} onClick={() => setPrice("")}>
                  All
                </button>
                <button className={price === "free" ? "on" : ""} onClick={() => setPrice("free")}>
                  Free
                </button>
                <button className={price === "paid" ? "on" : ""} onClick={() => setPrice("paid")}>
                  Paid
                </button>
              </div>
            )}
            <div className="sortwrap">
              <Icon name="pin" size={15} style={{ color: "var(--ink-soft)" }} />
              <select className="sort-select" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">All areas</option>
                {REGIONS.map((region) => (
                  <optgroup key={region} label={region}>
                    {towns.filter((t) => t.region === region).map((t) => (
                      <option key={t.id} value={t.name.split(" / ")[0].toLowerCase()}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="sortwrap">
              <Icon name="users" size={15} style={{ color: "var(--ink-soft)" }} />
              <select className="sort-select" value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Filter by seating arrangement">
                <option value="">Any seating</option>
                <option value="mixed">Mixed / family</option>
                <option value="segregated">Segregated</option>
                <option value="sisters">Sisters only</option>
                <option value="brothers">Brothers only</option>
              </select>
            </div>
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => navigate("host-event")}>
            <Icon name="plus" size={16} /> Host an event
          </button>
        </div>

        {/* SPONSORED — Event Promotion; renders only when a campaign is active */}
        <SponsoredSlot placement="event_featured" />

        {!cat && !price && !area && !gender && !q && (
          <section className="hh-section" style={{ paddingBottom: 8 }}>
            <SectionHead title="Featured events" />
            <div className="evt-grid">
              {featured.map((e) => (
                <EventCard key={e.id} ev={e} />
              ))}
            </div>
          </section>
        )}

        <section className="hh-section" style={{ paddingTop: !cat && !price && !area && !gender && !q ? 8 : 24 }}>
          <div className="flex between center" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.5rem" }}>
              {cat ? HHData.eventCats.find((c) => c.id === cat)?.label : "All events"}
            </h2>
            <span className="muted" style={{ fontWeight: 600 }}>
              {results.length} event{results.length !== 1 ? "s" : ""}
            </span>
          </div>
          {results.length === 0 ? (
            <Empty
              icon="calendar"
              title="No events match"
              body="Try a different category or area — or host one yourself."
              action="Host an event"
              onAction={() => navigate("host-event")}
            />
          ) : (
            <div className="evt-grid">
              {results.map((e) => (
                <EventCard key={e.id} ev={e} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ========================= EVENT DETAIL ========================= */
export function EventDetailScreen() {
  const { navigate, params, state, toggleEventSave, toast, flags } = useApp();
  const { get, list } = useEvents();
  const ev = get(String(params.slug || params.id || "")) || list[0];
  const saved = state.savedEvents.includes(ev.id);
  // Free unless the business set a price AND paid ticketing is switched on.
  const effFree = ev.free || !flags.paidTickets;
  const left = spotsLeft(ev);
  const pct = ev.capacity ? Math.min(100, Math.round((ev.taken / ev.capacity) * 100)) : 0;
  const org = ev.organiserId ? HHData.listings.find((l) => l.id === ev.organiserId) : null;
  const hijri = ev.dateISO ? formatHijri(ev.dateISO) : "";
  const season = ev.dateISO ? hijriSeason(ev.dateISO) : null;
  const genderLabel = GENDER_LABELS[ev.genderArrangement || ""] || "";

  const book = () => {
    if (ev.soldOut) return;
    navigate("checkout", { id: ev.id });
  };

  return (
    <div className="screen-in hh-page detail-screen">
      <MobileHeader
        title=""
        onBack={() => navigate("events")}
        right={
          <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => toggleEventSave(ev.id)}>
            <Icon
              name="heart"
              size={22}
              style={{ fill: saved ? "var(--danger)" : "none", color: saved ? "var(--danger)" : "var(--ink-soft)" }}
            />
          </button>
        }
      />

      <div className="evt-cover">
        <ImagePh label={ev.cat.toLowerCase()} tone={ev.tone} src={ev.img} style={{ position: "absolute", inset: 0 }} icon="calendar" priority sizes="100vw" />
        <div className="evt-cover-badges">
          <EventPriceTag ev={ev} lg free={effFree} />
          <span className="evt-cat-chip">{ev.cat}</span>
        </div>
      </div>

      <div className="hh-wrap" style={{ paddingTop: 12 }}>
        <Breadcrumbs
          items={[
            { name: "Home", screen: "home", href: "/" },
            { name: "Events", screen: "events", href: "/events" },
            { name: ev.title },
          ]}
        />
      </div>
      <div className="hh-wrap detail-body">
        <div className="detail-main">
          <h1 style={{ fontSize: "clamp(1.6rem,3.5vw,2.2rem)" }}>{ev.title}</h1>
          <div className="flex g14 wrap center" style={{ marginTop: 12 }}>
            <span className="evt-meta lg">
              <Icon name="calendar" size={17} /> {ev.dateLabel}
            </span>
            <span className="evt-meta lg">
              <Icon name="clock" size={17} /> {ev.timeLabel}
            </span>
            <span className="evt-meta lg">
              <Icon name="pin" size={17} /> {ev.area}
            </span>
            {hijri && (
              <span className="evt-meta lg" title="Approximate Islamic (Hijri) date">
                <Icon name="moon" size={16} /> {hijri}
              </span>
            )}
          </div>
          <div className="flex g8 wrap" style={{ marginTop: 10 }}>
            {season && (
              <span className="tag" style={{ background: "var(--emerald-50)", color: "var(--emerald)", fontWeight: 700 }}>
                <Icon name="moon" size={13} /> {season.label}
              </span>
            )}
            {genderLabel && (
              <span className="tag">
                <Icon name="users" size={13} /> {genderLabel}
              </span>
            )}
          </div>
          {ev.multiDay && (
            <div className="tag mt12">
              <Icon name="info" size={13} /> {ev.multiDay}
            </div>
          )}

          <PrayerAwareBanner ev={ev} />

          {!ev.soldOut && (
            <div className="evt-capacity">
              <div className="flex between center" style={{ marginBottom: 7 }}>
                <span style={{ fontWeight: 700, fontSize: ".9rem" }}>
                  {ev.taken} going{ev.capacity ? ` · ${left} spots left` : ""}
                </span>
                {left > 0 && left <= 10 && (
                  <span className="evt-left urgent" style={{ fontSize: ".78rem" }}>
                    Almost full
                  </span>
                )}
              </div>
              {ev.capacity ? (
                <div className="evt-bar">
                  <div className="evt-bar-fill" style={{ width: pct + "%" }} />
                </div>
              ) : null}
            </div>
          )}

          <div className="amenity-row">
            {ev.tags.map((t) => (
              <span key={t} className="tag">
                <Icon name="check" size={13} /> {t}
              </span>
            ))}
          </div>

          <hr className="divider" style={{ margin: "22px 0" }} />
          <h3 style={{ fontSize: "1.2rem" }}>About this event</h3>
          <p style={{ marginTop: 10, color: "var(--ink-soft)", lineHeight: 1.65, fontSize: "1.02rem" }}>
            {ev.blurb} Doors open 30 minutes before start. Come early to settle in and find your seat.
          </p>

          <div className="evt-info-grid">
            <div className="evt-info-item">
              <span className="attn-ico">
                <Icon name="mosque" size={17} />
              </span>
              <div>
                <div style={{ fontWeight: 700 }}>Prayer space</div>
                <span className="muted" style={{ fontSize: ".86rem" }}>
                  {ev.prayerSlotNote
                    ? ev.prayerSlotNote
                    : ev.prayerNearby
                      ? "Available at / near the venue"
                      : "None at venue — check nearby"}
                </span>
              </div>
            </div>
            <div className="evt-info-item">
              <span className="attn-ico">
                <Icon name="utensils" size={17} />
              </span>
              <div>
                <div style={{ fontWeight: 700 }}>Catering</div>
                <span className="muted" style={{ fontSize: ".86rem" }}>
                  {ev.halalCatering ? "Halal food / refreshments" : "No food provided"}
                </span>
              </div>
            </div>
            {genderLabel && (
              <div className="evt-info-item">
                <span className="attn-ico">
                  <Icon name="users" size={17} />
                </span>
                <div>
                  <div style={{ fontWeight: 700 }}>Seating</div>
                  <span className="muted" style={{ fontSize: ".86rem" }}>
                    {genderLabel}{ev.seatingNote ? ` — ${ev.seatingNote}` : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {ev.donationEnabled && <DonatePanel ev={ev} />}

          <h3 style={{ fontSize: "1.2rem", marginTop: 24 }}>Venue</h3>
          <div className="flex g8 center mt8">
            <Icon name="pin" size={16} style={{ color: "var(--emerald)" }} />
            <span className="muted">{ev.venue}</span>
          </div>
          <ImagePh label="venue map" tone="emerald" style={{ height: 180, borderRadius: 14, marginTop: 12 }} icon="map" />
          <a className="btn btn-outline mt12" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ev.venue} ${ev.area}`)}`} target="_blank" rel="noopener noreferrer">
            <Icon name="directions" size={17} /> Get directions
          </a>

          <h3 style={{ fontSize: "1.2rem", marginTop: 24 }}>Hosted by</h3>
          <div className="evt-organiser">
            <ImagePh
              label="host"
              tone={org ? org.tone : "emerald"}
              src={org ? org.image : undefined}
              style={{ width: 56, height: 56, borderRadius: 14, flex: "none" }}
              icon={ev.organiserBiz ? "store" : "mosque"}
            />
            <div className="f1">
              <div style={{ fontWeight: 700 }}>{ev.organiser}</div>
              <span className="muted" style={{ fontSize: ".86rem" }}>
                {org ? `${org.cuisine} · ${org.area}` : "Community organiser"}
              </span>
            </div>
            <div className="flex g8 center">
              {ev.organiserBiz && ev.organiserId && <FollowButton businessId={ev.organiserId} />}
              {org && (
                <button className="btn btn-soft btn-sm" onClick={() => navigate("detail", { id: org.id })}>
                  View profile <Icon name="arrow" size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="detail-footactions">
            <button className="btn btn-ghost" onClick={() => toggleEventSave(ev.id)}>
              <Icon name="heart" size={17} style={{ fill: saved ? "var(--danger)" : "none", color: saved ? "var(--danger)" : undefined }} />{" "}
              {saved ? "Saved" : "Save event"}
            </button>
            <button
              className="btn btn-outline"
              onClick={async () => {
                const r = await shareOrCopy({ title: ev.title, text: ev.blurb, path: `/events/${ev.slug}` });
                toast(r === "shared" ? "Shared" : r === "copied" ? "Link copied to clipboard" : "Couldn't share");
              }}
            >
              <Icon name="share" size={17} /> Share
            </button>
            <button
              className="btn btn-outline wa-share"
              onClick={() => {
                const url = `${window.location.origin}/events/${ev.slug}`;
                const text = `${ev.title} — ${ev.dateLabel}, ${ev.venue}.\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
              }}
              aria-label="Share this event on WhatsApp"
            >
              <Icon name="whatsapp" size={17} /> WhatsApp
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("report", { id: ev.id })}>
              <Icon name="flag" size={17} /> Report
            </button>
          </div>

          <EventRatings ev={ev} />
        </div>

        <aside className="detail-side">
          <div className="card evt-bookcard">
            <div className="flex between center">
              <EventPriceTag ev={ev} lg free={effFree} />
              {!ev.soldOut && ev.capacity && (
                <span className="faint" style={{ fontSize: ".8rem" }}>
                  {left} left
                </span>
              )}
            </div>
            {!effFree && ev.tiers && !ev.soldOut && (
              <div className="evt-tierlist">
                {ev.tiers.map((t) => (
                  <div key={t.name} className="evt-tier">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{t.name}</div>
                      <div className="faint" style={{ fontSize: ".78rem" }}>
                        {t.perks}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--emerald)" }}>${t.price}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary btn-block btn-lg mt12" disabled={ev.soldOut} onClick={book}>
              {ev.soldOut ? "Sold out" : effFree ? (ev.requiresApproval ? "Request to join" : "RSVP — it’s free") : "Get tickets"}
            </button>
            <button
              className="evt-addcal"
              onClick={() => {
                downloadIcs(ev);
                toast("Calendar file downloaded");
              }}
            >
              <Icon name="calendar" size={16} /> Add to calendar
            </button>
          </div>
        </aside>
      </div>

      <div className="detail-stickybar evt-stickybar">
        <div className="evt-sticky-price">
          <EventPriceTag ev={ev} lg free={effFree} />
          {!ev.soldOut && ev.capacity && (
            <span className="faint" style={{ fontSize: ".74rem" }}>
              {left} spots left
            </span>
          )}
        </div>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={ev.soldOut} onClick={book}>
          {ev.soldOut ? "Sold out" : effFree ? (ev.requiresApproval ? "Request to join" : "RSVP free") : "Get tickets"}
        </button>
      </div>
    </div>
  );
}

/* ========================= CHECKOUT / RSVP ========================= */
export function CheckoutScreen() {
  const { navigate, params, bookEvent, state, flags, toast } = useApp();
  const { get, list } = useEvents();
  const ev = get(String(params.id)) || list[0];
  const [tier, setTier] = useState(ev.tiers ? 0 : -1);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState(state.user.loggedIn ? state.user.name : "");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  // Free unless the event is priced AND paid ticketing is enabled.
  const free = ev.free || !flags.paidTickets;
  const unit = free ? 0 : ev.tiers ? ev.tiers[tier].price : ev.priceFrom;
  const order = computeOrder(unit * 100, qty); // cents
  const total = order.subtotalCents / 100;
  const fee = order.feeCents / 100;
  const tierName = free ? "RSVP" : ev.tiers ? ev.tiers[tier].name : "Standard";

  const confirm = async () => {
    if (free) {
      if (ev.requiresApproval) {
        setBusy(true);
        let okFlag = true;
        try {
          const r = await fetch(`/api/events/${ev.id}/join-request`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, qty }),
          });
          if (!r.ok) okFlag = false; // real server rejection (422 bad email / 429 rate-limit / 500)
        } catch { /* network error — treat as graceful (offline/unconfigured) */ }
        finally { setBusy(false); }
        if (!okFlag) { toast("Couldn't send your request — please try again."); return; }
        navigate("success", { type: "join-request", eventId: ev.id });
        return;
      }
      // Persist the RSVP server-side (order + ticket + QR, capacity-safe) so the
      // attendee gets a real scannable ticket; degrades to simulated when the
      // event row isn't seeded. Keep the local mock + success flow on success.
      setBusy(true);
      let okFlag = true;
      try {
        const r = await fetch(`/api/rsvp`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: ev.id, name, email, qty }),
        });
        if (!r.ok) okFlag = false; // 422 bad email / 429 rate-limit / 404 / 500
      } catch { /* network error — keep the local ticket (offline/unconfigured) */ }
      finally { setBusy(false); }
      if (!okFlag) { toast("Couldn't reserve your spot — please try again."); return; }
      bookEvent(ev.id, tierName, qty);
      navigate("success", { type: "rsvp", eventId: ev.id });
      return;
    }
    // Paid: ask the server for a Stripe Checkout URL; fall back to mock if unconfigured.
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: ev.id, tier: tierName, qty, name }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      // not configured / disabled — keep the demo flowing
      bookEvent(ev.id, tierName, qty);
      navigate("success", { type: "payment-event", eventId: ev.id });
    } catch {
      bookEvent(ev.id, tierName, qty);
      navigate("success", { type: "payment-event", eventId: ev.id });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen-in hh-page">
      <MobileHeader title={free ? "RSVP" : "Checkout"} onBack={() => navigate("event-detail", { id: ev.id })} />
      <div className="form-page" style={{ maxWidth: 720 }}>
        <div className="checkout-grid">
          <div>
            <div className="form-head">
              <span className="eyebrow">{free ? "Free RSVP" : "Secure checkout"}</span>
              <h1 style={{ fontSize: "1.6rem", marginTop: 8 }}>{free ? "Reserve your spot" : "Get your tickets"}</h1>
            </div>

            {!free && ev.tiers && (
              <div className="card form-card" style={{ marginBottom: 14 }}>
                <label style={{ fontWeight: 700, fontSize: ".9rem" }}>Ticket type</label>
                <div className="stack g8 mt12">
                  {ev.tiers.map((t, i) => (
                    <button key={t.name} className={`halal-opt ${tier === i ? "on" : ""}`} onClick={() => setTier(i)}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700 }}>{t.name}</div>
                        <div className="faint" style={{ fontSize: ".8rem" }}>
                          {t.perks}
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--emerald)" }}>${t.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="card form-card">
              <div className="flex between center">
                <label style={{ fontWeight: 700, fontSize: ".9rem" }}>{free ? "Guests" : "Quantity"}</label>
                <div className="qty-stepper">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Decrease">
                    <Icon name="minus" size={15} />
                  </button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(qty + 1)} aria-label="Increase">
                    <Icon name="plus" size={15} />
                  </button>
                </div>
              </div>
              <hr className="divider" style={{ margin: "16px 0" }} />
              <div className="stack g14">
                <div className="field">
                  <label>Full name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label>Mobile</label>
                  <input className="input" placeholder="+65 …" />
                </div>
                {!free && (
                  <div className="field">
                    <label>Card details</label>
                    <div className="card-input">
                      <Icon name="ticket" size={16} />
                      <input className="input" style={{ border: "none", padding: 0, boxShadow: "none" }} placeholder="4242 4242 4242 4242" />
                    </div>
                    <span className="hint">Secured by Stripe — you’ll complete payment on the next step.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside>
            <div className="card evt-summary">
              <div className="flex g10 center" style={{ paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
                <ImagePh label="event" tone={ev.tone} src={ev.img} style={{ width: 54, height: 54, borderRadius: 10, flex: "none" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".92rem", lineHeight: 1.25 }}>{ev.title}</div>
                  <div className="faint" style={{ fontSize: ".78rem", marginTop: 3 }}>
                    {ev.dateLabel} · {ev.area}
                  </div>
                </div>
              </div>
              <div className="stack g8" style={{ padding: "14px 0" }}>
                <div className="flex between">
                  <span className="muted">
                    {tierName} × {qty}
                  </span>
                  <span style={{ fontWeight: 600 }}>{free ? "Free" : `$${total.toFixed(2)}`}</span>
                </div>
                {!free && (
                  <div className="flex between">
                    <span className="muted">Booking fee</span>
                    <span style={{ fontWeight: 600 }}>${fee.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex between" style={{ paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: "1.2rem", fontFamily: "var(--serif)" }}>
                  {free ? "$0.00" : `$${(total + fee).toFixed(2)}`}
                </span>
              </div>
              <button className="btn btn-primary btn-block btn-lg mt16" onClick={confirm} disabled={!name || busy}>
                {busy ? "Redirecting…" : free ? (ev.requiresApproval ? "Request to join" : "Confirm RSVP") : `Pay $${(total + fee).toFixed(2)}`}
              </button>
              <p className="faint tc" style={{ fontSize: ".76rem", marginTop: 10 }}>
                {free ? "You can cancel your RSVP any time." : "Secure checkout via Stripe · refundable up to 48h before."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ========================= HOST AN EVENT WIZARD ========================= */
interface HostForm {
  title: string; cat: string; desc: string; date: string; time: string; endTime: string;
  venue: string; area: string; lat: number | null; lng: number | null; coverUrl: string;
  free: boolean; price: string; tierName: string; cap: string;
  photos: number; prayer: boolean; halal: boolean; prayerNote: string;
  gender: "" | GenderArrangement; seating: string; refundPolicy: string; donation: boolean;
  requiresApproval: boolean;
}
const REFUND_POLICIES = [
  { id: "", label: "No refunds" },
  { id: "flexible", label: "Flexible — full refund up to 48h before" },
  { id: "moderate", label: "Moderate — 50% refund up to 7 days before" },
];
export function HostEventScreen() {
  const { navigate, flags, toast } = useApp();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<HostForm>({
    title: "", cat: "", desc: "", date: "", time: "", endTime: "", venue: "", area: "",
    lat: null, lng: null, coverUrl: "",
    free: true, price: "", tierName: "Standard", cap: "", photos: 0,
    prayer: false, halal: false, prayerNote: "", gender: "", seating: "", refundPolicy: "", donation: false,
    requiresApproval: false,
  });
  const set = <K extends keyof HostForm>(k: K, v: HostForm[K]) => setD((s) => ({ ...s, [k]: v }));
  const steps = ["Details", "Date & venue", "Tickets", "Photos", "Review"];
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/events/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (j?.ok && j.url) set("coverUrl", j.url as string);
      else toast(j?.reason === "unauthenticated" ? "Sign in to upload photos" : j?.reason === "too_large" ? "Image is too large (max 5MB)" : "Upload isn’t available yet — you can add a photo later");
    } catch { toast("Couldn’t upload — try again"); }
    setUploading(false);
  };
  const hijri = d.date ? formatHijri(d.date) : "";
  const season = d.date ? hijriSeason(d.date) : null;
  const isCharity = d.cat === "charity";

  // Persist the event to Supabase as 'pending' (admin approves → published).
  // Degrades gracefully to the success screen when DB/auth isn't available.
  const submitEvent = async () => {
    setSubmitting(true);
    try {
      const catLabel = HHData.eventCats.find((c) => c.id === d.cat)?.label || "Community";
      const timeLabel = d.time ? d.time + (d.endTime ? `–${d.endTime}` : "") : "";
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: d.title, catId: d.cat, catLabel, desc: d.desc,
          dateISO: d.date, dateLabel: d.date, timeLabel, endTime: d.endTime || undefined,
          venue: d.venue, area: d.area,
          venueCoords: d.lat != null && d.lng != null ? { lat: d.lat, lng: d.lng } : undefined,
          coverUrl: d.coverUrl || undefined,
          free: d.free, price: Number(d.price) || 0,
          tiers: !d.free ? [{ name: d.tierName || "Standard", price: Number(d.price) || 0 }] : undefined,
          capacity: Number(d.cap) || 0,
          prayerNearby: d.prayer, halalCatering: d.halal, requiresApproval: d.requiresApproval,
          prayerSlotNote: d.prayerNote || undefined,
          genderArrangement: d.gender || undefined, seatingNote: d.seating || undefined,
          refundPolicy: REFUND_POLICIES.find((r) => r.id === d.refundPolicy)?.label || undefined,
          donationEnabled: isCharity && d.donation,
        }),
      });
    } catch { /* graceful — still show success */ }
    setSubmitting(false);
    navigate("success", { type: "event-listing" });
  };
  const next = () => (step < steps.length - 1 ? setStep(step + 1) : submitEvent());
  const prev = () => (step > 0 ? setStep(step - 1) : navigate("events"));

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Host an event" onBack={prev} />
      <div className="wizard">
        <div className="wizard-head hide-mob">
          <h1 style={{ fontSize: "1.7rem" }}>Host an event</h1>
          <p className="muted">
            Step {step + 1} of {steps.length} — {steps[step]}
          </p>
        </div>
        <div className="steps wizard-steps">
          {steps.map((s, i) => (
            <Fragment key={s}>
              <div className={`step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`}>
                <span className="num">{i < step ? <Icon name="check" size={15} /> : i + 1}</span>
                <span className="lbl hide-mob">{s}</span>
              </div>
              {i < steps.length - 1 && <span className={`bar ${i < step ? "done" : ""}`} />}
            </Fragment>
          ))}
        </div>

        <div className="card wizard-body">
          {step === 0 && (
            <div className="stack g16">
              <div className="field">
                <label>Event title</label>
                <input className="input" placeholder="e.g. Ramadan Cooking Workshop" value={d.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: ".88rem" }}>Category</label>
                <div className="pillbar" style={{ marginTop: 10, flexWrap: "wrap" }}>
                  {HHData.eventCats.map((c) => (
                    <button key={c.id} className={`chip ${d.cat === c.id ? "active" : ""}`} onClick={() => set("cat", c.id)}>
                      <Icon name={c.icon} size={15} /> {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="textarea" placeholder="What’s the event about?" value={d.desc} onChange={(e) => set("desc", e.target.value)} />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="stack g16">
              <div className="grid2">
                <div className="field">
                  <label>Date</label>
                  <input className="input" type="date" value={d.date} onChange={(e) => set("date", e.target.value)} />
                  {hijri && (
                    <span className="hint">
                      <Icon name="moon" size={13} /> {hijri}
                      {season && <strong style={{ marginLeft: 6, color: "var(--emerald)" }}>· {season.label}</strong>}
                    </span>
                  )}
                </div>
                <div className="grid2" style={{ gap: 10 }}>
                  <div className="field">
                    <label>Start</label>
                    <input className="input" type="time" value={d.time} onChange={(e) => set("time", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>End</label>
                    <input className="input" type="time" value={d.endTime} onChange={(e) => set("endTime", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="field">
                <label>Venue name &amp; address</label>
                <AddressAutocomplete
                  value={d.venue}
                  placeholder="Search venue, street or postal code"
                  onChange={(v) => setD((s) => ({ ...s, venue: v, lat: null, lng: null }))}
                  onPick={(r) => setD((s) => ({ ...s, venue: r.address, lat: r.lat, lng: r.lng }))}
                />
                <span className="hint">{d.lat != null ? "📍 Location pinned — attendees get directions & nearby prayer spaces." : "Tip: pick a result to pin the location for maps & prayer-aware info."}</span>
              </div>
              <div className="field">
                <label>Area</label>
                <select className="select" value={d.area} onChange={(e) => set("area", e.target.value)}>
                  <option value="">Select area</option>
                  {REGIONS.map((region) => (
                    <optgroup key={region} label={region}>
                      {towns.filter((t) => t.region === region).map((t) => (
                        <option key={t.id} value={t.name.split(" / ")[0]}>{t.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex g14 wrap">
                <label className="evt-check">
                  <input type="checkbox" checked={d.prayer} onChange={(e) => set("prayer", e.target.checked)} />{" "}
                  <span>
                    <Icon name="mosque" size={15} /> Prayer space available
                  </span>
                </label>
                <label className="evt-check">
                  <input type="checkbox" checked={d.halal} onChange={(e) => set("halal", e.target.checked)} />{" "}
                  <span>
                    <Icon name="utensils" size={15} /> Halal catering
                  </span>
                </label>
                <label className="evt-check">
                  <input type="checkbox" checked={d.requiresApproval} onChange={(e) => set("requiresApproval", e.target.checked)} />{" "}
                  <span>
                    <Icon name="shield-check" size={15} /> Require approval to join
                  </span>
                </label>
              </div>
              {d.prayer && (
                <div className="field">
                  <label>Prayer arrangement note <span className="faint">(optional)</span></label>
                  <input className="input" placeholder="e.g. Musholla on level 2, wudhu area available" value={d.prayerNote} onChange={(e) => set("prayerNote", e.target.value)} />
                </div>
              )}
              <div className="field">
                <label>Gender arrangement</label>
                <div className="pillbar" style={{ marginTop: 8, flexWrap: "wrap" }}>
                  {([
                    ["", "Not specified"], ["mixed", "Mixed / family"], ["segregated", "Segregated"],
                    ["sisters", "Sisters only"], ["brothers", "Brothers only"],
                  ] as [string, string][]).map(([id, label]) => (
                    <button key={id || "none"} className={`chip ${d.gender === id ? "active" : ""}`} onClick={() => set("gender", id as HostForm["gender"])}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {d.gender && d.gender !== "mixed" && (
                <div className="field">
                  <label>Seating note <span className="faint">(optional)</span></label>
                  <input className="input" placeholder="e.g. Sisters level 2, brothers level 1" value={d.seating} onChange={(e) => set("seating", e.target.value)} />
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="stack g16">
              <label style={{ fontWeight: 600, fontSize: ".88rem" }}>Is this a free or paid event?</label>
              {flags.paidTickets ? (
                <div className="evt-segment lg">
                  <button className={d.free ? "on" : ""} onClick={() => set("free", true)}>
                    <Icon name="ticket" size={15} /> Free RSVP
                  </button>
                  <button className={!d.free ? "on" : ""} onClick={() => set("free", false)}>
                    <Icon name="dollar" size={15} /> Paid tickets
                  </button>
                </div>
              ) : (
                <div className="notice notice-warn">
                  <Icon name="info" size={18} />
                  <span>
                    Free RSVP events only for now — <strong>paid tickets are coming soon</strong>. Set up your event
                    free today; you’ll be able to add paid tickets and payouts once it’s enabled.
                  </span>
                </div>
              )}
              {flags.paidTickets && !d.free && (
                <>
                  <div className="grid2">
                    <div className="field">
                      <label>Ticket price (SGD)</label>
                      <input className="input" type="number" placeholder="0.00" value={d.price} onChange={(e) => set("price", e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Ticket name</label>
                      <input className="input" placeholder="e.g. Standard" value={d.tierName} onChange={(e) => set("tierName", e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Refund policy</label>
                    <select className="select" value={d.refundPolicy} onChange={(e) => set("refundPolicy", e.target.value)}>
                      {REFUND_POLICIES.map((r) => <option key={r.id || "none"} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="field">
                <label>Capacity</label>
                <input className="input" type="number" placeholder="Max attendees" value={d.cap} onChange={(e) => set("cap", e.target.value)} />
                <span className="hint">We’ll show “spots left” as people book.</span>
              </div>
              {isCharity && (
                <label className="evt-check">
                  <input type="checkbox" checked={d.donation} onChange={(e) => set("donation", e.target.checked)} />{" "}
                  <span>
                    <Icon name="heart" size={15} /> Accept zakat / sadaqah donations (in addition to free RSVP)
                  </span>
                </label>
              )}
            </div>
          )}
          {step === 3 && (
            <div>
              <label style={{ fontWeight: 600, fontSize: ".88rem" }}>Cover photo</label>
              <p className="faint" style={{ fontSize: ".82rem", marginBottom: 12 }}>
                A bright cover photo helps your event stand out. JPG/PNG/WebP, up to 5MB.
              </p>
              {d.coverUrl ? (
                <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", maxWidth: 460 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.coverUrl} alt="Event cover" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <button className="btn btn-sm" style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)" }} onClick={() => set("coverUrl", "")}>
                    <Icon name="x" size={15} /> Replace
                  </button>
                </div>
              ) : (
                <label className="upload-zone" style={{ aspectRatio: "16/9", maxWidth: 460, cursor: uploading ? "wait" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="camera" size={24} />
                  <span style={{ fontSize: ".82rem", fontWeight: 700, marginTop: 6 }}>{uploading ? "Uploading…" : "Add cover photo"}</span>
                  <input
                    type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }}
                  />
                </label>
              )}
              <p className="hint" style={{ marginTop: 10 }}>Optional — you can add or change this later from your dashboard.</p>
            </div>
          )}
          {step === 4 && (
            <div className="stack g14">
              <h3 style={{ fontSize: "1.2rem" }}>Review &amp; publish</h3>
              <div className="review-summary-box">
                {(
                  [
                    ["Title", d.title || "—"],
                    ["Category", HHData.eventCats.find((c) => c.id === d.cat)?.label || "—"],
                    ["Date", d.date ? `${d.date}${hijri ? ` · ${hijri}` : ""}` : "—"],
                    ["Time", d.time ? d.time + (d.endTime ? `–${d.endTime}` : "") : "—"],
                    ["Area", d.area || "—"],
                    ["Pricing", d.free ? "Free RSVP" : d.price ? `$${d.price}` : "Paid"],
                    ["Capacity", d.cap || "—"],
                    ["Prayer space", d.prayer ? "Yes" : "—"],
                    ["Halal catering", d.halal ? "Yes" : "—"],
                    ["Gender arrangement", d.gender ? d.gender : "Not specified"],
                    ["Joining", d.requiresApproval ? "Approval required" : "Instant RSVP"],
                    ...(isCharity && d.donation ? [["Donations", "Zakat / sadaqah enabled"]] as [string, string][] : []),
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="rsb-row">
                    <span className="faint">{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="notice notice-warn">
                <Icon name="info" size={18} />
                <span>
                  Events are reviewed by our team before going live, usually within a day. Paid events
                  require a verified business profile.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-foot">
          <button className="btn btn-ghost" onClick={prev}>
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <button className="btn btn-primary" onClick={next} disabled={submitting}>
            {step === steps.length - 1 ? (submitting ? "Submitting…" : "Submit for review") : "Continue"}
            <Icon name="arrow" size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================= HOMEPAGE STRIP ========================= */
export function EventsStrip() {
  const { navigate } = useApp();
  const { list } = useEvents();
  const evs = list.filter((e) => e.featured).slice(0, 4);
  return (
    <section className="hh-wrap hh-section" style={{ paddingTop: 0 }}>
      <SectionHead title="Events happening soon" action="See all events" onAction={() => navigate("events")} />
      <div className="evt-grid">
        {evs.map((e) => (
          <EventCard key={e.id} ev={e} />
        ))}
      </div>
    </section>
  );
}
