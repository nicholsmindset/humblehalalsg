import { TravelBookingScreen } from "@/components/screens/travel";
import { getServerFlags } from "@/lib/flags";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Complete your booking", description: "Complete your halal-friendly hotel booking.", path: "/travel/booking", index: false });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <TravelBookingScreen
      offerId={String(sp.offerId || "")}
      hotelId={String(sp.hotelId || "")}
      hotelName={String(sp.hotel || "your hotel")}
      city={String(sp.city || "")}
      bookingEnabled={getServerFlags().paidHotels}
    />
  );
}
