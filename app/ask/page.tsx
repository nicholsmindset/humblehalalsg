import { ConciergeScreen } from "@/components/screens/concierge";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Ask the halal concierge",
  description: "Describe what you want — area, cuisine, prayer space, halal status — and get matching MUIS-certified and Muslim-owned places in Singapore.",
  path: "/ask",
});

export default function Page() {
  return <ConciergeScreen />;
}
