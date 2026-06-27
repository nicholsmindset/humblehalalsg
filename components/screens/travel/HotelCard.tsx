"use client";

/* Humble Halal — hotel result card (zzzello-grade, emerald brand).
   Image with verified halal overlay · gold stars · name · location ·
   distance-from-centre · emerald RatingBadge · honest price line. */
import Link from "next/link";
import Image from "next/image";
import { Icon } from "../../ui";
import { RatingBadge, Stars } from "../../ota";
import { activeFlagLabels, ratingWord, type Hotel } from "@/lib/halal-hotels";
import { isUnoptimizedImageSrc } from "@/lib/img";
import { HalalChip, countryLabel, dist } from "./shared";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const flags = activeFlagLabels(hotel.flags).slice(0, 3);
  // overlay distance to nearest mosque; in the holy cities that mosque is the Haram
  const haramCity = /mak+ah|mecca|mad[iī]nah|medina/i.test(hotel.city || "");
  return (
    <Link href={`/travel/hotel/${hotel.id}`} className="hotel-card">
      <div className="hotel-photo">
        {hotel.image ? (
          <Image src={hotel.image} alt={hotel.name} fill sizes="(max-width: 640px) 100vw, 290px" unoptimized={isUnoptimizedImageSrc(hotel.image)} style={{ objectFit: "cover" }} />
        ) : (
          <div className="ph-empty" aria-hidden />
        )}
        <HalalChip hotel={hotel} compact />
      </div>
      <div className="body">
        {hotel.stars ? <Stars count={hotel.stars} /> : null}
        <h3>{hotel.name}</h3>
        <div className="loc">
          <Icon name="pin" size={13} /> {hotel.city || ""}{hotel.country ? `, ${countryLabel(hotel.country)}` : ""}
        </div>
        {hotel.nearMosqueM != null && (
          <div className="card-haram"><Icon name="crescent" size={11} /> {dist(hotel.nearMosqueM)} {haramCity ? "to the Haram" : "to nearest mosque"}</div>
        )}
        {flags.length > 0 && (
          <div className="halal-flags">{flags.map((l) => <span key={l} className="halal-flag"><Icon name="check" size={11} /> {l}</span>)}</div>
        )}
        <div className="card-foot">
          {hotel.guestRating ? (
            <RatingBadge score={hotel.guestRating} count={hotel.reviewCount} word={ratingWord(hotel.guestRating)} />
          ) : <span />}
          {hotel.priceFrom ? (
            <span className="price">
              from {hotel.priceFrom.currency} {Math.round(hotel.priceFrom.amount)}
              <small> / night · incl. taxes</small>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
