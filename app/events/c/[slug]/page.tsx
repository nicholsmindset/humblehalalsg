import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEvents } from "@/lib/events-source";
import { getEventSeoPage, eventSeoPagesByKind, eventsForSeoPage } from "@/lib/event-seo-pages";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, eventItemListJsonLd } from "@/components/seo/json-ld";
import { EventSeoListing } from "@/components/screens/event-seo-listing";

/* Event CATEGORY landing pages (/events/c/bazaar, /events/c/workshop, …) —
   programmatic SEO cluster from lib/event-seo-pages.ts targeting §K keywords
   ("ramadan bazaar singapore", "islamic talks singapore", …). Evergreen copy +
   real published events; re-checked hourly. */
export const revalidate = 3600;

export function generateStaticParams() {
  return eventSeoPagesByKind("category").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getEventSeoPage("category", slug);
  if (!page) return pageMeta({ title: "Events", path: `/events/c/${slug}`, index: false });
  return pageMeta({ title: page.title, description: page.intro, path: `/events/c/${page.slug}` });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getEventSeoPage("category", slug);
  if (!page) notFound();
  const events = eventsForSeoPage(page, await getEvents());
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: page.h1, path: `/events/c/${page.slug}` },
          ]),
          faqJsonLd(page.faq),
          ...(events.length ? [eventItemListJsonLd(events, page.h1)] : []),
        ]}
      />
      <EventSeoListing page={page} events={events} />
    </>
  );
}
