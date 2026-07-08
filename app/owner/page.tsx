import { OwnerDashboardScreen } from "@/components/screens/business";
import { pageMeta } from "@/lib/seo";
import { getServerFlags } from "@/lib/feature-flags";

export const metadata = pageMeta({ title: "Business dashboard", description: "Manage your listings, events, reviews and analytics.", path: "/owner", index: false });

export default async function Page() {
  // Server flag decides whether the Leads tab shows (dark until flipped on).
  const { leadRouting } = await getServerFlags();
  return <OwnerDashboardScreen leadRoutingEnabled={leadRouting} />;
}
