import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailScreen } from "@/components/screens/events";
import { SimilarEvents } from "@/components/events/similar-events";
import { getEvents } from "@/lib/events-source";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";
import { pageMeta } from "@/lib/seo";
import { JsonLd, eventJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

// Real published events only (Supabase) — no mock. Empty until events are
// published, so no fabricated event pages are generated or served.
export async function generateStaticParams() {
  return (await getEvents()).map((e) => ({ slug: e.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Match slug OR id: event cards link via id (screenToPath) while events carry
  // a slug — matching both prevents direct-load / refresh / crawler 404s.
  const e = (await getEvents()).find((x) => x.slug === slug || x.id === slug);
  if (!e) return pageMeta({ title: "Event", path: `/events/${slug}`, index: false });
  return pageMeta({
    title: `${e.title} — ${e.dateLabel}, ${e.area}`,
    description: `${e.blurb} ${e.free ? "Free RSVP" : `Tickets from $${e.priceFrom}`} · ${e.venue}.`,
    path: `/events/${e.slug}`,
    image: e.img,
  });
}

/** True when the organiser business holds a current, admin-approved halal cert
 *  (Cert Vault). The badge only ever reflects a verified record — never
 *  self-declared — and the whole surface stays behind CERT_VAULT_ENABLED. */
async function organiserCertVerified(businessId: string | null): Promise<boolean> {
  if (!businessId || !getServerFlags().certVault) return false;
  const supa = getSupabaseAdmin();
  if (!supa) return false;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supa
      .from("halal_certs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "approved")
      .gte("expires_on", today);
    return (count ?? 0) > 0;
  } catch {
    return false; // badge is best-effort — absence is the safe default
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Match slug OR id: event cards link via id (screenToPath) while events carry
  // a slug — matching both prevents direct-load / refresh / crawler 404s.
  const events = await getEvents();
  const e = events.find((x) => x.slug === slug || x.id === slug);
  if (!e) notFound(); // missing/unpublished event → clean 404 (never renders the screen without data)
  const certVerified = await organiserCertVerified(e.organiserId);
  return (
    <>
      <JsonLd
        data={[
          eventJsonLd(e),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: e.title, path: `/events/${e.slug}` },
          ]),
        ]}
      />
      <EventDetailScreen certVerified={certVerified} />
      <SimilarEvents anchor={e} pool={events} />
    </>
  );
}
