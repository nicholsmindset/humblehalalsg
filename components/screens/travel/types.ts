/* Humble Halal — shared travel-screen types. */
import type { Hotel } from "@/lib/halal-hotels";

/** Resolved destination for the search box autocomplete. */
export interface Dest {
  label: string;
  placeId?: string;
  cityName?: string;
  countryCode?: string;
  currency?: string;
}

/** City price snapshot shown on the city hub. */
export interface CityPrice {
  city: string;
  avgUsd: number;
  minUsd: number;
  maxUsd: number;
  cheapestDay?: string;
}

/** Nearby mosque / halal-food point (from OpenStreetMap). */
export interface NearPlace {
  name: string;
  lat: number;
  lng: number;
  distanceM: number;
  cuisine?: string;
}

/** Weather forecast day. */
export interface WxDay {
  date: string;
  tempMin?: number;
  tempMax?: number;
  precipitation?: number;
}

/** LiteAPI prebook result for the booking flow. */
export interface Prebook {
  prebookId: string;
  transactionId: string | null;
  secretKey: string | null;
  currency: string;
  price: number | null;
  sellingPrice: number | null;
  commission: number | null;
}

/** A saved hotel booking shown on the trips page. */
export interface TripBooking {
  id: string;
  liteapi_booking_id?: string | null;
  hotel_confirmation_code?: string | null;
  liteapi_hotel_id?: string | null;
  hotel_name?: string | null;
  city?: string | null;
  country?: string | null;
  checkin?: string | null;
  checkout?: string | null;
  currency?: string | null;
  retail_total?: number | null;
  refundable_tag?: string | null;
  status: string;
  created_at?: string;
}

/** AI "Smart Highlights" card. */
export interface Highlight {
  icon: string;
  title: string;
  blurb: string;
}

/** Search-result client-side sort options. */
export type HotelSort = "halal" | "price" | "rating";

export type { Hotel };
