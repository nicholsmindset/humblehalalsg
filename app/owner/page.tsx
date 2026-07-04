import { OwnerDashboardScreen } from "@/components/screens/business";
import { pageMeta } from "@/lib/seo";
import { getServerFlags } from "@/lib/flags";

export const metadata = pageMeta({ title: "Business dashboard", description: "Manage your listings, events, reviews and analytics.", path: "/owner", index: false });

export default function Page() {
  // Server flags decide which flagged tabs show (dark until flipped on).
  const { leadRouting, passport } = getServerFlags();
  return <OwnerDashboardScreen leadRoutingEnabled={leadRouting} passportEnabled={passport} />;
}
