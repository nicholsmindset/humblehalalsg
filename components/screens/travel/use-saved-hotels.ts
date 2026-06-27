"use client";

/* Humble Halal — saved hotels (wishlist) for the travel vertical. Stores a
   lightweight snapshot of each Hotel in localStorage so /travel/saved renders
   instantly with no LiteAPI re-fetch and works offline / without Supabase
   (graceful-by-default, per the project posture). Supabase sync for logged-in
   users can layer on later. Mirrors the directory's saved pattern, snapshot-based
   because hotels are live LiteAPI data, not in-repo records. */
import { useLocalState } from "@/components/tools/use-local-state";
import type { Hotel } from "@/lib/halal-hotels";

export interface SavedHotel extends Hotel {
  savedAt: number;
}

const KEY = "hh.travel.saved";

export function useSavedHotels() {
  const { value, setValue, ready } = useLocalState<SavedHotel[]>(KEY, []);
  const isSaved = (id: string) => value.some((h) => h.id === id);
  const toggle = (hotel: Hotel) =>
    setValue((list) =>
      list.some((h) => h.id === hotel.id)
        ? list.filter((h) => h.id !== hotel.id)
        : [{ ...hotel, savedAt: Date.now() }, ...list],
    );
  const remove = (id: string) => setValue((list) => list.filter((h) => h.id !== id));
  return { saved: value, isSaved, toggle, remove, ready };
}
