import type { Metadata } from "next";
import { CheckinScanner } from "@/components/screens/checkin";
import { pageMeta } from "@/lib/seo";

/* Organiser-only door check-in. Not indexed; access is enforced by the
   /api/tickets/checkin endpoint (organiser or admin), not by this page. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return pageMeta({ title: "Door check-in", path: `/events/${slug}/checkin`, index: false });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CheckinScanner slug={slug} />;
}
