import { AddListingScreen } from "@/components/screens/business";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Add your business listing", description: "Add your halal or Muslim-owned business to Singapore's trusted directory.", path: "/add-listing", index: false });

export default function Page() {
  return <AddListingScreen />;
}
