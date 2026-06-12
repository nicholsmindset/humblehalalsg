import { ForBusinessScreen } from "@/components/screens/business";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "List your business on Humble Halal", description: "Get discovered by Singapore's Muslim community, build trust with verified halal labels, and turn searches into visits.", path: "/for-business" });

export default function Page() {
  return <ForBusinessScreen />;
}
