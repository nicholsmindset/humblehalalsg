import { ExploreScreen } from "@/components/screens/consumer";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Explore halal places in Singapore", description: "Search and filter halal restaurants, cafés, Muslim-owned shops and services across Singapore by area, price, halal status and more.", path: "/explore" });

export default function Page() {
  return <ExploreScreen />;
}
