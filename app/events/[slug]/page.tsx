import type { Metadata } from "next";
import { EventDetailScreen } from "@/components/screens/events";
import { getEvent, events } from "@/lib/data";
import { pageMeta } from "@/lib/seo";
import { JsonLd, eventJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getEvent(slug);
  if (!e) return pageMeta({ title: "Event", path: `/events/${slug}`, index: false });
  return pageMeta({
    title: `${e.title} — ${e.dateLabel}, ${e.area}`,
    description: `${e.blurb} ${e.free ? "Free RSVP" : `Tickets from $${e.priceFrom}`} · ${e.venue}.`,
    path: `/events/${e.slug}`,
    image: e.img,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = getEvent(slug);
  return (
    <>
      {e && (
        <JsonLd
          data={[
            eventJsonLd(e),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Events", path: "/events" },
              { name: e.title, path: `/events/${e.slug}` },
            ]),
          ]}
        />
      )}
      <EventDetailScreen />
    </>
  );
}
