import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OwnerDashboardScreen } from "@/components/screens/business";
import { pageMeta } from "@/lib/seo";
import { getServerFlags } from "@/lib/feature-flags";

export const metadata = pageMeta({ title: "Business dashboard", description: "Manage your listings, events, reviews and analytics.", path: "/owner", index: false });

export default async function Page() {
  // Gate like /admin: the dashboard is for signed-in owners only. Anonymous
  // visitors are redirected to sign-in (was: an empty "Your business / Free plan"
  // shell). The proxy matcher also protects /owner(.*); this is defence-in-depth
  // and pins the destination to /login?next=/owner. Stays open in dev/demo when
  // Clerk isn't configured so the mock UI still renders.
  if (process.env.CLERK_SECRET_KEY) {
    const { userId } = await auth();
    if (!userId) redirect("/login?next=/owner");
  }
  // Server flag decides whether the Leads tab shows (dark until flipped on).
  const { leadRouting } = await getServerFlags();
  return <OwnerDashboardScreen leadRoutingEnabled={leadRouting} />;
}
