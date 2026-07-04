import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { getServerFlags } from "@/lib/flags";
import { LeaderboardScreen } from "@/components/screens/passport-leaderboard";

export const metadata = pageMeta({ title: "Halal Passport leaderboard", description: "Top members across Singapore's halal community this month.", path: "/passport/leaderboard", index: false });
export const dynamic = "force-dynamic";

export default function Page() {
  if (!getServerFlags().passport) notFound();
  return <LeaderboardScreen />;
}
