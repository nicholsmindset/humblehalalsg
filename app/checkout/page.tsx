import { CheckoutScreen } from "@/components/screens/events";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Checkout",
  description: "Complete your booking on Humble Halal.",
  path: "/checkout",
  index: false,
});

export default function Page() {
  return <CheckoutScreen />;
}
