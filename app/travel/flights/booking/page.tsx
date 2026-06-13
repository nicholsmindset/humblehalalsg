import { FlightBookingScreen } from "@/components/screens/flights";
import { getServerFlags } from "@/lib/flags";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Complete your flight booking", description: "Book your flight.", path: "/travel/flights/booking", index: false });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <FlightBookingScreen
      offerId={String(sp.offerId || "")}
      from={String(sp.from || "")}
      to={String(sp.to || "")}
      date={String(sp.date || "")}
      price={String(sp.price || "")}
      currency={String(sp.currency || "USD")}
      bookingEnabled={getServerFlags().paidFlights}
    />
  );
}
