"use client";

/* Humble Halal — saved stays (wishlist). Renders the hotels a traveller saved
   on this device (localStorage snapshots) so they can compare and book later.
   Each card's heart toggles it off. No login required; works offline. */
import Link from "next/link";
import { Icon, Empty } from "../../ui";
import { Crumbs } from "./shared";
import { HotelCard } from "./HotelCard";
import { useSavedHotels } from "./use-saved-hotels";

export function TravelSavedScreen() {
  const { saved, ready } = useSavedHotels();
  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: "Saved" }]} />
      <div className="hh-wrap hh-section">
        <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", margin: "0 0 4px" }}>Saved stays</h1>
        <p className="muted" style={{ margin: 0 }}>
          Hotels you&apos;ve saved to compare and book later{ready && saved.length > 0 ? ` · ${saved.length} saved` : ""}. Saved on this device.
        </p>

        {!ready ? (
          <div className="hotel-grid" style={{ marginTop: 18 }} aria-hidden />
        ) : saved.length === 0 ? (
          <div style={{ marginTop: 18 }}>
            <Empty icon="heart" title="No saved stays yet" body="Tap the heart on any hotel to keep it here for later — no account needed." />
            <div style={{ marginTop: 16 }}>
              <Link className="btn btn-primary" href="/travel">Browse Muslim-friendly hotels</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="hotel-grid" style={{ marginTop: 18 }}>
              {saved.map((h) => <HotelCard key={h.id} hotel={h} />)}
            </div>
            <div style={{ marginTop: 24 }}>
              <Link className="btn btn-soft" href="/travel"><Icon name="back" size={15} /> Keep browsing</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
