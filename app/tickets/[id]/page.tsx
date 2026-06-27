import { TicketDetailScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Your ticket",
  description: "Your event ticket and entry QR code.",
  path: "/tickets",
  index: false,
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetailScreen ticketId={id} />;
}
