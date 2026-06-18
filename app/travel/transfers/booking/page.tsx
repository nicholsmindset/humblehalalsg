import { TransferBookingScreen } from "@/components/screens/transfers";
import { getServerFlags } from "@/lib/flags";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Complete your transfer", description: "Book your airport transfer.", path: "/travel/transfers/booking", index: false });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <TransferBookingScreen
      searchId={String(sp.searchId || "")}
      resultId={String(sp.resultId || "")}
      vehicleClass={String(sp.vehicleClass || "")}
      total={String(sp.total || "")}
      currency={String(sp.currency || "USD")}
      pickup={String(sp.pickup || "")}
      dropoff={String(sp.dropoff || "")}
      pickupDateTime={String(sp.pickupDateTime || "")}
      passengers={Math.min(16, Math.max(1, Number(sp.passengers) || 1))}
      bookingEnabled={getServerFlags().paidTransfers}
    />
  );
}
