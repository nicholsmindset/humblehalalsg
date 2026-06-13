import { FlightsScreen } from "@/components/screens/flights";
import { getServerFlags } from "@/lib/flags";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Flights — Halal Travel",
  description: "Search hundreds of airlines for Umrah, Hajj and Muslim travel, and plan flights alongside your halal-friendly hotel.",
  path: "/travel/flights",
});

export default function Page() {
  return <FlightsScreen bookingEnabled={getServerFlags().paidFlights} />;
}
