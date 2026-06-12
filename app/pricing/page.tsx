import { PricingScreen } from "@/components/screens/business";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Pricing — Free, Verified, Featured & Premium", description: "Choose a plan to list and grow your halal or Muslim-owned business on Singapore's trusted directory.", path: "/pricing" });

export default function Page() {
  return <PricingScreen />;
}
