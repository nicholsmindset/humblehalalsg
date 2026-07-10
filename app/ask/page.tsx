import { notFound } from "next/navigation";
import { ConciergeScreen } from "@/components/screens/concierge";
import { getServerFlags } from "@/lib/feature-flags";
import { pageMeta } from "@/lib/seo";

// Flag-gated on demand (hawker/feature-tiktok pattern): an aiConcierge toggle
// must remove the whole surface, not just error its API calls.
export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Ask the halal concierge",
  description: "Describe what you want — area, cuisine, prayer space, halal status — and get matching MUIS-certified and Muslim-owned places in Singapore.",
  path: "/ask",
});

export default async function Page() {
  if (!(await getServerFlags()).aiConcierge) notFound();
  return <ConciergeScreen />;
}
