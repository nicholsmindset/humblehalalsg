import type { Metadata } from "next";
import { EventRequestsScreen } from "@/components/screens/event-requests";
import { pageMeta } from "@/lib/seo";

/* Organiser-only "request to join" queue. Not indexed; access is enforced by
   the /api/events/[id]/requests endpoint (organiser or admin), not this page. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return pageMeta({ title: "Join requests", path: `/events/${slug}/requests`, index: false });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EventRequestsScreen slug={slug} />;
}
