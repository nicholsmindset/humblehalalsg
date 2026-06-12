import { MapScreen } from "@/components/screens/consumer";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Halal map of Singapore", description: "Find halal restaurants, Muslim-owned businesses and nearby mosques on an interactive map of Singapore.", path: "/map" });

export default function Page() {
  return <MapScreen />;
}
