import { TravelTripsScreen, type TripBooking } from "@/components/screens/travel";
import { getSupabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "My trips", description: "Your halal hotel bookings.", path: "/travel/trips", index: false });
export const dynamic = "force-dynamic";

const COLS = "id, liteapi_booking_id, hotel_confirmation_code, liteapi_hotel_id, hotel_name, city, country, checkin, checkout, currency, retail_total, refundable_tag, status, created_at";

export default async function Page() {
  if (!supabaseConfigured) return <TravelTripsScreen loggedIn={false} bookings={[]} />;
  const db = await getSupabaseServer();
  const user = db ? (await db.auth.getUser()).data.user : null;
  if (!db || !user) return <TravelTripsScreen loggedIn={false} bookings={[]} />;

  const { data } = await db.from("hotel_bookings").select(COLS).eq("user_id", user.id).order("created_at", { ascending: false });
  return <TravelTripsScreen loggedIn bookings={(data as TripBooking[]) || []} />;
}
