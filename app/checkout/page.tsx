import { CheckoutScreen } from "@/components/screens/events";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Checkout — Humble Halal",
  description: "Complete your event ticket purchase or RSVP.",
  path: "/checkout",
  index: false,
});

export default function Page() {
  return <CheckoutScreen />;
}
