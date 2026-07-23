import { Carousel, DestinationCard } from "humblehalalsg";

const jb = {
  slug: "johor-bahru", name: "Johor Bahru", cityName: "Johor Bahru",
  countryCode: "MY", country: "Malaysia", coords: { lat: 1.4927, lng: 103.7414 },
  currency: "MYR", iata: "JHB", umrah: false,
  blurb: "Weekend halal food crawl — 45 minutes across the Causeway.",
  h1: "Muslim-friendly stays in Johor Bahru", title: "Johor Bahru halal getaway",
};
const bandung = {
  slug: "bandung", name: "Bandung", cityName: "Bandung",
  countryCode: "ID", country: "Indonesia", coords: { lat: -6.9175, lng: 107.6191 },
  currency: "IDR", iata: "BDO", umrah: false,
  blurb: "Cool highlands, Muslim-friendly cafés and factory outlets.",
  h1: "Muslim-friendly hotels in Bandung", title: "Bandung halal getaway",
};
const mecca = {
  slug: "mecca", name: "Mecca", cityName: "Makkah",
  countryCode: "SA", country: "Saudi Arabia", coords: { lat: 21.4225, lng: 39.8262 },
  currency: "SAR", iata: "JED", umrah: true, landmark: "Masjid al-Haram",
  blurb: "Umrah season — prayer-first stays within walking distance of the Haram.",
  h1: "Hotels near Masjid al-Haram", title: "Mecca Umrah hotels",
};

export const WithCards = () => (
  <div style={{ maxWidth: 760 }}>
    <Carousel title="Popular halal getaways" action="See all" ariaLabel="Halal getaways">
      <DestinationCard c={jb} />
      <DestinationCard c={bandung} />
      <DestinationCard c={mecca} />
    </Carousel>
  </div>
);

export const SimpleRow = () => (
  <div style={{ maxWidth: 760 }}>
    <Carousel title="This week's openings" ariaLabel="New openings">
      <div className="card" style={{ minWidth: 220, padding: 16 }}>
        <strong>Warung Bumbu Rempah</strong>
        <div style={{ color: "var(--ink-soft)", fontSize: ".85rem" }}>Nasi Padang · Tampines</div>
      </div>
      <div className="card" style={{ minWidth: 220, padding: 16 }}>
        <strong>Qahwa &amp; Co.</strong>
        <div style={{ color: "var(--ink-soft)", fontSize: ".85rem" }}>Specialty Coffee · Bugis</div>
      </div>
    </Carousel>
  </div>
);
