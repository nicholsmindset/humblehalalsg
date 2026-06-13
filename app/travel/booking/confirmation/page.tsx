import { TravelConfirmationScreen } from "@/components/screens/travel";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Booking confirmed", description: "Your halal-friendly hotel booking is confirmed.", path: "/travel/booking/confirmation", index: false });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <TravelConfirmationScreen reference={sp.ref} code={sp.code} hotel={sp.hotel} city={sp.city} />;
}
