import { ClaimScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Claim your business listing", description: "Own a business on Humble Halal? Claim your listing to manage info, respond to reviews and unlock analytics.", path: "/claim" });

export default function Page() {
  return <ClaimScreen />;
}
