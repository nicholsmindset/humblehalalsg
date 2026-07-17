import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventRequestsScreen } from "@/components/screens/event-requests";
import { getEvents } from "@/lib/events-source";
import { pageMeta } from "@/lib/seo";

/* Organiser-only "request to join" queue. Not indexed; access is enforced by
   the /api/events/[id]/requests endpoint (organiser or admin), not this page. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return pageMeta({ title: "Join requests", path: `/events/${slug}/requests`, index: false });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Match slug OR id (mirrors events/[slug]/page.tsx). Only 404 when the events
  // source is live and has no match — empty list = Supabase not configured.
  const events = await getEvents();
  if (events.length && !events.some((e) => e.slug === slug || e.id === slug)) notFound();
  return <EventRequestsScreen slug={slug} />;
}
