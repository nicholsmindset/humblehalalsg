import { redirect } from "next/navigation";
import { AdminScreen } from "@/components/screens/admin";
import { pageMeta } from "@/lib/seo";
import { isAdminOrUnconfigured } from "@/lib/admin-auth";
import { getServerFlags } from "@/lib/feature-flags";

export const metadata = pageMeta({ title: "Admin console", description: "Humble Halal administration.", path: "/admin", index: false });

export default async function Page() {
  // Live backend → admins only. No backend (dev/demo) → open so the mock UI works.
  if (!(await isAdminOrUnconfigured())) redirect("/login?next=/admin");
  const flags = await getServerFlags();
  return <AdminScreen halalVerdictsEnabled={flags.halalVerdicts} leadRoutingEnabled={flags.leadRouting} listingEnrichmentEnabled={flags.listingEnrichment} tiktokUgcEnabled={flags.tiktokUgc} />;
}
