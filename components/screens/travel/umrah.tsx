/* Humble Halal — Umrah hub (/travel/umrah).
   A discovery + booking-aid hub, NOT a packaged-tour operator: it helps pilgrims
   find Muslim-friendly hotels near the Haramain and live flights to Jeddah/Medina,
   plus an answer-first Umrah guide (informational long-tail). No religious, visa
   or medical ruling is asserted as authority — every such answer points to the
   proper source. Server component (static content + native <details> FAQ). */
import Link from "next/link";
import { Icon } from "../../ui";
import { Faq } from "../../faq";
import { Crumbs } from "./shared";
import type { QA } from "@/lib/faq";

export const UMRAH_FAQ: QA[] = [
  {
    q: "What is Umrah?",
    a: "Umrah is the non-mandatory (“lesser”) pilgrimage to Mecca that can be performed at any time of year, unlike Hajj which falls on fixed days. It involves entering the state of ihram, tawaf (circling the Kaʻbah seven times), saʻi (walking between Safa and Marwah) and then shaving or trimming the hair.",
  },
  {
    q: "What is the difference between Umrah and Hajj?",
    a: "Hajj is one of the five pillars of Islam — obligatory once for every Muslim who is able — and is performed only on specific days of Dhul-Hijjah. Umrah is optional, shorter, and can be done any time of year. Many pilgrims from Singapore perform Umrah several times across their life.",
  },
  {
    q: "What are the rukun (pillars) of Umrah?",
    a: "The commonly taught pillars are: making the intention (niyyah) and entering ihram at the miqat, performing tawaf around the Kaʻbah, performing saʻi between Safa and Marwah, and tahallul (shaving or trimming the hair) — performed in that order. For detailed rulings, follow a qualified scholar or your Umrah course.",
  },
  {
    q: "Do Singaporeans need a visa for Umrah?",
    a: "Singapore passport holders generally obtain a Saudi visa for Umrah (for example via the official Nusuk platform or an authorised agent). Entry rules change, so always confirm the current Saudi requirements before booking. Humble Halal does not process visas.",
  },
  {
    q: "What vaccinations are needed for Umrah from Singapore?",
    a: "Saudi Arabia typically requires proof of a valid meningococcal (ACWY) vaccination for pilgrims, and other vaccines may be advised. Requirements change year to year — check the latest Saudi and Singapore health advisories and book at a polyclinic or GP well in advance.",
  },
  {
    q: "How much does Umrah cost from Singapore?",
    a: "It varies widely with the season (Ramadan and school holidays are dearest), how close your hotel is to the Haramain, and flight prices. Flights and hotel proximity are the biggest variables — use the live flight search and Muslim-friendly hotel listings here to compare and build a trip to your budget.",
  },
  {
    q: "What is Badal Umrah?",
    a: "Badal Umrah is performing Umrah on behalf of someone who cannot do it themselves — for example a deceased relative or someone permanently unable to travel. It is permitted under certain conditions; consult a qualified scholar for the specifics of your situation.",
  },
  {
    q: "Is Humble Halal an Umrah travel agent?",
    a: "No. Humble Halal is a discovery and booking-aid platform — we help you find Muslim-friendly hotels near the Haramain and live flights to Jeddah and Medina. For packaged Umrah tours, visa handling and on-the-ground guidance, use an authorised Umrah agent.",
  },
];

function Tile({ href, icon, kicker, title, body, cta }: { href: string; icon: string; kicker: string; title: string; body: string; cta: string }) {
  return (
    <Link href={href} className="umrah-tile">
      <span className="umrah-tile-ico"><Icon name={icon} size={22} /></span>
      <span className="umrah-tile-kicker">{kicker}</span>
      <strong className="umrah-tile-title">{title}</strong>
      <span className="umrah-tile-body">{body}</span>
      <span className="umrah-tile-cta">{cta} <Icon name="arrow" size={14} /></span>
    </Link>
  );
}

export function UmrahHubScreen() {
  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: "Umrah" }]} />

      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <h1>Umrah from Singapore — Muslim-friendly hotels &amp; flights</h1>
          <p className="sub">Build your own Umrah trip: compare Muslim-friendly hotels within walking distance of the Haramain and search live flights to Jeddah and Medina, then book the parts you need.</p>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        <div className="umrah-tiles">
          <Tile href="/travel/mecca" icon="bed" kicker="Stay in Mecca" title="Hotels near Masjid al-Haram" body="Muslim-friendly stays within walking distance of the Holy Mosque, with prayer facilities and halal dining throughout." cta="Browse Mecca hotels" />
          <Tile href="/travel/medina" icon="bed" kicker="Stay in Medina" title="Hotels near Al-Masjid an-Nabawi" body="Stays minutes from the Prophet’s Mosque for Umrah and Ziyarah, with everything a pilgrim needs nearby." cta="Browse Medina hotels" />
          <Tile href="/travel/flights?to=JED" icon="plane" kicker="Fly to Mecca" title="Flights to Jeddah (JED)" body="Search live fares from Singapore to Jeddah — the usual gateway for Umrah — across hundreds of airlines." cta="Search Jeddah flights" />
          <Tile href="/travel/flights?to=MED" icon="plane" kicker="Fly to Medina" title="Flights to Medina (MED)" body="Search live fares from Singapore direct to Medina to start or end your journey at the Prophet’s Mosque." cta="Search Medina flights" />
        </div>

        <section className="umrah-intro" style={{ maxWidth: 760, marginTop: 40 }}>
          <h2 style={{ fontSize: "1.45rem", marginBottom: 10 }}>Planning Umrah from Singapore</h2>
          <p className="muted">Umrah can be performed any time of year, and the two choices that shape your trip most are <strong>which dates you fly</strong> and <strong>how close your hotel sits to the Haramain</strong>. Travelling outside Ramadan and the school holidays is typically far cheaper. Use the live flight search to find your dates, then pick a Muslim-friendly hotel near Masjid al-Haram or Al-Masjid an-Nabawi to match your budget and walking distance.</p>
          <p className="muted" style={{ marginTop: 12 }}>Humble Halal surfaces the facilities that matter — prayer rooms, halal dining nearby, alcohol-free options and proximity to the mosque — but we are a discovery platform, not a certifier or a licensed Umrah operator. For packaged tours, visa processing and religious guidance, use an authorised Umrah agent and a qualified scholar.</p>
        </section>

        <Faq items={UMRAH_FAQ} title="Umrah guide — frequently asked" eyebrow="Umrah essentials" />

        <p className="travel-disclaimer muted" style={{ maxWidth: 760, marginTop: 8, fontSize: ".85rem" }}>
          Visa, vaccination and religious details above are general information and change over time — always confirm current requirements with the Saudi authorities, Singapore health advisories and an authorised Umrah agent or qualified scholar. Humble Halal does not sell Umrah packages or process visas.
        </p>
      </div>
    </div>
  );
}
