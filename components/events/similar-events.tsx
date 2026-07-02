/* Humble Halal — "You may also like" module for event detail pages. Server
   component: scoring runs at render (lib/similar-events), cards are the
   existing client EventCard. Renders nothing when no related upcoming events
   exist — never fabricated recommendations. */
import type { EventItem } from "@/lib/types";
import { similarEvents } from "@/lib/similar-events";
import { EventCard } from "@/components/screens/events";

export function SimilarEvents({ anchor, pool }: { anchor: EventItem; pool: EventItem[] }) {
  const recs = similarEvents(anchor, pool);
  if (!recs.length) return null;
  return (
    <section className="hh-wrap hh-section" style={{ paddingTop: 0 }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 16 }}>You may also like</h2>
      <div className="evt-grid">
        {recs.map((e) => (
          <EventCard key={e.id} ev={e} />
        ))}
      </div>
    </section>
  );
}
