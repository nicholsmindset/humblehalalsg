import { Suspense } from "react";
import { pageMeta } from "@/lib/seo";
import { BadgeGeneratorScreen } from "@/components/screens/badge-generator";

export const metadata = pageMeta({
  title: "Get your Humble Halal website badge",
  description:
    "Add a free Verified Halal badge to your website that links back to your Humble Halal listing — build trust with customers and get discovered.",
  path: "/for-business/badge",
});

export default function Page() {
  // BadgeGeneratorScreen reads useSearchParams() → needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <BadgeGeneratorScreen />
    </Suspense>
  );
}
