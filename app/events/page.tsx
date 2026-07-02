import { EventsScreen } from "@/components/screens/events";
import { getEvents } from "@/lib/events-source";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, eventListJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({ title: "Halal-friendly events in Singapore", description: "Bazaars, classes, ta'lim and community gatherings hosted by Muslim-owned businesses across Singapore.", path: "/events" });

// Hourly ISR so newly published events (and expired ones) surface without a
// deploy; mutations also revalidate on-demand via revalidatePublic().
export const revalidate = 3600;

export default async function Page() {
  const events = await getEvents();
  return (
    <>
      <JsonLd
        data={[
          eventListJsonLd(events),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
          ]),
        ]}
      />
      <EventsScreen />
    </>
  );
}
