import { UserDashboardScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Your dashboard", description: "Saved places, tickets, wishlist and reviews.", path: "/dashboard", index: false });

export default function Page() {
  return <UserDashboardScreen />;
}
