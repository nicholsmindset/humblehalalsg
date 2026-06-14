"use client";

/* Humble Halal — Events: discovery, detail, checkout, host wizard, homepage strip
   (ported from screens-events.jsx). Owns the shared EventCard / EventPriceTag /
   EventDateChip / EventsStrip used by other screen modules. */
import { Fragment, useMemo, useState, type MouseEvent } from "react";
import { HHData, spotsLeft } from "@/lib/data";
import { useEvents } from "../events-context";
import type { EventItem } from "@/lib/types";
import { screenToPath } from "@/lib/routes";
import { shareOrCopy } from "@/lib/share";
import { downloadIcs } from "@/lib/ics";
import { computeOrder } from "@/lib/fees";
import { useApp } from "../app-context";
import { Breadcrumbs } from "../breadcrumbs";
import { Empty, Icon, ImagePh, MobileHeader, SearchBar, SectionHead } from "../ui";

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
              <Icon name="users" size={13} /> {ev.attendees} going
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
    return r;
  }, [q, cat, price, area, allEvents]);

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
                {HHData.areas.map((a) => (
                  <option key={a.id} value={a.name.toLowerCase()}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-gold btn-sm" onClick={() => navigate("host-event")}>
            <Icon name="plus" size={16} /> Host an event
          </button>
        </div>

        {!cat && !price && !area && !q && (
          <section className="hh-section" style={{ paddingBottom: 8 }}>
            <SectionHead title="Featured events" />
            <div className="evt-grid">
              {featured.map((e) => (
                <EventCard key={e.id} ev={e} />
              ))}
            </div>
          </section>
        )}

        <section className="hh-section" style={{ paddingTop: !cat && !price && !area && !q ? 8 : 24 }}>
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
          </div>
          {ev.multiDay && (
            <div className="tag mt12">
              <Icon name="info" size={13} /> {ev.multiDay}
            </div>
          )}

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
                  {ev.prayerNearby ? "Available at / near the venue" : "None at venue — check nearby"}
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
          </div>

          <h3 style={{ fontSize: "1.2rem", marginTop: 24 }}>Venue</h3>
          <div className="flex g8 center mt8">
            <Icon name="pin" size={16} style={{ color: "var(--emerald)" }} />
            <span className="muted">{ev.venue}</span>
          </div>
          <ImagePh label="venue map" tone="emerald" style={{ height: 180, borderRadius: 14, marginTop: 12 }} icon="map" />
          <button className="btn btn-outline mt12" onClick={() => toast("Opening directions…")}>
            <Icon name="directions" size={17} /> Get directions
          </button>

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
            {org && (
              <button className="btn btn-soft btn-sm" onClick={() => navigate("detail", { id: org.id })}>
                View profile <Icon name="arrow" size={15} />
              </button>
            )}
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
            <button className="btn btn-ghost" onClick={() => navigate("report", { id: ev.id })}>
              <Icon name="flag" size={17} /> Report
            </button>
          </div>
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
              {ev.soldOut ? "Sold out" : effFree ? "RSVP — it’s free" : "Get tickets"}
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
          {ev.soldOut ? "Sold out" : effFree ? "RSVP free" : "Get tickets"}
        </button>
      </div>
    </div>
  );
}

/* ========================= CHECKOUT / RSVP ========================= */
export function CheckoutScreen() {
  const { navigate, params, bookEvent, state, flags } = useApp();
  const { get, list } = useEvents();
  const ev = get(String(params.id)) || list[0];
  const [tier, setTier] = useState(ev.tiers ? 0 : -1);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState(state.user.loggedIn ? state.user.name : "");
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
                  <input className="input" type="email" placeholder="you@email.com" defaultValue={state.user.loggedIn ? "aisyah@email.com" : ""} />
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
                {busy ? "Redirecting…" : free ? "Confirm RSVP" : `Pay $${(total + fee).toFixed(2)}`}
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
  title: string; cat: string; desc: string; date: string; venue: string;
  area: string; free: boolean; price: string; cap: string; photos: number;
}
export function HostEventScreen() {
  const { navigate, flags } = useApp();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<HostForm>({
    title: "", cat: "", desc: "", date: "", venue: "", area: "", free: true, price: "", cap: "", photos: 0,
  });
  const set = <K extends keyof HostForm>(k: K, v: HostForm[K]) => setD((s) => ({ ...s, [k]: v }));
  const steps = ["Details", "Date & venue", "Tickets", "Photos", "Review"];
  const next = () => (step < steps.length - 1 ? setStep(step + 1) : navigate("success", { type: "event-listing" }));
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
                </div>
                <div className="field">
                  <label>Start time</label>
                  <input className="input" type="time" />
                </div>
              </div>
              <div className="field">
                <label>Venue name &amp; address</label>
                <input className="input" placeholder="Venue, street, postal code" value={d.venue} onChange={(e) => set("venue", e.target.value)} />
              </div>
              <div className="field">
                <label>Area</label>
                <select className="select" value={d.area} onChange={(e) => set("area", e.target.value)}>
                  <option value="">Select area</option>
                  {HHData.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex g14 wrap">
                <label className="evt-check">
                  <input type="checkbox" />{" "}
                  <span>
                    <Icon name="mosque" size={15} /> Prayer space available
                  </span>
                </label>
                <label className="evt-check">
                  <input type="checkbox" />{" "}
                  <span>
                    <Icon name="utensils" size={15} /> Halal catering
                  </span>
                </label>
              </div>
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
                <div className="grid2">
                  <div className="field">
                    <label>Ticket price (SGD)</label>
                    <input className="input" type="number" placeholder="0.00" value={d.price} onChange={(e) => set("price", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Ticket name</label>
                    <input className="input" placeholder="e.g. Standard" />
                  </div>
                </div>
              )}
              <div className="field">
                <label>Capacity</label>
                <input className="input" type="number" placeholder="Max attendees" value={d.cap} onChange={(e) => set("cap", e.target.value)} />
                <span className="hint">We’ll show “spots left” as people book.</span>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <label style={{ fontWeight: 600, fontSize: ".88rem" }}>Event photos</label>
              <p className="faint" style={{ fontSize: ".82rem", marginBottom: 12 }}>
                A bright cover photo helps your event stand out.
              </p>
              <div className="photo-grid">
                <button className="upload-zone" style={{ aspectRatio: "1" }} onClick={() => set("photos", d.photos + 1)}>
                  <Icon name="camera" size={24} />
                  <span style={{ fontSize: ".78rem", fontWeight: 700, marginTop: 6 }}>Add photo</span>
                </button>
                {Array.from({ length: d.photos }).map((_, i) => (
                  <ImagePh key={i} label={`photo ${i + 1}`} tone="gold" ratio="1" />
                ))}
              </div>
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
                    ["Date", d.date || "—"],
                    ["Area", HHData.areas.find((a) => a.id === d.area)?.name || "—"],
                    ["Pricing", d.free ? "Free RSVP" : d.price ? `$${d.price}` : "Paid"],
                    ["Capacity", d.cap || "—"],
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
          <button className="btn btn-primary" onClick={next}>
            {step === steps.length - 1 ? "Submit for review" : "Continue"}
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
