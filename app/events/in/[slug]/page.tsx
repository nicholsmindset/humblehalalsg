import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvents } from "@/lib/events-source";
import { getEventSeoPage, eventSeoPagesByKind, eventsForSeoPage } from "@/lib/event-seo-pages";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, eventItemListJsonLd } from "@/components/seo/json-ld";
import { EventSeoListing } from "@/components/screens/event-seo-listing";

/* Event AREA landing pages (/events/in/geylang-serai, /events/in/tampines, …) —
   the "things to do in {area}" cluster for the Muslim community, from
   lib/event-seo-pages.ts. Evergreen copy + real published events; hourly ISR. */
export const revalidate = 3600;

export function generateStaticParams() {
  return eventSeoPagesByKind("area").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getEventSeoPage("area", slug);
  if (!page) return pageMeta({ title: "Events", path: `/events/in/${slug}`, index: false });
  return pageMeta({ title: page.title, description: page.intro, path: `/events/in/${page.slug}` });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getEventSeoPage("area", slug);
  if (!page) notFound();
  const events = eventsForSeoPage(page, await getEvents());
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: page.h1, path: `/events/in/${page.slug}` },
          ]),
          faqJsonLd(page.faq),
          ...(events.length ? [eventItemListJsonLd(events, page.h1)] : []),
        ]}
      />
      <EventSeoListing page={page} events={events} />
    </>
  );
}
