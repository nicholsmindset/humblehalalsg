import type { Metadata } from "next";
import { EventManageScreen } from "@/components/screens/event-manage";
import { pageMeta } from "@/lib/seo";

/* Organiser-only event command center. Not indexed; access is enforced by the
   /api/events/[id]/stats + attendees + requests endpoints, not this page. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return pageMeta({ title: "Manage event", path: `/events/${slug}/manage`, index: false });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EventManageScreen slug={slug} />;
}
