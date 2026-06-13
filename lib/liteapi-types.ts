/* Humble Halal — LiteAPI v3.0 response types.
   Pragmatic, partial typings of the fields we actually read (LiteAPI returns a
   lot more). All optional + index-signature-tolerant so a shape change degrades
   gracefully rather than throwing. Field names match the live API:
   /data/hotel(s) → camelCase content; /hotels/rates → snake_case search hits. */

/** A facility entry from /data/hotel `facilities[]`. */
export interface LiteApiFacility {
  facilityId?: number;
  name?: string;
}

/** A room from /data/hotel `rooms[]` (metadata: photos, size, occupancy, amenities). */
export interface LiteApiRoom {
  id?: string | number;
  roomName?: string;
  description?: string;
  roomSizeSquare?: number;
  roomSizeUnit?: string;
  maxAdults?: number;
  maxChildren?: number;
  maxOccupancy?: number;
  bedTypes?: unknown;
  roomAmenities?: (string | { name?: string })[];
  photos?: { url?: string; hd_url?: string }[];
  [k: string]: unknown;
}

/** Static hotel content (/data/hotel, items of /data/hotels). */
export interface LiteApiHotelContent {
  id: string;
  name?: string;
  hotelDescription?: string;
  hotelImportantInformation?: string;
  hotelImages?: { url?: string; caption?: string; defaultImage?: boolean; order?: number }[];
  main_photo?: string;
  thumbnail?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  address?: string;
  zip?: string;
  starRating?: number;
  rating?: number; // guest review score (0–10)
  reviewCount?: number;
  location?: { latitude?: number; longitude?: number };
  hotelFacilities?: string[];
  facilities?: LiteApiFacility[];
  checkinCheckoutTimes?: { checkin?: string; checkout?: string };
  rooms?: LiteApiRoom[];
  sentiment_analysis?: { pros?: string[]; cons?: string[]; categories?: { name?: string; rating?: number; description?: string }[] };
  [k: string]: unknown;
}

/** A single bookable offer/rate inside a /hotels/rates hotel. */
export interface LiteApiOffer {
  offerId: string;
  name?: string;
  refundableTag?: string; // "RFN" | "NRF"
  retailRate?: { total?: { amount?: number; currency?: string }[]; [k: string]: unknown };
  commission?: { amount?: number; currency?: string }[] | { amount?: number }[];
  [k: string]: unknown;
}

/** A search hit from POST /hotels/rates `hotels[]`. */
export interface LiteApiRatesHotel {
  id: string;
  name?: string;
  main_photo?: string;
  thumbnail?: string;
  address?: string;
  country_code?: string;
  city_name?: string;
  rating?: number; // guest score 0–10
  stars?: number;
  review_count?: number;
  roomTypes?: { offerId?: string; rates?: LiteApiOffer[]; [k: string]: unknown }[];
  [k: string]: unknown;
}

export interface RatesSearchBody {
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
  currency: string; // ISO 4217
  guestNationality: string; // ISO country
  occupancies: { adults: number; children?: number[] }[];
  countryCode?: string;
  cityName?: string;
  placeId?: string;
  hotelIds?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
  timeout?: number;
}

/** A place suggestion from /data/places. */
export interface LiteApiPlace {
  placeId: string;
  displayName?: string;
  formattedAddress?: string;
  types?: string[];
}

/** An airport from /data/flights/airports. */
export interface LiteApiAirport {
  iata: string;
  name?: string;
  city?: string;
  country?: string;
  hasAirlineService?: boolean;
}

export interface FlightSearchBody {
  legs: { origin: string; destination: string; date: string; direction?: string }[];
  adults: number;
  children?: number;
  cabin?: string; // ECONOMY | PREMIUM_ECONOMY | BUSINESS | FIRST
  currency: string;
  sort?: string;
}

/** Ancillary service (seat or bag) selection for /flights/prebooks/{id}/services. */
export interface FlightServiceSelection {
  type: string; // "seat" | "bag"
  segmentKey?: string;
  passengerRef?: string;
  serviceId?: string;
  seatNumber?: string;
}

export interface FlightContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  phoneCountryCode?: string;
}

export interface FlightPassengerInput {
  firstName: string;
  lastName: string;
  birthday: string; // YYYY-MM-DD
  passengerType: number; // 0 adult, 1 child, 2 infant
  documentType: string; // "passport"
  documentNumber: string;
  documentIssueCountry: string;
  documentExpiry: string; // YYYY-MM-DD
  gender?: string; // M | F
  nationality?: string;
}

export interface PrebookResult {
  prebookId?: string;
  transactionId?: string;
  [k: string]: unknown;
}

export interface BookResult {
  bookingId?: string;
  status?: string;
  hotelConfirmationCode?: string;
  [k: string]: unknown;
}
