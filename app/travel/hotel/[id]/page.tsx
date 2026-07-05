import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TravelHotelScreen } from "@/components/screens/travel";
import { hotelDetail } from "@/lib/travel-data";
import { getServerFlags } from "@/lib/feature-flags";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, hotelJsonLd } from "@/components/seo/json-ld";
import { qiblaBearing } from "@/lib/qibla";

function defaultDates() {
  const t = Date.now();
  const f = (d: number) => new Date(t + d * 864e5).toISOString().slice(0, 10);
  return { checkin: f(30), checkout: f(32), currency: "USD" };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = await hotelDetail(id);
  if (!d) return pageMeta({ title: "Hotel", path: `/travel/hotel/${id}`, index: false });
  const h = d.hotel;
  return pageMeta({
    title: `${h.name}${h.city ? ` — Muslim-friendly hotel in ${h.city}` : ""}`,
    description: (h.description || `Muslim-friendly hotel${h.city ? ` in ${h.city}` : ""}.`).slice(0, 160),
    path: `/travel/hotel/${id}`,
    image: h.image,
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const dates =
    sp.checkin && sp.checkout
      ? { checkin: String(sp.checkin), checkout: String(sp.checkout), currency: String(sp.currency || "USD") }
      : defaultDates();

  const d = await hotelDetail(id, dates);
  if (!d) notFound();

  const bookingEnabled = (await getServerFlags()).paidHotels;

  return (
    <>
      <JsonLd
        data={[
          hotelJsonLd(d.hotel),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Travel", path: "/travel" },
            ...(d.hotel.city ? [{ name: d.hotel.city, path: "/travel" }] : []),
            { name: d.hotel.name, path: `/travel/hotel/${id}` },
          ]),
        ]}
      />
      <TravelHotelScreen
        hotel={d.hotel}
        images={d.images}
        offers={d.offers}
        roomGroups={d.roomGroups}
        reviews={d.reviews}
        mosques={d.mosques}
        halalFood={d.halalFood}
        prayer={d.prayer}
        sentiment={d.sentiment}
        qibla={d.hotel.coords ? qiblaBearing(d.hotel.coords.lat, d.hotel.coords.lng) : null}
        bookingEnabled={bookingEnabled}
      />
    </>
  );
}
