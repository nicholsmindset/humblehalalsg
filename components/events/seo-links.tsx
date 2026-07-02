/* Humble Halal — internal-link block for the events SEO cluster. Pure data →
   renders on the server (SEO pages) AND inside the client /events screen, so
   crawlers reach every category/area page from the hub. Own file to avoid a
   circular import between events.tsx and event-seo-listing.tsx. */
import Link from "next/link";
import { eventSeoPagesByKind, eventSeoPath, type EventSeoPage } from "@/lib/event-seo-pages";

export function EventSeoLinks({ exclude }: { exclude?: EventSeoPage }) {
  const skip = (p: EventSeoPage) => exclude && p.kind === exclude.kind && p.slug === exclude.slug;
  const cats = eventSeoPagesByKind("category").filter((p) => !skip(p));
  const areas = eventSeoPagesByKind("area").filter((p) => !skip(p));
  return (
    <section className="hh-section" style={{ paddingTop: 8 }}>
      <h2 style={{ fontSize: "1.3rem", marginBottom: 6 }}>Browse halal events</h2>
      <p className="muted" style={{ marginBottom: 12 }}>By category</p>
      <p style={{ lineHeight: 2 }}>
        {cats.map((p, i) => (
          <span key={p.slug}>
            {i > 0 && <span className="muted"> · </span>}
            <Link href={eventSeoPath(p)}>{p.h1.replace(/ (in|for Muslim Families in) Singapore$/, "")}</Link>
          </span>
        ))}
      </p>
      <p className="muted" style={{ margin: "14px 0 12px" }}>By area</p>
      <p style={{ lineHeight: 2 }}>
        {areas.map((p, i) => (
          <span key={p.slug}>
            {i > 0 && <span className="muted"> · </span>}
            <Link href={eventSeoPath(p)}>{p.areaName}</Link>
          </span>
        ))}
      </p>
    </section>
  );
}
