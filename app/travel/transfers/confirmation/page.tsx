import { TransferConfirmationScreen } from "@/components/screens/transfers";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Your transfer", description: "Transfer booking confirmation.", path: "/travel/transfers/confirmation", index: false });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <TransferConfirmationScreen searchId={String(sp.searchId || "")} />;
}
