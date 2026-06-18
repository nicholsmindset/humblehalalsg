import { MapScreen } from "@/components/screens/consumer";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Halal Map of Singapore — Food & Mosques Near You", description: "Find halal restaurants, Muslim-owned businesses and mosques nearby on an interactive map of Singapore.", path: "/map", absoluteTitle: true });

export default function Page() {
  return <MapScreen />;
}
