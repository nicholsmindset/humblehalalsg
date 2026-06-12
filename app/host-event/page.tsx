import { HostEventScreen } from "@/components/screens/events";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Host a halal-friendly event", description: "Create and manage free or paid events for the Singapore Muslim community on Humble Halal.", path: "/host-event" });

export default function Page() {
  return <HostEventScreen />;
}
