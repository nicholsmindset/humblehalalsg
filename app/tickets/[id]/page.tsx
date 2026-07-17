import { notFound } from "next/navigation";
import { TicketDetailScreen } from "@/components/screens/misc";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Your ticket",
  description: "Your event ticket and entry QR code.",
  path: "/tickets",
  index: false,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // tickets.id is a uuid (0001) — malformed ids can never resolve, so 404 now
  // instead of rendering a dead ticket shell. When Supabase is configured, also
  // 404 unknown ids; without it, keep the screen's simulated/dev behaviour.
  if (!UUID_RE.test(id)) notFound();
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb.from("tickets").select("id").eq("id", id).maybeSingle();
    if (!error && !data) notFound();
  }
  return <TicketDetailScreen ticketId={id} />;
}
