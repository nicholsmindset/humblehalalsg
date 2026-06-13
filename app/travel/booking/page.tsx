import { TravelBookingScreen } from "@/components/screens/travel";
import { getServerFlags } from "@/lib/flags";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Book your stay", description: "Complete your halal-friendly hotel booking.", path: "/travel/booking", index: false });

export default function Page() {
  return <TravelBookingScreen bookingEnabled={getServerFlags().paidHotels} />;
}
