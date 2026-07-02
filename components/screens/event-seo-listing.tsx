/* Humble Halal — renderer for programmatic event SEO pages
   (/events/c/[slug] + /events/in/[slug], lib/event-seo-pages.ts). Server
   component: evergreen copy + FAQ render as static HTML; the event cards
   themselves are the existing client EventCard. Real events only — an empty
   page keeps its copy and funnels to /events + /host-event. */
import Link from "next/link";
import type { EventItem } from "@/lib/types";
import type { EventSeoPage } from "@/lib/event-seo-pages";
import { EventCard } from "@/components/screens/events";
import { EventSeoLinks } from "@/components/events/seo-links";

export function EventSeoListing({ page, events }: { page: EventSeoPage; events: EventItem[] }) {
  const sorted = [...events].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  return (
    <div className="screen-in hh-page">
      <section className="evt-hero hh-pattern">
        <div className="hh-wrap">
          <span className="eyebrow">
            {page.kind === "category" ? "Halal events by category" : "Halal events by area"}
          </span>
          <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.7rem)", maxWidth: 680, marginTop: 10 }}>{page.h1}</h1>
          <p className="muted" style={{ maxWidth: 620, marginTop: 10, fontSize: "1.05rem" }}>
            {page.intro}
          </p>
        </div>
      </section>

      <div className="hh-wrap">
        <section className="hh-section">
          <div className="flex between center" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.5rem" }}>Upcoming</h2>
            <span className="muted" style={{ fontWeight: 600 }}>
              {sorted.length} event{sorted.length === 1 ? "" : "s"}
            </span>
          </div>
          {sorted.length ? (
            <div className="evt-grid">
              {sorted.map((e) => (
                <EventCard key={e.id} ev={e} />
              ))}
            </div>
          ) : (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <p className="muted" style={{ maxWidth: 460, margin: "0 auto" }}>
                Nothing scheduled here right now — new events are added every week.
              </p>
              <p style={{ marginTop: 14 }}>
                <Link href="/events" className="hh-btn">
                  Browse all events
                </Link>{" "}
                <Link href="/host-event" className="hh-btn ghost" style={{ marginLeft: 8 }}>
                  Host an event
                </Link>
              </p>
            </div>
          )}
        </section>

        <section className="hh-section" style={{ paddingTop: 8 }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: 12 }}>Frequently asked</h2>
          <div style={{ display: "grid", gap: 12, maxWidth: 760 }}>
            {page.faq.map((f) => (
              <details key={f.q} className="hh-card" style={{ padding: "14px 16px" }}>
                <summary style={{ fontWeight: 700, cursor: "pointer" }}>{f.q}</summary>
                <p className="muted" style={{ marginTop: 8 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <EventSeoLinks exclude={page} />
      </div>
    </div>
  );
}
