import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventManageScreen } from "@/components/screens/event-manage";
import { getEvents } from "@/lib/events-source";
import { pageMeta } from "@/lib/seo";

/* Organiser-only event command center. Not indexed; access is enforced by the
   /api/events/[id]/stats + attendees + requests endpoints, not this page. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return pageMeta({ title: "Manage event", path: `/events/${slug}/manage`, index: false });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Match slug OR id (mirrors events/[slug]/page.tsx). Only 404 when the events
  // source is live and has no match — an empty list means Supabase isn't
  // configured (dev/simulated mode) and the screen handles that itself.
  const events = await getEvents();
  if (events.length && !events.some((e) => e.slug === slug || e.id === slug)) notFound();
  return <EventManageScreen slug={slug} />;
}
