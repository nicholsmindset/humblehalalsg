import { OwnerDashboardScreen } from "@/components/screens/business";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Business dashboard", description: "Manage your listings, events, reviews and analytics.", path: "/owner", index: false });

export default function Page() {
  return <OwnerDashboardScreen />;
}
