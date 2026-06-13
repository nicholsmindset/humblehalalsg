import { FlightConfirmationScreen } from "@/components/screens/flights";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Flight confirmation", description: "Your flight booking.", path: "/travel/flights/confirmation", index: false });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <FlightConfirmationScreen reference={sp.ref} status={sp.status} from={sp.from} to={sp.to} date={sp.date} />;
}
