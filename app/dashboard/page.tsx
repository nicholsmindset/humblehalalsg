import { UserDashboardScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";
import { getServerFlags } from "@/lib/feature-flags";

export const metadata = pageMeta({ title: "Your dashboard", description: "Saved places, tickets, wishlist and reviews.", path: "/dashboard", index: false });

export default async function Page() {
  return <UserDashboardScreen passportEnabled={(await getServerFlags()).passport} />;
}
