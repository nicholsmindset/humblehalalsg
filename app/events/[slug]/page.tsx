import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailScreen } from "@/components/screens/events";
import { getEvents } from "@/lib/events-source";
import { pageMeta } from "@/lib/seo";
import { JsonLd, eventJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

// Real published events only (Supabase) — no mock. Empty until events are
// published, so no fabricated event pages are generated or served.
export async function generateStaticParams() {
  return (await getEvents()).map((e) => ({ slug: e.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = (await getEvents()).find((x) => x.slug === slug);
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
  const e = (await getEvents()).find((x) => x.slug === slug);
  if (!e) notFound(); // missing/unpublished event → clean 404 (never renders the screen without data)
  return (
    <>
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
      <EventDetailScreen />
    </>
  );
}
