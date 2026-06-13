import { TravelConfirmationScreen } from "@/components/screens/travel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Booking confirmed", description: "Your halal-friendly hotel booking is confirmed.", path: "/travel/booking/confirmation", index: false });

export default function Page() {
  return <TravelConfirmationScreen />;
}
