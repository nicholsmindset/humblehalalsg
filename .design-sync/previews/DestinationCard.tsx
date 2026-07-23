import { DestinationCard } from "humblehalalsg";

const kl = {
  slug: "kuala-lumpur",
  name: "Kuala Lumpur",
  cityName: "Kuala Lumpur",
  countryCode: "MY",
  country: "Malaysia",
  coords: { lat: 3.139, lng: 101.6869 },
  currency: "MYR",
  iata: "KUL",
  umrah: false,
  blurb: "Muslim-friendly hotels in Kuala Lumpur — halal food everywhere, surau prayer rooms and easy access to mosques.",
  h1: "Muslim-Friendly Hotels in Kuala Lumpur",
  title: "Muslim-friendly hotels in Kuala Lumpur, Malaysia",
};

const mecca = {
  slug: "mecca",
  name: "Mecca",
  cityName: "Makkah",
  countryCode: "SA",
  country: "Saudi Arabia",
  coords: { lat: 21.4225, lng: 39.8262 },
  currency: "SAR",
  iata: "JED",
  umrah: true,
  landmark: "Masjid al-Haram",
  blurb: "Hotels near Masjid al-Haram for Umrah and Hajj — walking distance to the Holy Mosque.",
  h1: "Hotels near Masjid al-Haram — Mecca for Umrah",
  title: "Mecca Umrah hotels — Muslim-friendly stays",
};

const bandung = {
  slug: "bandung",
  name: "Bandung",
  cityName: "Bandung",
  countryCode: "ID",
  country: "Indonesia",
  coords: { lat: -6.9175, lng: 107.6191 },
  currency: "IDR",
  iata: "BDO",
  umrah: false,
  blurb: "Muslim-friendly hotels in Bandung — halal dining, prayer facilities and cool highland air, a favourite weekend escape.",
  h1: "Muslim-Friendly Hotels in Bandung",
  title: "Muslim-friendly hotels in Bandung, Indonesia",
};

export const City = () => (
  <div style={{ maxWidth: 260 }}>
    <DestinationCard c={kl} />
  </div>
);

export const UmrahCity = () => (
  <div style={{ maxWidth: 260 }}>
    <DestinationCard c={mecca} />
  </div>
);

export const RegionalGetaway = () => (
  <div style={{ maxWidth: 260 }}>
    <DestinationCard c={bandung} />
  </div>
);
