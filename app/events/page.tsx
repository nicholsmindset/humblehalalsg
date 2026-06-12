import { EventsScreen } from "@/components/screens/events";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Halal-friendly events in Singapore", description: "Bazaars, classes, ta'lim and community gatherings hosted by Muslim-owned businesses across Singapore.", path: "/events" });

export default function Page() {
  return <EventsScreen />;
}
